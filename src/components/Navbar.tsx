'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import {
  Layers,
  Sparkles,
  CreditCard,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  Zap,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
  showPricingLink?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, showPricingLink = true }) => {
  const { user, profile, isLoading, signOut } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const planName = profile?.plan === 'agence' ? 'Agence' : profile?.plan === 'pro' ? 'Pro' : 'Free';
  const isPremium = profile?.plan === 'pro' || profile?.plan === 'agence';

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-sand-50/95 backdrop-blur-md w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
        <Link
          href="/"
          onClick={() => {
            setMobileMenuOpen(false);
            if (onReset) onReset();
          }}
          className="flex items-center space-x-2 sm:space-x-3 text-left group focus:outline-none min-w-0"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm group-hover:bg-violet-700 transition-colors shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold tracking-tight text-stone-900 text-sm sm:text-base md:text-lg truncate">
                Omni<span className="text-violet-600">Mockup</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider rounded-full bg-violet-100 text-violet-800 border border-violet-200 shrink-0">
                Studio
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans hidden sm:block truncate">
              Analyse de site, vision IA & mockups haute fidélité
            </p>
          </div>
        </Link>

        {/* Navigation Desktop & Tablette */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-sand-200 text-xs text-stone-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-stone-500">Moteur IA :</span>
            <span className="font-mono text-violet-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-600" />
              Gemini Vision
            </span>
          </div>

          {showPricingLink && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-violet-700 px-3.5 py-1.5 rounded-lg border border-sand-200 bg-white hover:bg-sand-100 transition-all shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-violet-600" />
              <span>Tarifs</span>
            </Link>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-sand-200 bg-white hover:bg-sand-100 transition-colors"
            >
              Nouvelle analyse
            </button>
          )}

          {/* Section Authentification Desktop */}
          {!isLoading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((p) => !p)}
                    className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border border-sand-200 bg-white hover:bg-sand-50 transition-all shadow-2xs text-xs font-medium text-stone-800"
                  >
                    <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[11px] uppercase">
                      {user.email?.slice(0, 2) || 'US'}
                    </div>
                    <span className="max-w-[120px] truncate">{user.email}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${
                        isPremium
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-sand-100 text-stone-600 border-sand-200'
                      }`}
                    >
                      {planName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-sand-200 shadow-xl py-2 z-50 animate-slide-up text-xs">
                      <div className="px-3.5 py-2 border-b border-sand-100">
                        <p className="text-[11px] text-stone-400 font-medium">Connecté avec</p>
                        <p className="font-semibold text-stone-900 truncate">{user.email}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isPremium
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-sand-100 text-stone-700'
                            }`}
                          >
                            {isPremium ? <Zap className="w-3 h-3 text-violet-600" /> : <Shield className="w-3 h-3" />}
                            Plan {planName}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-sand-50 hover:text-violet-700 transition-colors font-medium"
                        >
                          <UserIcon className="w-4 h-4 text-violet-600" />
                          <span>Mon compte</span>
                        </Link>

                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-sand-50 hover:text-violet-700 transition-colors font-medium"
                        >
                          <CreditCard className="w-4 h-4 text-stone-400" />
                          <span>Formules & Tarifs</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-sand-100">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-sand-100 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3.5 py-1.5 rounded-lg shadow-sm shadow-violet-600/20 transition-all active:scale-[0.99]"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bouton Hamburger Mobile (<640px) */}
        <div className="sm:hidden flex items-center gap-2">
          {user ? (
            <Link
              href="/account"
              className="px-2.5 py-1 text-xs font-semibold text-violet-700 bg-violet-50 rounded-lg border border-violet-200"
            >
              Compte
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-white rounded-lg border border-sand-200"
            >
              Connexion
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="p-2 rounded-xl text-stone-700 hover:text-stone-900 bg-white border border-sand-200 shadow-2xs transition-colors"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile Hamburger */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-sand-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-fade-in">
          {user ? (
            <div className="p-3 rounded-2xl bg-sand-50 border border-sand-200 text-xs space-y-1.5">
              <p className="text-[11px] text-stone-400">Connecté avec</p>
              <p className="font-bold text-stone-900 truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    isPremium
                      ? 'bg-violet-100 text-violet-800'
                      : 'bg-sand-200 text-stone-700'
                  }`}
                >
                  {isPremium ? <Zap className="w-3 h-3 text-violet-600" /> : <Shield className="w-3 h-3" />}
                  Plan {planName}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold text-stone-700 bg-sand-100 hover:bg-sand-200 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
              >
                Inscription
              </Link>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-sand-100">
            <Link
              href="/"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onReset) onReset();
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-800 hover:bg-sand-100 transition-colors"
            >
              <Layers className="w-4 h-4 text-violet-600" />
              <span>Studio & Analyse</span>
            </Link>

            {user && (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-800 hover:bg-sand-100 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-violet-600" />
                <span>Mon compte & Quotas</span>
              </Link>
            )}

            {showPricingLink && (
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-800 hover:bg-sand-100 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span>Grille des Tarifs (Free, Pro, Agence)</span>
              </Link>
            )}

            {onReset && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onReset();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-200"
              >
                <span>Lancer une nouvelle analyse</span>
              </button>
            )}

            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
