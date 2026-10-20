'use client';

import React, { useState } from 'react';
import { PlayCircle, Loader2, Check } from 'lucide-react';
import { playRewardedAd, REWARDED_AD_UNIT } from '@/lib/rewardedAd';
import { trackEvent } from '@/lib/tracking';

/**
 * Formule gratuite, limite du jour atteinte : « Regarder une pub = 1 export de plus » (3 par jour au plus).
 * Le bonus est accordé par le serveur, seulement si Google confirme que la pub a été vue jusqu'au bout.
 * Rien ne s'affiche tant que le bloc publicitaire n'est pas configuré (NEXT_PUBLIC_GAM_REWARDED_AD_UNIT).
 */
export const RewardedAdOffer: React.FC<{ onRewarded: () => void }> = ({ onRewarded }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'done' | 'message'>('idle');
  const [message, setMessage] = useState('');
  const [left, setLeft] = useState<number | null>(null);

  if (!REWARDED_AD_UNIT) return null;

  const post = (payload: Record<string, unknown>) =>
    fetch('/api/ads/reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((r) => r.json())
      .catch(() => null);

  const watch = async () => {
    setState('loading');
    setMessage('');
    const start = await post({ action: 'start' });
    if (!start?.allowed || !start.reward_id) {
      setState('message');
      setMessage(
        start?.reason === 'daily_max'
          ? 'Vous avez déjà utilisé vos 3 pubs bonus aujourd’hui. Revenez demain, ou passez à une formule payante.'
          : 'Les pubs bonus ne sont pas disponibles pour le moment.'
      );
      return;
    }
    trackEvent('rewarded_ad_start', {});
    const result = await playRewardedAd(() => setState('playing'));
    if (result !== 'granted') {
      setState('message');
      setMessage(
        result === 'closed'
          ? 'Pub fermée avant la fin : pas de bonus cette fois.'
          : result === 'unsupported'
            ? 'Les pubs bonus fonctionnent sur téléphone. Elles ne sont pas disponibles sur cet appareil.'
            : result === 'no_fill'
              ? 'Aucune pub disponible pour le moment. Réessayez dans quelques minutes.'
              : 'La pub n’a pas pu se charger (un bloqueur de publicité est peut-être actif).'
      );
      trackEvent('rewarded_ad_not_granted', { result });
      return;
    }
    const grant = await post({ action: 'grant', rewardId: start.reward_id });
    if (grant?.granted) {
      setLeft(Math.max(0, (grant.max ?? 3) - (grant.used ?? 0)));
      setState('done');
      trackEvent('rewarded_ad_granted', { used: grant.used });
    } else {
      setState('message');
      setMessage(
        grant?.reason === 'daily_max'
          ? 'Vous avez déjà utilisé vos 3 pubs bonus aujourd’hui.'
          : 'Le bonus n’a pas pu être validé. Réessayez.'
      );
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-sand-200 bg-sand-50/60 space-y-2.5">
      {state === 'done' ? (
        <>
          <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
            <Check className="w-4 h-4" /> 1 export débloqué
          </p>
          <p className="text-xs text-stone-600">
            {left === 0 ? 'C’était votre dernière pub bonus du jour.' : `Encore ${left} pub${left && left > 1 ? 's' : ''} bonus possible${left && left > 1 ? 's' : ''} aujourd’hui.`}
          </p>
          <button
            type="button"
            onClick={onRewarded}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
          >
            Exporter maintenant
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-stone-700">
            <span className="font-bold text-stone-900">Pas encore prêt à payer ?</span> Regardez une courte pub et
            obtenez 1 export de plus (qualité Standard, 3 pubs par jour au plus).
          </p>
          <button
            type="button"
            onClick={watch}
            disabled={state === 'loading' || state === 'playing'}
            className="w-full py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {state === 'loading' || state === 'playing' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 text-pms-accent" />
            )}
            {state === 'loading' ? 'Chargement de la pub…' : state === 'playing' ? 'Pub en cours…' : 'Regarder une pub (environ 30 s)'}
          </button>
          {state === 'message' && <p className="text-xs text-stone-600" role="status">{message}</p>}
        </>
      )}
    </div>
  );
};
