'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { getEffectivePlan } from '@/lib/plan';

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremiumUser: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/**
 * La bibliothèque de connexion (Supabase, environ 55 Ko compressés) est chargée juste après l'affichage
 * de la page au lieu de bloquer son premier rendu : la page apparaît plus vite, surtout sur téléphone.
 */
type SupabaseBrowserClient = ReturnType<typeof import('@/lib/supabase/client').createClient>;
let supabasePromise: Promise<SupabaseBrowserClient> | null = null;
function getSupabase(): Promise<SupabaseBrowserClient> {
  if (!supabasePromise) supabasePromise = import('@/lib/supabase/client').then((m) => m.createClient());
  return supabasePromise;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isPremiumUser: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Le profil est créé par un trigger SQL à l'inscription. S'il n'est pas
        // encore visible, on réessaie une fois (le navigateur n'a pas le droit
        // de créer ou modifier un profil : c'est voulu, pour la sécurité).
        console.warn('[UserContext] Profil pas encore disponible, nouvel essai…');
        await new Promise((r) => setTimeout(r, 1500));
        const retry = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (retry.data) {
          const p = retry.data as Profile;
          setProfile({ ...p, plan: getEffectivePlan(p) });
        }
        return;
      }

      if (data) {
        // Un plan à durée fixe expiré est affiché comme "free"
        const p = data as Profile;
        setProfile({ ...p, plan: getEffectivePlan(p) });
      }
    } catch (err) {
      console.error('[UserContext] Erreur lors du chargement du profil :', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        // Vérification d'une session de test locale (mode démo/test)
        // Session de test : uniquement en développement local. En production,
        // on l'ignore et on la supprime (sinon n'importe qui pourrait se donner un plan payant).
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
          localStorage.removeItem('omnimockup_test_session');
        }
        const localTestSession =
          typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
            ? localStorage.getItem('omnimockup_test_session')
            : null;
        if (localTestSession) {
          try {
            const parsed = JSON.parse(localTestSession);
            if (mounted && parsed?.user && parsed?.profile) {
              setUser(parsed.user as User);
              setProfile(parsed.profile as Profile);
              setIsLoading(false);
              return;
            }
          } catch {
            // Ignorer si JSON invalide
          }
        }

        // Timeout rapide (1200ms) pour éviter les blocages de rendu si Supabase est indisponible
        const supabase = await getSupabase();
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 1200)
        );

        const res = await Promise.race([sessionPromise, timeoutPromise]);
        const session = res?.data?.session ?? null;

        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            // Profil au plus 4 s : la page s'affiche même si la base répond lentement
            await Promise.race([fetchProfile(currentUser.id), new Promise((r) => setTimeout(r, 4000))]);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('[UserContext] Erreur initialisation session :', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    let subscription: { unsubscribe: () => void } | null = null;
    getSupabase().then((supabase) => {
      if (!mounted) return;
      subscription = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const localTestSession = typeof window !== 'undefined' ? localStorage.getItem('omnimockup_test_session') : null;
      if (localTestSession && event === 'SIGNED_OUT') {
        localStorage.removeItem('omnimockup_test_session');
      }

      const currentUser = session?.user ?? null;
      if (!localTestSession) {
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      }
      setIsLoading(false);
      }).data.subscription;
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('omnimockup_test_session');
      }
      const supabase = await getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (err) {
      console.error('[UserContext] Erreur déconnexion :', err);
    }
  };

  const isPremiumUser = profile?.plan === 'pro' || profile?.plan === 'agence';

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isPremiumUser,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
