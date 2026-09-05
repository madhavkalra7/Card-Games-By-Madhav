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

  // Sync mode if changed from store
  React.useEffect(() => {
    setMode(authMode);
    setError(null);
  }, [authMode, isAuthModalOpen]);

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

  // Initialize Google Identity Services when modal opens
  React.useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (isAuthModalOpen && googleClientId && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          callback: async (response: any) => {
            if (response?.credential) {
              const res = await loginWithGoogle({ credential: response.credential });
              if (!res.success) {
                setError(res.error || 'Google sign-in failed.');
              }
            }
          },
        });
      } catch (e) {
        console.warn('Google GSI init warning:', e);
      }
    }
  }, [isAuthModalOpen]);

  const handleGoogleAuth = async () => {
    setError(null);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 1. Live Google OAuth using GIS token client
    if (googleClientId && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              if (tokenResponse.error === 'access_denied') {
                setError('Google sign-in was cancelled.');
              } else {
                setError(`Google error: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            if (tokenResponse.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userRes.json();

                const res = await loginWithGoogle({
                  email: googleProfile.email,
                  name: googleProfile.name,
                  googleId: googleProfile.sub,
                  avatarUrl: googleProfile.picture,
                });

                if (!res.success) {
                  setError(res.error || 'Failed to complete Google sign in.');
                }
              } catch (err: any) {
                setError(err.message || 'Failed to fetch Google profile.');
              }
            }
          },
        });
        tokenClient.requestAccessToken();
        return;
      } catch (err: any) {
        console.error('Google token client error:', err);
      }
    }

    // 2. Live Google One-Tap prompt fallback
    if (googleClientId && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError('Google popup prompt blocked. Please check browser permissions or use email login.');
        }
      });
      return;
    }

    // 3. Client ID not configured warning
    if (!googleClientId) {
      setError(
        '⚠️ Google Client ID not yet configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file (and Vercel environment variables) to enable live Google login.'
      );
      return;
    }

    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error || 'Google login failed.');
    }
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
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
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
              "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
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
              "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
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
          className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer mb-4"
        >
          {/* Multi-Color Google G SVG */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
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
        <div className="relative flex items-center justify-center my-4">
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
                className="absolute right-3 text-zinc-400 hover:text-white"
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
                className="text-amber-400 font-bold hover:underline"
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
                className="text-amber-400 font-bold hover:underline"
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
