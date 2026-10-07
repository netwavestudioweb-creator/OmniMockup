'use client';

import React, { useState } from 'react';
import {
  FRAME_PRESETS,
  FramePresetOption,
} from '@/lib/shotsPresets';
import { SceneAspectRatio } from '@/types/analyzer';
import {
  X,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Video,
  Circle,
} from 'lucide-react';

interface FrameSizePopoverProps {
  currentAspectRatio: SceneAspectRatio;
  currentWidth?: number;
  currentHeight?: number;
  onSelectPreset: (preset: FramePresetOption) => void;
  onCustomSize: (width: number, height: number) => void;
  onClose: () => void;
}

export const FrameSizePopover: React.FC<FrameSizePopoverProps> = ({
  currentAspectRatio,
  currentWidth = 1920,
  currentHeight = 1440,
  onSelectPreset,
  onCustomSize,
  onClose,
}) => {
  const [customW, setCustomW] = useState<string>(String(currentWidth));
  const [customH, setCustomH] = useState<string>(String(currentHeight));

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(customW, 10);
    const h = parseInt(customH, 10);
    if (!isNaN(w) && !isNaN(h) && w > 200 && h > 200) {
      onCustomSize(w, h);
      onClose();
    }
  };

  const geometricPresets = FRAME_PRESETS.filter((p) => p.category === 'Geometric');
  const instagramPresets = FRAME_PRESETS.filter((p) => p.category === 'Instagram');
  const twitterPresets = FRAME_PRESETS.filter((p) => p.category === 'Twitter');
  const youtubePresets = FRAME_PRESETS.filter((p) => p.category === 'YouTube');
  const pinterestPresets = FRAME_PRESETS.filter((p) => p.category === 'Pinterest');
  const dribbblePresets = FRAME_PRESETS.filter((p) => p.category === 'Dribbble');
  const appStorePresets = FRAME_PRESETS.filter((p) => p.category === 'App Store');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181b] border border-zinc-800 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header avec champs custom W / H */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/90 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Dimensions & Ratios du Canvas
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Saisie personnalisée W / H / Set */}
          <form onSubmit={handleApplyCustom} className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 focus-within:border-violet-500">
              <span className="text-xs font-bold font-mono text-zinc-500 mr-2">W</span>
              <input
                type="number"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                placeholder="1920"
                className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 focus-within:border-violet-500">
              <span className="text-xs font-bold font-mono text-zinc-500 mr-2">H</span>
              <input
                type="number"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                placeholder="1440"
                className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-zinc-800 hover:bg-violet-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Set
            </button>
          </form>
        </div>

        {/* Corps déroulant des formats */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* 1. GÉOMÉTRIQUES */}
          <div>
            <div className="grid grid-cols-3 gap-2.5">
              {geometricPresets.map((preset) => {
                const isSelected = currentAspectRatio === preset.ratioId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 group ${
                      isSelected
                        ? 'bg-zinc-800/90 border-violet-500 ring-2 ring-violet-500/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    {/* Visual box icon */}
                    <div
                      className={`w-10 h-7 rounded-md border transition-all ${
                        isSelected
                          ? 'border-violet-400 bg-violet-500/20'
                          : 'border-zinc-600 bg-zinc-800/60 group-hover:border-zinc-500'
                      }`}
                      style={{
                        aspectRatio: `${preset.width} / ${preset.height}`,
                        maxHeight: '28px',
                        maxWidth: '38px',
                      }}
                    />
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                      {preset.ratioLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. INSTAGRAM */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
              <ImageIcon className="w-4 h-4 text-pink-500" />
              <span>Instagram</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {instagramPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-center transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4 text-pink-500/80 mb-1" />
                  <span className="text-xs font-bold text-zinc-200">{preset.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{preset.ratioLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. TWITTER / X */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span>Twitter / X</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {twitterPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-center transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Monitor className="w-4 h-4 text-sky-400/80 mb-0.5" />
                  <span className="text-xs font-bold text-zinc-200">{preset.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{preset.ratioLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. YOUTUBE */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
              <Video className="w-4 h-4 text-red-500" />
              <span>YouTube</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {youtubePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-center transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Video className="w-4 h-4 text-red-500/80 mb-0.5" />
                  <span className="text-xs font-bold text-zinc-200">{preset.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{preset.ratioLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. PINTEREST & DRIBBBLE */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
              <Circle className="w-4 h-4 text-pink-400" />
              <span>Dribbble & Pinterest</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dribbblePresets.concat(pinterestPresets).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-center transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-xs font-bold text-zinc-200 truncate max-w-full">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{preset.ratioLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. APP STORE */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>App Store & Google Play</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {appStorePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-center transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-400/80 mb-0.5" />
                  <span className="text-[11px] font-bold text-zinc-200">{preset.name}</span>
                  <span className="text-[9px] text-zinc-500 font-mono">{preset.ratioLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
