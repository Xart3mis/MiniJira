import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Kanban, CheckCircle } from '@phosphor-icons/react';
import { forgotPassword, confirmNewPassword } from '../auth/cognito';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Request failed. Check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await confirmNewPassword(email, code.trim(), password);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Reset failed. Check your code.');
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
          background: `radial-gradient(ellipse 70% 60% at 50% 30%, rgba(144,78,85,0.08) 0%, transparent 70%)`,
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

        {step === 'request' && (
          <>
            <h1 className="text-xl font-semibold text-brand-silver mb-1">Reset password</h1>
            <p className="text-sm text-brand-silver/40 mb-7">
              We'll send a reset code to your email.
            </p>
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoFocus
                required
              />
              {error && (
                <p className="text-sm text-brand-rose bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
              <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full">
                Send reset code
              </Button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h1 className="text-xl font-semibold text-brand-silver mb-1">New password</h1>
            <p className="text-sm text-brand-silver/40 mb-7">
              Enter the code sent to <span className="text-brand-silver/60">{email}</span>.
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="Verification code"
                placeholder="123456"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                autoFocus
                required
              />
              <Input
                label="New password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
              />
              {error && (
                <p className="text-sm text-brand-rose bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
              <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full">
                Reset password
              </Button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle size={40} weight="fill" className="text-brand-teal mx-auto" />
            <h1 className="text-xl font-semibold text-brand-silver">Password reset</h1>
            <p className="text-sm text-brand-silver/40">You can now sign in with your new password.</p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
              Back to sign in
            </Button>
          </div>
        )}

        <p className="text-sm text-center text-brand-silver/30 mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-brand-rose/70 hover:text-brand-rose transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
