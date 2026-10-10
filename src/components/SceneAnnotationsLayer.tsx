'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SceneAnnotation } from '@/types/analyzer';

interface SceneAnnotationsLayerProps {
  annotations: SceneAnnotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, updates: Partial<SceneAnnotation>) => void;
  /** Taille de référence de la scène (pixels logiques) */
  width: number;
  height: number;
  /** Élément de la scène, pour convertir les déplacements du pointeur en pourcentages */
  sceneRef: React.RefObject<HTMLDivElement>;
  /** Magnétisme : renvoie la position aimantée et signale les repères affichés */
  snap?: (xPercent: number, yPercent: number) => { x: number; y: number };
  onDragEnd?: () => void;
  /** Capture affichée dans la loupe */
  loupeImage?: string;
}

type DragMode = 'move' | 'start' | 'end' | 'resize';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Annotations dessinées sur la scène : flèches, cadres, cercles, étapes numérotées et zones floutées.
 * Coordonnées en pourcentage de la scène ; rendu en pixels logiques (aucune déformation).
 * Les poignées de sélection portent data-export-hide et ne sont jamais exportées.
 */
export const SceneAnnotationsLayer: React.FC<SceneAnnotationsLayerProps> = ({
  annotations,
  selectedId,
  onSelect,
  onChange,
  width,
  height,
  sceneRef,
  snap,
  onDragEnd,
  loupeImage,
}) => {
  // Proportions de la capture (hauteur / largeur) pour cadrer la loupe
  const [imgRatio, setImgRatio] = useState(1);
  useEffect(() => {
    if (!loupeImage) return;
    const img = new Image();
    img.onload = () => img.naturalWidth && setImgRatio(img.naturalHeight / img.naturalWidth);
    img.src = loupeImage;
  }, [loupeImage]);
  const dragRef = useRef<{ id: string; mode: DragMode; startX: number; startY: number; orig: SceneAnnotation } | null>(null);

  const toPercentDelta = (dxClient: number, dyClient: number) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return { dx: 0, dy: 0 };
    return { dx: (dxClient / rect.width) * 100, dy: (dyClient / rect.height) * 100 };
  };

  const startDrag = (e: React.PointerEvent, a: SceneAnnotation, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onSelect(a.id);
    dragRef.current = { id: a.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...a } };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const { dx, dy } = toPercentDelta(e.clientX - d.startX, e.clientY - d.startY);
    const o = d.orig;
    if (d.mode === 'move') {
      if (o.kind === 'arrow') {
        onChange(d.id, {
          x: round1(o.x + dx),
          y: round1(o.y + dy),
          x2: round1((o.x2 ?? o.x) + dx),
          y2: round1((o.y2 ?? o.y) + dy),
        });
      } else {
        // Le centre de l'annotation est aimanté sur les axes de la scène
        const w = o.w ?? 0;
        const h = o.h ?? 0;
        let cx = clamp(o.x + dx + w / 2, 0, 100);
        let cy = clamp(o.y + dy + h / 2, 0, 100);
        if (snap) ({ x: cx, y: cy } = snap(cx, cy));
        onChange(d.id, { x: round1(cx - w / 2), y: round1(cy - h / 2) });
      }
    } else if (d.mode === 'start') {
      onChange(d.id, { x: round1(clamp(o.x + dx, 0, 100)), y: round1(clamp(o.y + dy, 0, 100)) });
    } else if (d.mode === 'end') {
      onChange(d.id, { x2: round1(clamp((o.x2 ?? o.x) + dx, 0, 100)), y2: round1(clamp((o.y2 ?? o.y) + dy, 0, 100)) });
    } else if (d.mode === 'resize' && o.kind === 'loupe') {
      // La loupe reste ronde
      const w = round1(clamp((o.w ?? 18) + dx, 6, 60));
      onChange(d.id, { w, h: round1((w * width) / height) });
    } else if (d.mode === 'resize') {
      onChange(d.id, { w: round1(clamp((o.w ?? 10) + dx, 2, 100)), h: round1(clamp((o.h ?? 10) + dy, 2, 100)) });
    }
  };

  const endDrag = () => {
    if (dragRef.current) onDragEnd?.();
    dragRef.current = null;
  };

  const px = (pct: number, total: number) => (pct / 100) * total;
  const stroke = Math.max(3, Math.round(Math.max(width, height) * 0.006));

  return (
    <>
      {/* Zones floutées : aperçu à l'écran. Le flou réel est appliqué sur l'image au moment de l'export. */}
      {annotations
        .filter((a) => a.kind === 'blur')
        .map((a) => (
          <div
            key={a.id}
            data-export-hide
            onPointerDown={(e) => startDrag(e, a, 'move')}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            className={`absolute z-[36] cursor-move touch-none rounded-lg ${
              selectedId === a.id ? 'ring-2 ring-violet-400' : 'ring-1 ring-white/30'
            }`}
            style={{
              left: `${a.x}%`,
              top: `${a.y}%`,
              width: `${a.w ?? 20}%`,
              height: `${a.h ?? 10}%`,
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              background: 'rgba(255,255,255,0.06)',
            }}
            title="Zone floutée (glisser pour déplacer)"
          >
            {selectedId === a.id && (
              <span
                data-export-hide
                onPointerDown={(e) => startDrag(e, a, 'resize')}
                className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-violet-500 border-2 border-white cursor-nwse-resize"
              />
            )}
          </div>
        ))}

      {/* Loupes : détail de la capture agrandi dans un cercle */}
      {loupeImage &&
        annotations
          .filter((a) => a.kind === 'loupe')
          .map((a) => {
            const D = px(a.w ?? 18, width);
            // Part de la largeur de la capture visible dans la loupe (≈ la taille de l'appareil divisée par le zoom)
            const frac = clamp((a.w ?? 18) / 60 / (a.zoom ?? 2), 0.03, 1);
            const bgW = D / frac;
            const bgH = bgW * imgRatio;
            const offX = clamp(((a.srcX ?? 50) / 100) * bgW - D / 2, 0, Math.max(0, bgW - D));
            const offY = clamp(((a.srcY ?? 10) / 100) * bgH - D / 2, 0, Math.max(0, bgH - D));
            return (
              <div
                key={a.id}
                onPointerDown={(e) => startDrag(e, a, 'move')}
                onPointerMove={onMove}
                onPointerUp={endDrag}
                className="absolute z-[38] cursor-move touch-none rounded-full"
                style={{
                  left: `${a.x}%`,
                  top: `${a.y}%`,
                  width: D,
                  height: D,
                  border: `${stroke}px solid ${a.color}`,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                  backgroundColor: '#fff',
                  backgroundImage: `url(${loupeImage})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${bgW}px ${bgH}px`,
                  backgroundPosition: `-${offX}px -${offY}px`,
                }}
                title="Loupe (glisser pour déplacer)"
              >
                {selectedId === a.id && (
                  <>
                    <span data-export-hide className="absolute -inset-2 rounded-full ring-2 ring-violet-400 pointer-events-none" />
                    <span
                      data-export-hide
                      onPointerDown={(e) => startDrag(e, a, 'resize')}
                      className="absolute right-0 bottom-0 w-4 h-4 rounded-full bg-violet-500 border-2 border-white cursor-nwse-resize"
                    />
                  </>
                )}
              </div>
            );
          })}

      <svg
        className="absolute inset-0 z-[37] overflow-visible"
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ pointerEvents: 'none' }}
        onPointerMove={onMove}
        onPointerUp={endDrag}
      >
        <defs>
          {annotations
            .filter((a) => a.kind === 'arrow')
            .map((a) => (
              <marker
                key={a.id}
                id={`arrowhead-${a.id}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={a.color} />
              </marker>
            ))}
        </defs>

        {annotations.map((a) => {
          const selected = selectedId === a.id;
          if (a.kind === 'blur' || a.kind === 'loupe') return null;

          if (a.kind === 'arrow') {
            const x1 = px(a.x, width);
            const y1 = px(a.y, height);
            const x2 = px(a.x2 ?? a.x + 10, width);
            const y2 = px(a.y2 ?? a.y, height);
            return (
              <g key={a.id}>
                {/* Zone de clic élargie */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth={stroke * 6}
                  style={{ pointerEvents: 'stroke', cursor: 'move' }}
                  onPointerDown={(e) => startDrag(e, a, 'move')}
                />
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={a.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  markerEnd={`url(#arrowhead-${a.id})`}
                  style={{ pointerEvents: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
                />
                {selected && (
                  <g data-export-hide>
                    <circle cx={x1} cy={y1} r={stroke * 2.2} fill="#7c3aed" stroke="#fff" strokeWidth={2}
                      style={{ pointerEvents: 'all', cursor: 'grab' }} onPointerDown={(e) => startDrag(e, a, 'start')} />
                    <circle cx={x2} cy={y2} r={stroke * 2.2} fill="#7c3aed" stroke="#fff" strokeWidth={2}
                      style={{ pointerEvents: 'all', cursor: 'grab' }} onPointerDown={(e) => startDrag(e, a, 'end')} />
                  </g>
                )}
              </g>
            );
          }

          if (a.kind === 'number') {
            const r = Math.round(Math.max(width, height) * 0.022);
            const cx = px(a.x, width);
            const cy = px(a.y, height);
            return (
              <g key={a.id} style={{ pointerEvents: 'all', cursor: 'move' }} onPointerDown={(e) => startDrag(e, a, 'move')}>
                <circle cx={cx} cy={cy} r={r} fill={a.color} stroke="#fff" strokeWidth={stroke * 0.8}
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#fff"
                  fontSize={r * 1.15} fontWeight={800} fontFamily="system-ui, sans-serif">
                  {a.label || '1'}
                </text>
                {selected && (
                  <circle data-export-hide cx={cx} cy={cy} r={r + stroke * 1.5} fill="none" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 4" />
                )}
              </g>
            );
          }

          // Cadre ou cercle
          const x = px(a.x, width);
          const y = px(a.y, height);
          const w = px(a.w ?? 20, width);
          const h = px(a.h ?? 12, height);
          const shapeProps = {
            fill: 'transparent',
            stroke: a.color,
            strokeWidth: stroke,
            style: { pointerEvents: 'stroke' as const, cursor: 'move', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' },
            onPointerDown: (e: React.PointerEvent) => startDrag(e, a, 'move'),
          };
          return (
            <g key={a.id}>
              {a.kind === 'ellipse' ? (
                <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...shapeProps} />
              ) : (
                <rect x={x} y={y} width={w} height={h} rx={stroke * 2} {...shapeProps} />
              )}
              {selected && (
                <circle data-export-hide cx={x + w} cy={y + h} r={stroke * 2.2} fill="#7c3aed" stroke="#fff" strokeWidth={2}
                  style={{ pointerEvents: 'all', cursor: 'nwse-resize' }} onPointerDown={(e) => startDrag(e, a, 'resize')} />
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
};
