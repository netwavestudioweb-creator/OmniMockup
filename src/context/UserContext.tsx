'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremiumUser: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Si le profil n'existe pas encore (délai de trigger), on peut le créer à la volée
        console.warn('[UserContext] Profil non trouvé, création automatique...');
        const { data: userResp } = await supabase.auth.getUser();
        if (userResp?.user) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userResp.user.email || '',
              plan: 'free',
            })
            .select('*')
            .single();

          if (newProfile) {
            setProfile(newProfile as Profile);
            return;
          }
        }
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('[UserContext] Erreur lors du chargement du profil :', err);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
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
