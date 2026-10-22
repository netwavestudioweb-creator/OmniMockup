'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/safeRedirect';
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
  Check,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(searchParams.get('redirect'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-pms-surface text-stone-900 flex flex-col selection:bg-pms-accent-tint selection:text-pms-accent">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        {/* CARTE SPLIT-SCREEN DRIBBBLE STYLE */}
        <div className="w-full bg-white rounded-3xl border border-pms-line shadow-2xl shadow-stone-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* COLONNE GAUCHE : FORMULAIRE DE CONNEXION */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Logo & Titre */}
              <div className="mb-8">
                <Link href="/" className="inline-flex items-center space-x-2.5 group">
                  <div className="h-9 w-9 rounded-xl bg-pms-accent text-white flex items-center justify-center shadow-sm group-hover:bg-pms-accent transition-colors">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold tracking-tight text-stone-900 text-xl">
                    Pitch<span className="text-pms-accent">MySite</span>
                  </span>
                </Link>

                <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight mt-6">
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
                      placeholder="exemple@gmail.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-pms-surface border border-pms-line rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pms-accent/20 focus:border-pms-accent transition-colors placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Mot de passe
                    </label>
                    <Link href="/mot-de-passe-oublie" className="text-xs font-semibold text-pms-accent hover:text-pms-accent">
                      Mot de passe oublié ?
                    </Link>
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
                      className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-pms-surface border border-pms-line rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pms-accent/20 focus:border-pms-accent transition-colors placeholder:text-stone-400"
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
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-pms-accent hover:bg-pms-accent text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-60"
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

            <div className="mt-8 pt-4 border-t border-pms-line text-center">
              <p className="text-xs text-stone-500">
                Vous n&apos;avez pas encore de compte ?{' '}
                <Link
                  href={`/signup${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-semibold text-pms-accent hover:text-pms-accent transition-colors"
                >
                  Créer un compte gratuit
                </Link>
              </p>
            </div>
          </div>

          {/* COLONNE DROITE : PANNEAU SHOWCASE DRIBBBLE */}
          <div className="lg:col-span-6 bg-pms-field p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Effet de lueur d'arrière-plan */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-pms-accent/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-pms-accent/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pms-accent-soft text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Studio de Mockups &amp; Vision IA</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
                Sublimez vos captures web avec un studio d&apos;exception.
              </h2>

              {/* Ce que vous obtenez (sans faux témoignage) */}
              <ul className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3 shadow-xl text-xs sm:text-sm text-stone-200">
                <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span>Capture automatique de la page depuis son URL</span></li>
                <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span>Mise en scène sur MacBook, iPhone et iPad</span></li>
                <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span>Formats prêts pour présentation, LinkedIn et Instagram</span></li>
                <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span>Exports HD et 4K sans filigrane dès le plan Pro</span></li>
                <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span>Lien de partage pour vos clients, à votre marque avec le plan Agence</span></li>
              </ul>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-semibold text-stone-400">
                Lancé en octobre 2026
              </p>
              <Link href="/#usages" className="text-xs font-semibold text-pms-accent-soft hover:text-white transition-colors">
                Proposition commerciale, réseaux sociaux, stores d&apos;applis : voir les 3 usages →
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
        <div className="min-h-screen bg-pms-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pms-accent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

