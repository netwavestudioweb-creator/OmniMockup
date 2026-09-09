'use client';

import React from 'react';
import { ArrowLeft, Check, Compass, Globe, Sparkles, LayoutTemplate, Palette } from 'lucide-react';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface StepperProps {
  currentStep: WizardStep;
  maxReachedStep: WizardStep;
  onStepChange: (step: WizardStep) => void;
  onPrevStep: () => void;
  canGoPrev: boolean;
}

const STEPS = [
  { id: 1 as WizardStep, label: 'URL & Détection', shortLabel: 'URL', icon: Globe },
  { id: 2 as WizardStep, label: 'Pages Détectées', shortLabel: 'Pages', icon: Compass },
  { id: 3 as WizardStep, label: 'Sections IA', shortLabel: 'Sections', icon: Sparkles },
  { id: 4 as WizardStep, label: 'Choix du Mockup', shortLabel: 'Mockup', icon: LayoutTemplate },
  { id: 5 as WizardStep, label: 'Studio & Export', shortLabel: 'Studio', icon: Palette },
];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  maxReachedStep,
  onStepChange,
  onPrevStep,
  canGoPrev,
}) => {
  return (
    <div className="w-full max-w-full bg-white border-b border-sand-200 sticky top-16 z-40 shadow-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full">
        {/* Bouton Retour & Titre de l'étape sur mobile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial overflow-hidden">
          <button
            type="button"
            onClick={onPrevStep}
            disabled={!canGoPrev}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              canGoPrev
                ? 'bg-sand-100 hover:bg-sand-200 text-stone-800 border border-sand-300'
                : 'opacity-40 cursor-not-allowed text-stone-400 bg-sand-50 border border-sand-200'
            }`}
            title="Revenir à l'étape précédente"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Retour</span>
          </button>

          {/* Affichage Mobile & Tablette Portrait (< 1024px) : Étape actuelle avec titre et indicateur "Étape X sur 5" */}
          <div className="lg:hidden flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">
              {currentStep}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-violet-700 block leading-tight">
                Étape {currentStep} sur 5
              </span>
              <span className="text-xs font-bold text-stone-900 truncate block leading-tight">
                {STEPS[currentStep - 1]?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper complet (desktop lg+) */}
        <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
          {STEPS.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isAccessible = step.id <= maxReachedStep;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepChange(step.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-200'
                    : isCompleted
                    ? 'bg-violet-50 text-violet-800 hover:bg-violet-100 border border-violet-200'
                    : isAccessible
                    ? 'bg-sand-100 text-stone-700 hover:bg-sand-200 border border-sand-200'
                    : 'text-stone-400 cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-violet-700'
                      : isCompleted
                      ? 'bg-violet-600 text-white'
                      : 'bg-sand-200 text-stone-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                </div>
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-stone-500'}`} />
                <span className="hidden md:inline">{step.label}</span>
                <span className="md:hidden">{step.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Indicateur de progression en segments discrets (sans pourcentage) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" title={`Étape ${currentStep} sur 5`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 shrink-0 ${
                s === currentStep
                  ? 'w-4 sm:w-8 bg-violet-600 shadow-xs'
                  : s < currentStep
                  ? 'w-2 sm:w-4 bg-violet-400'
                  : 'w-2 sm:w-4 bg-sand-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
