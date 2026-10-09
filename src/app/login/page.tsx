'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Bypass de test pour validation sans configuration Supabase Auth
    // Uniquement en développement local : jamais actif sur le site en ligne
    if (process.env.NODE_ENV === 'development' && email === 'test@omnimockup.com' && password === 'OmniMockup2026!') {
      const mockTestSession = {
        user: {
          id: 'test-user-id-999',
          email: 'test@omnimockup.com',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { full_name: 'Utilisateur Test (Pro)' },
          aud: 'authenticated',
          role: 'authenticated',
        },
        profile: {
          id: 'test-user-id-999',
          email: 'test@omnimockup.com',
          plan: 'pro',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('omnimockup_test_session', JSON.stringify(mockTestSession));
      }

      setTimeout(() => {
        setIsLoading(false);
        router.push(redirectPath);
        window.location.href = redirectPath;
      }, 500);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Email ou mot de passe incorrect.');
        } else if (error.message.toLowerCase().includes('failed to fetch')) {
          setErrorMessage(
            'Connexion à Supabase impossible. Veuillez renseigner les clés Supabase dans .env.local.'
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e?.message || 'Erreur imprévue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e?.message || 'Erreur lors de la connexion avec Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        {/* CARTE SPLIT-SCREEN DRIBBBLE STYLE */}
        <div className="w-full bg-white rounded-3xl border border-sand-200 shadow-2xl shadow-stone-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* COLONNE GAUCHE : FORMULAIRE DE CONNEXION */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Logo & Titre */}
              <div className="mb-8">
                <Link href="/" className="inline-flex items-center space-x-2.5 group">
                  <div className="h-9 w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm group-hover:bg-violet-700 transition-colors">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold tracking-tight text-stone-900 text-xl">
                    Omni<span className="text-violet-600">Mockup</span>
                  </span>
                </Link>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-6">
                  Bon retour parmi nous !
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
                  Connectez-vous pour retrouver votre studio et vos exports HD.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Raccourci Démo Test — développement local uniquement */}
              {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200/80 text-violet-900 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-violet-950">
                    <Zap className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
                    Accès Rapide Démo
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-mono">
                    1-Clic
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('test@omnimockup.com');
                    setPassword('OmniMockup2026!');
                  }}
                  className="w-full py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs text-xs"
                >
                  <span>Remplir les identifiants de test</span>
                </button>
              </div>
              )}

              {/* Bouton Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-sand-200 rounded-xl bg-white text-stone-700 text-xs sm:text-sm font-semibold hover:bg-sand-50 hover:border-sand-300 transition-all shadow-2xs active:scale-[0.99] disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Se connecter avec Google</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sand-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-stone-400 font-medium">ou par email</span>
                </div>
              </div>

              {/* Formulaire Email / Mot de passe */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-sand-50/50 border border-sand-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-colors placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Mot de passe
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-sand-50/50 border border-sand-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-colors placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/20 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-4 border-t border-sand-100 text-center">
              <p className="text-xs text-stone-500">
                Vous n&apos;avez pas encore de compte ?{' '}
                <Link
                  href={`/signup${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-bold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Créer un compte gratuit
                </Link>
              </p>
            </div>
          </div>

          {/* COLONNE DROITE : PANNEAU SHOWCASE DRIBBBLE */}
          <div className="lg:col-span-6 bg-gradient-to-br from-stone-900 via-indigo-950 to-violet-950 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Effet de lueur d'arrière-plan */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-violet-200 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Studio de Mockups &amp; Vision IA</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Sublimez vos captures web avec un studio d&apos;exception.
              </h2>

              {/* Ce que vous obtenez (sans faux témoignage) */}
              <ul className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3 shadow-xl text-xs sm:text-sm text-stone-200">
                <li>✓ Capture automatique de la page depuis son URL</li>
                <li>✓ Mise en scène sur MacBook, iPhone et iPad</li>
                <li>✓ Formats prêts pour présentation, LinkedIn et Instagram</li>
                <li>✓ Exports HD et 4K sans filigrane dès le plan Pro</li>
                <li>✓ Marque blanche avec le logo de votre agence (plan Agence)</li>
              </ul>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                Lancé en octobre 2026
              </p>
              <Link href="/#agences-fondatrices" className="text-xs font-semibold text-violet-200 hover:text-white transition-colors">
                Agence web ? Rejoignez les 10 agences fondatrices : 1 mois Pro offert →
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sand-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

