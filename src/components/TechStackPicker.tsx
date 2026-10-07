'use client';

import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';

export interface TechBadgeItem {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile';
  color: string;
  textColor: string;
  borderColor: string;
}

export const AVAILABLE_TECHS: TechBadgeItem[] = [
  { id: 'nextjs', name: 'Next.js 14', category: 'frontend', color: 'bg-black', textColor: 'text-white', borderColor: 'border-white/20' },
  { id: 'react', name: 'React', category: 'frontend', color: 'bg-[#087ea4]/20', textColor: 'text-[#149eca]', borderColor: 'border-[#149eca]/40' },
  { id: 'typescript', name: 'TypeScript', category: 'frontend', color: 'bg-[#3178c6]/20', textColor: 'text-[#3178c6]', borderColor: 'border-[#3178c6]/40' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', color: 'bg-[#38bdf8]/20', textColor: 'text-[#38bdf8]', borderColor: 'border-[#38bdf8]/40' },
  { id: 'vue', name: 'Vue.js', category: 'frontend', color: 'bg-[#42b883]/20', textColor: 'text-[#42b883]', borderColor: 'border-[#42b883]/40' },
  { id: 'nodejs', name: 'Node.js', category: 'backend', color: 'bg-[#5fa04e]/20', textColor: 'text-[#5fa04e]', borderColor: 'border-[#5fa04e]/40' },
  { id: 'python', name: 'Python', category: 'backend', color: 'bg-[#3776ab]/20', textColor: 'text-[#ffde57]', borderColor: 'border-[#3776ab]/40' },
  { id: 'supabase', name: 'Supabase', category: 'database', color: 'bg-[#3ecf8e]/20', textColor: 'text-[#3ecf8e]', borderColor: 'border-[#3ecf8e]/40' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', color: 'bg-[#4169e1]/20', textColor: 'text-[#60a5fa]', borderColor: 'border-[#4169e1]/40' },
  { id: 'flutter', name: 'Flutter', category: 'mobile', color: 'bg-[#02569b]/20', textColor: 'text-[#29b6f6]', borderColor: 'border-[#02569b]/40' },
  { id: 'docker', name: 'Docker', category: 'devops', color: 'bg-[#2496ed]/20', textColor: 'text-[#60a5fa]', borderColor: 'border-[#2496ed]/40' },
  { id: 'stripe', name: 'Stripe Pay', category: 'backend', color: 'bg-[#635bff]/20', textColor: 'text-[#a5b4fc]', borderColor: 'border-[#635bff]/40' },
];

interface TechStackPickerProps {
  selectedTechIds: string[];
  onChange: (techIds: string[]) => void;
  position: 'bottom' | 'top' | 'floating';
  onPositionChange: (pos: 'bottom' | 'top' | 'floating') => void;
  themeStyle: 'dark-glass' | 'light-glass' | 'neon';
  onThemeStyleChange: (style: 'dark-glass' | 'light-glass' | 'neon') => void;
}

export const TechStackPicker: React.FC<TechStackPickerProps> = ({
  selectedTechIds,
  onChange,
  position,
  onPositionChange,
  themeStyle,
  onThemeStyleChange,
}) => {
  const toggleTech = (id: string) => {
    if (selectedTechIds.includes(id)) {
      onChange(selectedTechIds.filter((t) => t !== id));
    } else {
      if (selectedTechIds.length >= 6) return; // Limite à 6 badges pour l'harmonie visuelle
      onChange([...selectedTechIds, id]);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Badges Stack Technique</span>
          </h4>
          <p className="text-[11px] text-stone-500">
            Affichez les technologies maîtrisées pour impressionner vos clients ({selectedTechIds.length}/6 max)
          </p>
        </div>
        {selectedTechIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-stone-400 hover:text-stone-700 underline"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Grille de sélection des technologies */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {AVAILABLE_TECHS.map((tech) => {
          const isSelected = selectedTechIds.includes(tech.id);
          return (
            <button
              key={tech.id}
              type="button"
              onClick={() => toggleTech(tech.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-800 shadow-xs font-semibold'
                  : 'bg-white hover:bg-sand-50 text-stone-700 border-sand-200'
              }`}
            >
              <span className="truncate">{tech.name}</span>
              {isSelected ? (
                <Check className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-sand-300 shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Réglages de position et style si des badges sont sélectionnés */}
      {selectedTechIds.length > 0 && (
        <div className="pt-2 border-t border-sand-200 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Position des badges sur la scène :
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['bottom', 'top', 'floating'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onPositionChange(pos)}
                  className={`py-1 px-2 rounded-md text-[10px] font-medium border text-center capitalize ${
                    position === pos
                      ? 'bg-violet-600 text-white border-violet-500 shadow-2xs font-bold'
                      : 'bg-white text-stone-600 border-sand-200 hover:bg-sand-50'
                  }`}
                >
                  {pos === 'bottom' ? 'Bas' : pos === 'top' ? 'Haut' : 'Flottant'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Style visuel :
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['dark-glass', 'light-glass', 'neon'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onThemeStyleChange(style)}
                  className={`py-1 px-2 rounded-md text-[10px] font-medium border text-center ${
                    themeStyle === style
                      ? 'bg-stone-900 text-white border-stone-800 shadow-2xs font-bold'
                      : 'bg-white text-stone-600 border-sand-200 hover:bg-sand-50'
                  }`}
                >
                  {style === 'dark-glass' ? 'Verre Noir' : style === 'light-glass' ? 'Verre Blanc' : 'Néon'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
