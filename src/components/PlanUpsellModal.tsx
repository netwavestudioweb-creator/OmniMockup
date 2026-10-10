'use client';

import React from 'react';
import { usePrices } from '@/lib/usePrices';
import Link from 'next/link';
import { Sparkles, Flame, Check, X, Coins, Zap } from 'lucide-react';
import { trackEvent } from '@/lib/tracking';

export type UpsellMode = 'free_quota_reached' | 'solo_quota_approaching' | 'low_credits' | 'feature_locked' | 'video_quota_reached';

interface PlanUpsellModalProps {
  isOpen: boolean;
  mode: UpsellMode;
  onClose: () => void;
}

export const PlanUpsellModal: React.FC<PlanUpsellModalProps> = ({
  isOpen,
  mode,
  onClose,
}) => {
  const price = usePrices();
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sand-300 relative space-y-6 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-sand-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SCÉNARIO 1 : Quota Découverte atteint (3/jour) -> Comparaison Solo vs Pro */}
        {mode === 'free_quota_reached' && (
          <>
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-black uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Quota Découverte atteint (3/jour)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Débloquez vos exports sans filigrane
              </h3>
              <p className="text-xs text-stone-500">
                Choisissez le forfait qui s&apos;adapte à votre volume de travail.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Carte Solo (Appât) */}
              <div className="p-4 rounded-2xl border border-sand-200 bg-sand-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-900 text-sm">Solo</span>
                    <span className="text-[10px] bg-sand-200 text-stone-700 px-2 py-0.5 rounded-full font-bold">{price.solo}/mois</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight mb-3">
                    20 exports HD 2x / mois avec filigrane discret.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-stone-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stone-700" />
                      <span>20 exports HD / mois</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stone-700" />
                      <span>Studio complet 3D</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  onClick={() => {
                    trackEvent('plan_click', { source: 'upsell_modal', plan_id: 'solo' });
                    onClose();
                  }}
                  className="mt-4 w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold text-center transition-colors block"
                >
                  Choisir Solo ({price.solo})
                </Link>
              </div>

              {/* Carte Pro ⭐ (Pack Cible dominant) */}
              <div className="p-4 rounded-2xl border-2 border-violet-600 bg-violet-50/50 flex flex-col justify-between shadow-sm relative">
                <span className="absolute -top-2.5 right-3 bg-violet-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                  Recommandé
                </span>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-violet-950 text-sm flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
                      Pro
                    </span>
                    <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold">{price.pro}/mois</span>
                  </div>
                  <p className="text-[11px] text-violet-800 leading-tight mb-3 font-medium">
                    Exports illimités HD + 4K, ZÉRO filigrane et vidéo MP4 (10 / mois).
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-stone-800">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-violet-600 font-bold" />
                      <span className="font-bold">Exports HD & 4K ILLIMITÉS</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-violet-600 font-bold" />
                      <span className="font-bold text-emerald-700">ZÉRO filigrane</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-violet-600 font-bold" />
                      <span>10 vidéos MP4 / mois</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  onClick={() => {
                    trackEvent('plan_click', { source: 'upsell_modal', plan_id: 'pro' });
                    onClose();
                  }}
                  className="mt-4 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black text-center transition-colors block shadow-sm shadow-violet-500/20"
                >
                  Passer au Pro ({price.pro}) →
                </Link>
              </div>
            </div>
          </>
        )}

        {/* SCÉNARIO 2 : Utilisateur Solo proche de ses 20 exports */}
        {mode === 'solo_quota_approaching' && (
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-black uppercase">
              <Zap className="w-3.5 h-3.5 text-violet-600" />
              <span>Plus que quelques exports disponibles</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Passez au Pro pour seulement {price.proMinusSolo} de plus
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ne soyez plus jamais limité par un quota mensuel : débloquez les exports HD et 4K <strong>illimités</strong>, <strong>sans aucun filigrane</strong>, et 10 vidéos MP4 par mois.
            </p>
            <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-xs text-violet-950 flex items-center justify-between">
              <div>
                <span className="font-bold block">Forfait Pro Développeur</span>
                <span className="text-[11px] text-violet-700">{price.pro}/mois au lieu de {price.solo}/mois</span>
              </div>
              <Link
                href="/pricing"
                onClick={() => {
                  trackEvent('plan_click', { source: 'upsell_solo_upgrade', plan_id: 'pro' });
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
              >
                Upgrader (+{price.proMinusSolo}) →
              </Link>
            </div>
          </div>
        )}

        {/* SCÉNARIO 4 : Option non incluse (4K, vidéo) et pas assez de crédits */}
        {mode === 'feature_locked' && (
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-black uppercase">
              <Zap className="w-3.5 h-3.5 text-violet-600" />
              <span>Option non incluse dans votre forfait</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Débloquez la 4K et la vidéo</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Le plan <strong>Pro</strong> inclut les exports HD et 4K illimités sans filigrane et 10 vidéos par mois.
              Besoin ponctuel ? Achetez des <strong>crédits</strong> : 1 crédit l&apos;image HD, 2 la 4K, 3 la vidéo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/pricing"
                onClick={() => {
                  trackEvent('plan_click', { source: 'upsell_feature_locked', plan_id: 'pro' });
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs text-center"
              >
                Voir le plan Pro ({price.pro}/mois)
              </Link>
              <Link
                href="/pricing#credits"
                onClick={() => {
                  trackEvent('plan_click', { source: 'upsell_feature_locked', pack_id: 'credits' });
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs text-center"
              >
                Acheter des crédits
              </Link>
            </div>
          </div>
        )}

        {/* SCÉNARIO 5 : forfait Pro, les 10 vidéos du mois sont utilisées */}
        {mode === 'video_quota_reached' && (
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-black uppercase">
              <Zap className="w-3.5 h-3.5 text-violet-600" />
              <span>Vidéos du mois utilisées</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Vos 10 vidéos du mois sont utilisées</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Le compteur repart à zéro le 1er du mois. D&apos;ici là, chaque vidéo ou GIF supplémentaire coûte{' '}
              <strong>3 crédits</strong>. Le plan <strong>Agence</strong> inclut les vidéos en illimité.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/pricing#credits"
                onClick={() => {
                  trackEvent('plan_click', { source: 'upsell_video_quota', pack_id: 'credits' });
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs text-center"
              >
                Acheter des crédits
              </Link>
              <Link
                href="/pricing"
                onClick={() => {
                  trackEvent('plan_click', { source: 'upsell_video_quota', plan_id: 'agence' });
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs text-center"
              >
                Voir le plan Agence
              </Link>
            </div>
          </div>
        )}

        {/* SCÉNARIO 3 : Solde de crédits bas (<= 2 crédits) */}
        {mode === 'low_credits' && (
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>Solde de crédits bientôt épuisé</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Rechargez avec le Grand Pack et économisez 50 %
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Le <strong>Grand Pack ({price.grandCredits} crédits pour {price.grandPack})</strong> ramène le coût de chaque crédit à seulement <strong>{price.grandPerCredit}</strong> au lieu de {price.petitPerCredit}. Vos crédits n&apos;expirent jamais.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-stone-900 flex items-center justify-between">
              <div>
                <span className="font-black text-amber-950 block">Grand Pack (75 Crédits)</span>
                <span className="text-[11px] text-amber-800">{price.grandPack} — Valables à vie</span>
              </div>
              <Link
                href="/pricing#credits"
                onClick={() => {
                  trackEvent('plan_click', { source: 'upsell_low_credits', pack_id: 'credit_grand' });
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
              >
                Recharger (-50%) →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
