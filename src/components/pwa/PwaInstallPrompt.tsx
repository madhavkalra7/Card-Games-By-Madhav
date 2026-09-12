'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Sparkles, Smartphone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true); // Default true until verified on client
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      return isStandaloneMedia || isIosStandalone || isAndroidApp;
    };

    const standaloneNow = checkStandalone();
    setIsStandalone(standaloneNow);

    // If already installed and running standalone, no need to show any prompt
    if (standaloneNow) return;

    // 2. Check if user dismissed prompt in the last 24 hours
    const dismissedTimestamp = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedTimestamp) {
      const diff = Date.now() - parseInt(dismissedTimestamp, 10);
      if (diff < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture Android/Chrome/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 5. Detect app installed event
    const handleAppInstalled = () => {
      setHasInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setHasInstalled(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setHasInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  // Do not show if already in full screen standalone mode or dismissed
  if (isStandalone) return null;

  const canInstall = !!deferredPrompt || isIos;
  if (!canInstall && !hasInstalled) return null;

  return (
    <>
      {/* Installed Toast Notification */}
      {hasInstalled && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>App Installed! Open "Card Games" from your home screen for full screen play.</span>
        </div>
      )}

      {/* Floating Install Prompt Banner (Unobtrusive bottom-right / bottom-center pill) */}
      {!isDismissed && !hasInstalled && (
        <aside
          aria-label="Install Fullscreen App Prompt"
          className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-[85] max-w-md bg-zinc-950/95 backdrop-blur-xl border border-gold/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
        >
          {/* App Icon + Text */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 p-0.5 shadow-gold-glow shrink-0 flex items-center justify-center text-black font-black text-sm">
              ♠
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                  Play in Full Screen
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-gold/20 text-gold text-[9px] font-extrabold uppercase">
                  App
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                Removes browser URL bar & play in 100% full screen
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-[11px] uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* iOS Safari 'Add to Home Screen' Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-950 border-2 border-gold/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 mx-auto flex items-center justify-center text-black font-black text-xl mb-3 shadow-gold-glow">
              ♠
            </div>

            <h3 className="text-base sm:text-lg font-black text-white font-serif mb-1">
              Install on iPhone / iPad
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              To play without the Safari URL bar and enjoy true full-screen card gaming:
            </p>

            <div className="space-y-2.5 text-left bg-zinc-900/90 rounded-2xl p-3.5 border border-white/10 mb-4 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-zinc-200 flex items-center flex-wrap gap-1">
                  Tap the <Share className="w-3.5 h-3.5 text-blue-400 inline mx-0.5" /> <strong>Share</strong> icon in Safari's bottom toolbar.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-zinc-200 flex items-center flex-wrap gap-1">
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline mx-0.5" /> <strong>Add to Home Screen</strong>.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-zinc-200">
                  Tap <strong>Add</strong> in the top-right corner, then open the game icon from your home screen!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all cursor-pointer"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
