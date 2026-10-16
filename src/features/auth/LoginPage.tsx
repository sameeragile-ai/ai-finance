import React, { useState, useRef } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, Mail, ArrowRight, ShieldAlert, KeyRound, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Overlays';

export const LoginPage: React.FC = () => {
  const {
    login,
    verify2FA,
    pending2FA,
    cancel2FA,
    failedAttempts,
    isLockedOut,
    resetLockout,
    requestPasswordReset,
  } = useAuth();

  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Demo@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state: 6 boxes
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed.');
      } else if (res.require2FA) {
        // focus first digit
        setTimeout(() => digitRefs[0].current?.focus(), 100);
      }
    }, 300);
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Pasted full code (e.g. 123456)
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      if (pasted.length === 6) {
        digitRefs[5].current?.focus();
        submit2FA(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal ? cleanVal[0] : '';
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      digitRefs[index + 1].current?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      submit2FA(newDigits.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const submit2FA = (code: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      const res = verify2FA(code);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid 2FA code.');
      }
    }, 250);
  };

  const handleUseDemoCode = () => {
    setDigits(['1', '2', '3', '4', '5', '6']);
    submit2FA('123456');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    requestPasswordReset(forgotEmail);
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-teal-500/20 mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Apex BrokerFlow</h1>
          <p className="text-xs text-teal-300 font-medium tracking-wide mt-1">
            Australian Mortgage & Finance Broking Portal • ACL #482910
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-white/20">
          {!pending2FA ? (
            /* STEP 1: Email and Password */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-slate-900">Broker Portal Sign In</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your accredited broker credentials to access client files.
                </p>
              </div>

              {isLockedOut && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Account Security Lockout
                  </div>
                  <p>
                    5 consecutive failed login attempts detected. For client privacy compliance, access is temporarily locked.
                  </p>
                  <button
                    type="button"
                    onClick={resetLockout}
                    className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
                  >
                    Reset Lockout (Demo Override)
                  </button>
                </div>
              )}

              {errorMessage && !isLockedOut && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMessage}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="broker@apexfinance.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11px] text-slate-400">
                    {failedAttempts > 0 && `${5 - failedAttempts} attempts left`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLockedOut}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to 2FA Verification
              </Button>

              {/* Demo Quick-Fill Pill */}
              <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 -mx-7 -mb-7 p-4 px-7 rounded-b-3xl">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Demo Credentials:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@demo.com');
                      setPassword('Demo@1234');
                    }}
                    className="text-teal-700 hover:text-teal-900 font-semibold underline text-xs cursor-pointer"
                  >
                    Load Admin Demo
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  admin@demo.com / Demo@1234
                </p>
              </div>
            </form>
          ) : (
            /* STEP 2: 2FA 6-digit Auto-advance */
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit verification code sent to your registered authenticator or phone.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
                  {errorMessage}
                </div>
              )}

              {/* 6 Digit auto-advance inputs */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={digitRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
                  />
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  onClick={() => submit2FA(digits.join(''))}
                  className="w-full"
                >
                  Verify and Sign In
                </Button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={cancel2FA}
                    className="text-slate-500 hover:text-slate-700 font-medium"
                  >
                    ← Back to Login
                  </button>

                  <button
                    type="button"
                    onClick={handleUseDemoCode}
                    className="text-teal-700 hover:text-teal-800 font-bold underline"
                  >
                    Auto-Fill Demo Code (123456)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Reset Broker Password"
        description="Enter your authorized Australian broker email address."
        maxWidth="sm"
      >
        {!forgotSubmitted ? (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <Input
              label="Accredited Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. admin@demo.com"
              required
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              A temporary password recovery link will be sent to this email address along with SMS verification.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Send Reset Link
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Reset Link Sent</h4>
            <p className="text-xs text-slate-600">
              Check your inbox at <span className="font-semibold">{forgotEmail}</span> for security instructions.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="mt-2"
            >
              Return to Login
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
