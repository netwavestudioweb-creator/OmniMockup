'use client';

import React from 'react';
import { SceneOverlayPreset } from '@/types/analyzer';

interface SceneShadowOverlayProps {
  type: SceneOverlayPreset;
  opacity?: number;
}

export const SceneShadowOverlay: React.FC<SceneShadowOverlayProps> = ({
  type,
  opacity = 0.38,
}) => {
  if (!type || type === 'none') return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-25 transition-opacity duration-300"
      style={{ opacity, mixBlendMode: 'multiply' }}
    >
      {/* ── 1. STORES VÉNITIENS (BLINDS) ── */}
      {type === 'blinds' && (
        <svg
          className="w-full h-full object-cover filter blur-[14px]"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="blindsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <g transform="rotate(-25 500 500)">
            {Array.from({ length: 14 }).map((_, i) => (
              <rect
                key={i}
                x="-300"
                y={i * 110 - 200}
                width="1600"
                height="55"
                fill="url(#blindsGrad)"
                rx="6"
              />
            ))}
          </g>
        </svg>
      )}

      {/* ── 2. FEUILLES MONSTERA / PLANTES NATURELLES (LEAVES) ── */}
      {type === 'leaves' && (
        <svg
          className="w-full h-full filter blur-[18px]"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ombre de branche et grandes feuilles tropicales dans le coin supérieur gauche */}
          <path
            d="M-50 -80 C 120 40, 260 220, 340 420 C 310 320, 230 200, 110 90 Z"
            fill="#09090b"
          />
          <path
            d="M 60 120 C 220 180, 420 280, 520 460 C 440 400, 280 300, 150 210 Z"
            fill="#000000"
          />
          <path
            d="M -30 260 C 140 280, 320 380, 390 540 C 300 480, 160 410, 30 350 Z"
            fill="#000000"
          />
          {/* Branche latérale droite */}
          <path
            d="M 1050 -50 C 900 120, 780 260, 680 440 C 760 330, 890 200, 1020 90 Z"
            fill="#18181b"
          />
          <path
            d="M 980 220 C 840 320, 720 420, 610 590 C 700 500, 830 400, 960 310 Z"
            fill="#09090b"
          />
        </svg>
      )}

      {/* ── 3. PALMIER TROPICAL (PALM) ── */}
      {type === 'palm' && (
        <svg
          className="w-full h-full filter blur-[20px]"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(100, -80)">
            {Array.from({ length: 9 }).map((_, i) => {
              const angle = i * 14 - 40;
              return (
                <ellipse
                  key={i}
                  cx="500"
                  cy="200"
                  rx="380"
                  ry="35"
                  transform={`rotate(${angle} 500 200)`}
                  fill="#000000"
                />
              );
            })}
          </g>
        </svg>
      )}

      {/* ── 4. LUMIÈRE DE FENÊTRE (WINDOW) ── */}
      {type === 'window' && (
        <svg
          className="w-full h-full filter blur-[22px]"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="matrix(0.85 0.35 -0.3 0.9 200 50)">
            {/* 4 grands carreaux de fenêtre projetés */}
            <rect x="120" y="120" width="320" height="320" rx="16" fill="#000000" />
            <rect x="490" y="120" width="320" height="320" rx="16" fill="#000000" />
            <rect x="120" y="490" width="320" height="320" rx="16" fill="#000000" />
            <rect x="490" y="490" width="320" height="320" rx="16" fill="#000000" />
          </g>
        </svg>
      )}

      {/* ── 5. FORMES GÉOMÉTRIQUES 3D D'AMBIANCE (SHAPES) ── */}
      {type === 'shapes' && (
        <svg
          className="w-full h-full filter blur-[28px]"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="220" cy="220" r="160" fill="#4f46e5" opacity="0.45" />
          <circle cx="820" cy="780" r="220" fill="#ec4899" opacity="0.45" />
          <circle cx="780" cy="260" r="140" fill="#3b82f6" opacity="0.35" />
          <ellipse cx="320" cy="800" rx="200" ry="120" fill="#8b5cf6" opacity="0.35" />
        </svg>
      )}
    </div>
  );
};
