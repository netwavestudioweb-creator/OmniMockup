'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import {
  Layers,
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
  const { user, profile, signOut } = useUser();
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

  const planName = profile?.plan === 'agence' ? 'Agence' : profile?.plan === 'pro' ? 'Pro' : profile?.plan === 'solo' ? 'Solo' : 'Free';
  const isPremium = profile?.plan === 'pro' || profile?.plan === 'agence';

  return (
    <header className="sticky top-0 z-50 bg-pms-card w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
        {/* Logo & Titre */}
        <Link
          href="/"
          onClick={() => {
            setMobileMenuOpen(false);
            if (onReset) onReset();
          }}
          className="flex items-center space-x-2 sm:space-x-3 text-left group focus:outline-none min-w-0"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-pms-accent text-white flex items-center justify-center shadow-sm group-hover:bg-pms-accent-hover transition-colors shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-semibold tracking-tight text-stone-900 text-sm sm:text-base md:text-lg truncate">
                Pitch<span className="text-pms-accent">MySite</span>
              </span>
            </div>
            <p className="text-[13px] text-pms-muted font-sans hidden sm:block truncate">
              Votre site en visuels prêts à convaincre
            </p>
          </div>
        </Link>

        {/* Navigation Desktop & Tablette */}
        <div className="hidden sm:flex items-center space-x-3">

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-pms-line bg-white hover:bg-pms-surface transition-colors"
            >
              Nouvelle capture
            </button>
          )}

          {/* Section Authentification Desktop */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((p) => !p)}
                className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border border-pms-line bg-white hover:bg-pms-surface transition-all shadow-2xs text-xs font-medium text-stone-800"
              >
                <div className="w-6 h-6 rounded-lg bg-pms-surface text-pms-accent flex items-center justify-center font-semibold text-[11px]">
                  {user.email?.slice(0, 2) || 'US'}
                </div>
                <span className="max-w-[120px] truncate">{user.email}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                    isPremium
                      ? 'bg-pms-accent text-white border-pms-accent'
                      : 'bg-pms-surface text-stone-600 border-pms-line'
                  }`}
                >
                  {planName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-pms-line shadow-xl py-2 z-50 animate-slide-up text-xs">
                  <div className="px-3.5 py-2 border-b border-pms-line">
                    <p className="text-[11px] text-stone-400 font-medium">Connecté avec</p>
                    <p className="font-semibold text-stone-900 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          isPremium
                            ? 'bg-pms-surface text-pms-accent'
                            : 'bg-pms-surface text-stone-700'
                        }`}
                      >
                        {isPremium ? <Zap className="w-3 h-3 text-pms-accent" /> : <Shield className="w-3 h-3" />}
                        Plan {planName}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/account"
                      prefetch={true}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-pms-surface hover:text-pms-accent transition-colors font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-pms-accent" />
                      <span>Mon Compte &amp; Quotas</span>
                    </Link>

                    {!isPremium && (
                      <Link
                        href="/account"
                        prefetch={true}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-pms-accent hover:bg-pms-surface transition-colors font-semibold"
                      >
                        <Zap className="w-4 h-4 text-pms-accent" />
                        <span>Passer Pro ✨</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-pms-line">
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
                prefetch={true}
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-pms-surface transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                prefetch={true}
                className="text-xs font-semibold text-white bg-pms-accent hover:bg-pms-accent-hover px-3.5 py-1.5 rounded-lg transition-all active:scale-[0.99]"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>

        {/* Bouton Hamburger Mobile (<640px) */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-stone-700 hover:text-stone-900 bg-white border border-pms-line shadow-2xs transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile Hamburger */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-pms-line bg-white px-4 py-4 space-y-3 shadow-lg animate-fade-in">
          {user ? (
            <div className="p-3 rounded-2xl bg-pms-surface border border-pms-line text-xs space-y-1.5">
              <p className="text-[11px] text-stone-400">Connecté avec</p>
              <p className="font-semibold text-stone-900 truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    isPremium
                      ? 'bg-pms-surface text-pms-accent'
                      : 'bg-sand-200 text-stone-700'
                  }`}
                >
                  {isPremium ? <Zap className="w-3 h-3 text-pms-accent" /> : <Shield className="w-3 h-3" />}
                  Plan {planName}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold text-stone-700 bg-pms-surface hover:bg-pms-line transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold text-white bg-pms-accent hover:bg-pms-accent-hover transition-colors"
              >
                Inscription
              </Link>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-pms-line">
            {showPricingLink && (
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-800 hover:bg-pms-surface transition-colors"
              >
                <CreditCard className="w-4 h-4 text-pms-accent" />
                <span>Tarifs &amp; Formules</span>
              </Link>
            )}

            {user && (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-800 hover:bg-pms-surface transition-colors"
              >
                <UserIcon className="w-4 h-4 text-pms-accent" />
                <span>Mon compte &amp; Quotas</span>
              </Link>
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
