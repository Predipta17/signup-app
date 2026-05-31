import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './SignupForm.css';

/* ───────── helpers ───────── */
const validateField = (name, value, formData) => {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 50) return 'Name must be at most 50 characters';
      return '';

    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
      return '';

    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'At least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Include an uppercase letter';
      if (!/[a-z]/.test(value)) return 'Include a lowercase letter';
      if (!/[0-9]/.test(value)) return 'Include a number';
      return '';

    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      if (value !== formData.password) return 'Passwords do not match';
      return '';

    default:
      return '';
  }
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', className: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', className: 'weak' };
  if (score <= 3) return { score, label: 'Fair', className: 'fair' };
  if (score <= 4) return { score, label: 'Strong', className: 'strong' };
  return { score, label: 'Excellent', className: 'excellent' };
};

/* ───────── component ───────── */
export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' }); // 'success' | 'error' | 'loading'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  /* handlers */
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        // live‑validate only if the field was already touched
        if (touched[name]) {
          setErrors((prevErr) => ({
            ...prevErr,
            [name]: validateField(name, value, next),
            // also re-validate confirmPassword when password changes
            ...(name === 'password' && touched.confirmPassword
              ? { confirmPassword: validateField('confirmPassword', next.confirmPassword, next) }
              : {}),
          }));
        }
        return next;
      });
    },
    [touched]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, formData) }));
    },
    [formData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields = ['name', 'email', 'password', 'confirmPassword'];
    const newErrors = {};
    fields.forEach((f) => {
      newErrors[f] = validateField(f, formData[f], formData);
    });
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (Object.values(newErrors).some((msg) => msg)) return;

    setStatus({ type: 'loading', message: '' });

    try {
      const res = await axios.post('/api/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setStatus({ type: 'success', message: res.data.message || 'Account created successfully!' });
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setTouched({});
      setErrors({});
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join('. ') ||
        'Something went wrong. Please try again.';
      setStatus({ type: 'error', message: msg });
    }
  };

  const isLoading = status.type === 'loading';

  return (
    <div className="signup-card">
      {/* Glow border effect */}
      <div className="signup-card__glow" aria-hidden="true" />

      <div className="signup-card__inner">
        {/* Header */}
        <header className="signup-card__header">
          <div className="signup-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="signup-card__title">Create Account</h1>
          <p className="signup-card__subtitle">Join us today and get started in minutes</p>
        </header>

        {/* Status messages */}
        {status.type && status.type !== 'loading' && (
          <div className={`signup-alert signup-alert--${status.type}`} role="alert" id="signup-status">
            <span className="signup-alert__icon">
              {status.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
            </span>
            <span>{status.message}</span>
          </div>
        )}

        {/* Form */}
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className={`form-group ${touched.name && errors.name ? 'form-group--error' : ''} ${touched.name && !errors.name && formData.name ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-name" className="form-label">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </span>
              <input
                id="signup-name"
                type="text"
                name="name"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
                disabled={isLoading}
              />
            </div>
            {touched.name && errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className={`form-group ${touched.email && errors.email ? 'form-group--error' : ''} ${touched.email && !errors.email && formData.email ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-email" className="form-label">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </span>
              <input
                id="signup-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            {touched.email && errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className={`form-group ${touched.password && errors.password ? 'form-group--error' : ''} ${touched.password && !errors.password && formData.password ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-password" className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {/* Password strength meter */}
            {formData.password && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  <div
                    className={`password-strength__fill password-strength__fill--${passwordStrength.className}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`password-strength__label password-strength__label--${passwordStrength.className}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}

            {touched.password && errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className={`form-group ${touched.confirmPassword && errors.confirmPassword ? 'form-group--error' : ''} ${touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </span>
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="signup-btn" id="signup-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="signup-btn__loader">
                <span className="spinner" aria-hidden="true" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="signup-card__footer">
          Already have an account?{' '}
          <a href="#" className="signup-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
