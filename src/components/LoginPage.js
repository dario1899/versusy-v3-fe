import React, { useState } from 'react';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin({ login, password });
    } catch (err) {
      setError(err?.message || 'Login failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Zaloguj się</h1>
        {/* <p className="login-subtitle">
          Use <b>demo</b> / <b>demo</b>
        </p> */}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Login
            <input
              className="login-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              disabled={submitting}
              required
            />
          </label>

          <label className="login-label">
            Password
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="login-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

