import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeSlash, Kanban, CheckCircle } from '@phosphor-icons/react';
import { signUp, confirmSignUp, signIn } from '../auth/cognito';
import { usersApi } from '../api/users';
import { teamsApi } from '../api/teams';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';

const ROLES = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Manager', label: 'Manager' },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState('register');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'Employee', teamId: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    teamsApi.getPublic()
      .then((data) => setTeams(data))
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, []);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'At least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.teamId) errs.teamId = 'Please select a team';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await signUp(form.email, form.password, {
        name: form.name.trim(),
        role: form.role,
        teamId: form.teamId.trim() || undefined,
      });
      setStep('verify');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('UsernameExistsException')) {
        setServerError('An account with this email already exists.');
      } else {
        setServerError(msg || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp(form.email, code.trim());
      // Auto sign-in so we can bootstrap the DynamoDB record immediately
      const result = await signIn(form.email, form.password);
      setAuth(result.idToken);
      try { await usersApi.getMe(); } catch {}
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Verification failed. Check your code.');
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
            radial-gradient(ellipse 50% 50% at 80% 10%, rgba(37,106,105,0.11) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 85%, rgba(144,78,85,0.09) 0%, transparent 70%)
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
          <span className="text-base font-semibold text-brand-silver tracking-tight">MiniJira</span>
        </div>

        {step === 'register' && (
          <>
            <h1 className="text-xl font-semibold text-brand-silver mb-1">Create account</h1>
            <p className="text-sm text-brand-silver/40 mb-7">Join your team.</p>

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <Input
                label="Full name"
                placeholder="Yassin Diab"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
                required
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  error={errors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-[28px] text-brand-silver/25 hover:text-brand-silver/60 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                required
              />
              <Select
                label="Role"
                value={form.role}
                onValueChange={(v) => set('role', v)}
                options={ROLES}
                required
              />
              <Select
                label="Team"
                value={form.teamId}
                onValueChange={(v) => set('teamId', v)}
                options={[
                  { value: '', label: teamsLoading ? 'Loading teams…' : 'Select a team…', disabled: true },
                  ...teams.map((t) => ({ value: t.teamId, label: t.name })),
                ]}
                error={errors.teamId}
                required
              />

              {serverError && (
                <p className="text-sm text-brand-rose bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] px-3 py-2 rounded-md">
                  {serverError}
                </p>
              )}

              <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full mt-2">
                Create account
              </Button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <h1 className="text-xl font-semibold text-brand-silver mb-1">Verify email</h1>
            <p className="text-sm text-brand-silver/40 mb-7">
              Enter the 6-digit code sent to <span className="text-brand-silver/60">{form.email}</span>.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                label="Verification code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                required
                autoFocus
              />
              {serverError && (
                <p className="text-sm text-brand-rose bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] px-3 py-2 rounded-md">
                  {serverError}
                </p>
              )}
              <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full">
                Verify
              </Button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle size={40} weight="fill" className="text-brand-teal" />
            </div>
            <h1 className="text-xl font-semibold text-brand-silver">Email verified</h1>
            <p className="text-sm text-brand-silver/40">Your account is ready.</p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          </div>
        )}

        <p className="text-sm text-center text-brand-silver/30 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-rose/70 hover:text-brand-rose transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
