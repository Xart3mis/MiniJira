import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeSlash, Kanban } from '@phosphor-icons/react';
import { signIn, respondToNewPasswordChallenge } from '../auth/cognito';
import { usersApi } from '../api/users';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NEW_PASSWORD_REQUIRED challenge state
  const [challenge, setChallenge] = useState(null); // { session, username }
  const [newPw, setNewPw] = useState({ password: '', confirm: '' });
  const [showNewPw, setShowNewPw] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setError('');
  };

  const finishAuth = async (token) => {
    setAuth(token);
    try { await usersApi.getMe(); } catch {}
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn(form.email, form.password);
      if (result.challenge === 'NEW_PASSWORD_REQUIRED') {
        setChallenge({ session: result.session, username: result.username });
        return;
      }
      await finishAuth(result.idToken);
    } catch (err) {
      const code = err.code || '';
      if (code === 'NotAuthorizedException' || code === 'UserNotFoundException') {
        setError('Incorrect email or password.');
      } else if (code === 'UserNotConfirmedException') {
        setError('Please verify your email before signing in.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    if (newPw.password !== newPw.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (newPw.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await respondToNewPasswordChallenge(
        challenge.username,
        newPw.password,
        challenge.session,
      );
      await finishAuth(result.idToken);
    } catch (err) {
      setError(err.message || 'Failed to set new password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-4 py-16 relative"
      style={{ background: '#111218' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 15% 20%, rgba(144,78,85,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(37,106,105,0.1) 0%, transparent 70%)
          `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-rose flex items-center justify-center">
            <Kanban size={16} weight="fill" className="text-[#f0edee]" />
          </div>
          <span className="text-base font-semibold text-brand-silver tracking-tight">
            MiniJira
          </span>
        </div>

        <h1 className="text-xl font-semibold text-brand-silver mb-1">
          {challenge ? 'Set new password' : 'Sign in'}
        </h1>
        <p className="text-sm text-brand-silver/40 mb-7">
          {challenge ? 'Your account requires a new password before continuing.' : 'Track your team\'s work.'}
        </p>

        {challenge ? (
          <form onSubmit={handleNewPassword} className="space-y-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-silver/70 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPw.password}
                  onChange={(e) => { setNewPw((p) => ({ ...p, password: e.target.value })); setError(''); }}
                  autoComplete="new-password"
                  required
                  className={cn(
                    'h-9 w-full rounded-md px-3 pr-9 text-sm bg-brand-elevated text-brand-silver',
                    'border border-[var(--border-default)] placeholder:text-brand-silver/30',
                    'transition-colors duration-150',
                    'focus:outline-none focus:border-brand-rose focus:ring-1 focus:ring-brand-rose/30'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-silver/25 hover:text-brand-silver/60 transition-colors"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Input
              label="Confirm Password"
              type={showNewPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPw.confirm}
              onChange={(e) => { setNewPw((p) => ({ ...p, confirm: e.target.value })); setError(''); }}
              autoComplete="new-password"
              required
            />

            {error && (
              <p role="alert" className="text-sm text-brand-rose rounded-md bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] px-3 py-2">
                {error}
              </p>
            )}

            <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full mt-2">
              Set password and sign in
            </Button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            required
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-brand-silver/70 uppercase tracking-wide">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-brand-silver/35 hover:text-brand-rose/70 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                autoComplete="current-password"
                required
                className={cn(
                  'h-9 w-full rounded-md px-3 pr-9 text-sm bg-brand-elevated text-brand-silver',
                  'border border-[var(--border-default)] placeholder:text-brand-silver/30',
                  'transition-colors duration-150',
                  'focus:outline-none focus:border-brand-rose focus:ring-1 focus:ring-brand-rose/30'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-silver/25 hover:text-brand-silver/60 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-brand-rose rounded-md bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] px-3 py-2">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={loading}
            className="w-full mt-2"
          >
            Sign in
          </Button>
        </form>
        )}

        {!challenge && (
          <p className="text-sm text-center text-brand-silver/30 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-rose/70 hover:text-brand-rose transition-colors">
              Sign up
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
