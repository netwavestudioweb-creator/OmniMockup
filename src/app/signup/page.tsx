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
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Quote,
  Check,
} from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('failed to fetch')) {
          setErrorMessage(
            'Connexion à Supabase impossible. Veuillez renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans votre fichier .env.local.'
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data.session) {
        router.push(redirectPath);
        router.refresh();
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e?.message || 'Erreur imprévue lors de l’inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setErrorMessage(e?.message || 'Erreur lors de l’inscription avec Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col justify-between">
        <Navbar showPricingLink={true} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 sm:p-10 shadow-2xl rounded-3xl border border-sand-200 text-center space-y-4 max-w-md w-full">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900">Vérifiez votre boîte mail</h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Un lien de confirmation a été envoyé à <strong className="text-stone-900">{email}</strong>. Cliquez dessus pour activer votre compte et débloquer la génération de mockups 4K.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        {/* CARTE SPLIT-SCREEN DRIBBBLE STYLE */}
        <div className="w-full bg-white rounded-3xl border border-sand-200 shadow-2xl shadow-stone-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* COLONNE GAUCHE : FORMULAIRE D'INSCRIPTION */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Logo & Titre */}
              <div className="mb-6">
                <Link href="/" className="inline-flex items-center space-x-2.5 group">
                  <div className="h-9 w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm group-hover:bg-violet-700 transition-colors">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold tracking-tight text-stone-900 text-xl">
                    Omni<span className="text-violet-600">Mockup</span>
                  </span>
                </Link>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-6">
                  Rejoignez OmniMockup
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
                  Créez votre compte gratuit. Profitez de 3 générations 4K et d&apos;analyses IA illimitées.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Avantages rapides */}
              <div className="mb-6 grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 flex items-center gap-2 text-xs font-semibold text-violet-900">
                  <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>Sans carte bancaire</span>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 flex items-center gap-2 text-xs font-semibold text-violet-900">
                  <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>Export HD 4K direct</span>
                </div>
              </div>

              {/* Bouton Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignup}
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
                <span>S&apos;inscrire avec Google</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sand-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-stone-400 font-medium">ou avec une adresse email</span>
                </div>
              </div>

              {/* Formulaire Email / Mot de passe */}
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Adresse email professionnelle
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Mot de passe (6 caractères minimum)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
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
                      <span>Créer mon compte gratuit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-4 border-t border-sand-100 text-center">
              <p className="text-xs text-stone-500">
                Vous avez déjà un compte ?{' '}
                <Link
                  href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-bold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Se connecter
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
                <span>Révolutionnez vos démos produits</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Transformez une simple URL en un visualiseur 3D ultra-attractif.
              </h2>

              {/* Témoignage client */}
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-4 shadow-xl">
                <Quote className="w-6 h-6 text-amber-300/80" />
                <p className="text-xs sm:text-sm text-stone-200 italic leading-relaxed">
                  &ldquo;Avec OmniMockup, nous présentons nos projets Web et SaaS à nos investisseurs avec un niveau de finition digne des plus grands studios californiens.&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-xs flex items-center justify-center text-white border border-white/30 shadow-xs">
                    ML
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Marie Laurent</h4>
                    <p className="text-[11px] text-stone-300">Lead UI/UX Designer chez Apex Digital</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logos des équipes / Marques de confiance */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                Adopté par les créateurs les plus exigeants :
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300/80">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">Capture Full-Page</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">Anti-Cookies IA</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">Directeur IA</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">Exports 4K</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sand-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
