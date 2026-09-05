'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authMode,
    setAuthModalOpen,
    checkAuth,
    login,
    signup,
    loginWithGoogle,
    isLoading,
  } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>(authMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook 1: Sync mode if changed from store
  React.useEffect(() => {
    setMode(authMode);
    setError(null);
  }, [authMode, isAuthModalOpen]);

  // Hook 2: Listen for Google OAuth popup success message
  React.useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        if (event.data?.token) {
          localStorage.setItem('cg_auth_token', event.data.token);
        }
        await checkAuth();
        setAuthModalOpen(false);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [checkAuth, setAuthModalOpen]);

  // STRICT HOOK RULE: Return early ONLY after all hooks are declared
  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (!res.success) {
        setError(res.error || 'Failed to register.');
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please provide your email and password.');
        return;
      }

      const res = await login({
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleGoogleAuth = () => {
    setError(null);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

    if (googleClientId && !googleClientId.includes('your-google-client-id')) {
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        googleClientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&prompt=select_account`;

      // 1. Open popup synchronously in direct response to user click
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      try {
        const popup = window.open(
          googleAuthUrl,
          'google_login_popup',
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        // 2. If popup was blocked by browser, navigate directly
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          window.location.href = googleAuthUrl;
          return;
        }

        popup.focus();
        return;
      } catch {
        window.location.href = googleAuthUrl;
        return;
      }
    }

    // Fallback demo account if Client ID not set
    loginWithGoogle().then((res) => {
      if (!res.success) setError(res.error || 'Google login failed.');
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-[#18110b] to-[#0d0a06] border-2 border-gold/50 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.3)] p-5 sm:p-7 overflow-hidden">
        
        {/* Glow Ambient Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/20 blur-2xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Card Games By Madhav</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-serif">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'signup'
              ? 'Join table rooms, pick cartoon avatars & track scores'
              : 'Sign in to access your profile, stats & private rooms'}
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex p-1 bg-black/60 rounded-xl border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              mode === 'login'
                ? "bg-amber-400 text-black shadow-gold-glow"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              mode === 'signup'
                ? "bg-amber-400 text-black shadow-gold-glow"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs text-center font-medium animate-fadeIn">
            {error}
          </div>
        )}

        {/* Google Continue Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer mb-2"
        >
          {/* Multi-Color Google G SVG */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3.5">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#18110b] px-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            OR WITH EMAIL
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Madhav Kalra"
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-white text-xs sm:text-sm placeholder:text-zinc-600 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-white text-xs sm:text-sm placeholder:text-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              {mode === 'signup' ? 'Set Password' : 'Password'}
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-white text-xs sm:text-sm placeholder:text-zinc-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-white text-xs sm:text-sm placeholder:text-zinc-600 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-gold-glow active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In to Play</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="text-center mt-4 text-xs text-zinc-400">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
