'use client';

/**
 * Pub récompensée Google Ad Manager (GPT), d'après l'exemple officiel de Google
 * (googleads/google-publisher-tag-samples, « display-rewarded-ad »).
 * La pub n'est lancée que si le visiteur le demande ; le bonus n'est accordé que si Google
 * signale que la pub a été vue jusqu'au bout (événement rewardedSlotGranted).
 */

/** Bloc publicitaire réel (à créer par Dodo dans Ad Manager), sinon bloc d'essai de Google en local */
const GOOGLE_TEST_AD_UNIT = '/22639388115/rewarded_web_example';
export const REWARDED_AD_UNIT =
  process.env.NEXT_PUBLIC_GAM_REWARDED_AD_UNIT || (process.env.NODE_ENV === 'development' ? GOOGLE_TEST_AD_UNIT : '');

export type RewardedResult = 'granted' | 'closed' | 'unsupported' | 'no_fill' | 'error';

/* Types minimaux de googletag (bibliothèque chargée depuis Google) */
type GptSlot = { addService: (s: unknown) => GptSlot };
type GptEvent = { slot?: GptSlot; isEmpty?: boolean; makeRewardedVisible?: () => void };
type GptPubads = {
  addEventListener: (name: string, cb: (e: GptEvent) => void) => void;
  removeEventListener?: (name: string, cb: (e: GptEvent) => void) => void;
};
type Googletag = {
  cmd: Array<() => void>;
  defineOutOfPageSlot: (path: string, format: unknown) => GptSlot | null;
  enums: { OutOfPageFormat: { REWARDED: unknown } };
  pubads: () => GptPubads;
  enableServices: () => void;
  display: (slot: GptSlot) => void;
  destroySlots: (slots: GptSlot[]) => void;
};

let gptLoading: Promise<void> | null = null;
function loadGpt(): Promise<void> {
  if (gptLoading) return gptLoading;
  gptLoading = new Promise((resolve, reject) => {
    const w = window as unknown as { googletag?: Partial<Googletag> };
    w.googletag = w.googletag || { cmd: [] };
    const s = document.createElement('script');
    s.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => {
      gptLoading = null; // bloqueur de pub ou réseau : on pourra réessayer
      reject(new Error('gpt_load_failed'));
    };
    document.head.appendChild(s);
  });
  return gptLoading;
}

/**
 * Lance une pub récompensée. `onReady` est appelé quand la pub est prête à s'afficher.
 * Renvoie 'granted' si la pub a été vue jusqu'au bout.
 */
export async function playRewardedAd(onReady?: () => void): Promise<RewardedResult> {
  if (!REWARDED_AD_UNIT || typeof window === 'undefined') return 'unsupported';
  try {
    await loadGpt();
  } catch {
    return 'error';
  }
  const googletag = (window as unknown as { googletag: Googletag }).googletag;

  return new Promise<RewardedResult>((resolve) => {
    let slot: GptSlot | null = null;
    let granted = false;
    let settled = false;
    const pubads = () => googletag.pubads();
    const finish = (r: RewardedResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Google ajoute « #goog_rewarded » à l'adresse pendant la pub : on la remet propre
      if (window.location.hash === '#goog_rewarded') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      try {
        pubads().removeEventListener?.('rewardedSlotReady', onSlotReady);
        pubads().removeEventListener?.('rewardedSlotGranted', onGranted);
        pubads().removeEventListener?.('rewardedSlotClosed', onClosed);
        pubads().removeEventListener?.('slotRenderEnded', onRender);
        if (slot) googletag.destroySlots([slot]);
      } catch {
        // rien à nettoyer
      }
      resolve(r);
    };
    // Aucune pub prête au bout de 20 s : on abandonne proprement
    const timer = setTimeout(() => finish('no_fill'), 20_000);

    const onSlotReady = (e: GptEvent) => {
      if (e.slot !== slot) return;
      clearTimeout(timer);
      onReady?.();
      e.makeRewardedVisible?.();
    };
    const onGranted = (e: GptEvent) => {
      if (e.slot === slot) granted = true;
    };
    const onClosed = (e: GptEvent) => {
      if (e.slot === slot) finish(granted ? 'granted' : 'closed');
    };
    const onRender = (e: GptEvent) => {
      if (e.slot === slot && e.isEmpty) finish('no_fill');
    };

    googletag.cmd.push(() => {
      slot = googletag.defineOutOfPageSlot(REWARDED_AD_UNIT, googletag.enums.OutOfPageFormat.REWARDED);
      // null : page ou appareil non compatible (Google ne diffuse ces pubs que sur des pages adaptées au téléphone)
      if (!slot) return finish('unsupported');
      slot.addService(pubads());
      pubads().addEventListener('rewardedSlotReady', onSlotReady);
      pubads().addEventListener('rewardedSlotGranted', onGranted);
      pubads().addEventListener('rewardedSlotClosed', onClosed);
      pubads().addEventListener('slotRenderEnded', onRender);
      googletag.enableServices();
      googletag.display(slot);
    });
  });
}
