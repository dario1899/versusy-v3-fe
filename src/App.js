import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import PictureDisplay from './components/PictureDisplay';
import LoginPage from './components/LoginPage';
import { login as apiLogin, logout as apiLogout, getStoredAccessToken, SESSION_EXPIRED_EVENT } from './api/client';

function App() {
  const storageKey = useMemo(() => 'auth:isLoggedIn', []);
  const userKey = useMemo(() => 'auth:login', []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [login, setLogin] = useState('');

  useEffect(() => {
    const onSessionExpired = () => {
      setIsLoggedIn(false);
      setLogin('');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  useEffect(() => {
    const loggedInFlag = localStorage.getItem(storageKey) === 'true';
    const hasToken = Boolean(getStoredAccessToken());

    if (loggedInFlag && !hasToken) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(userKey);
      setIsLoggedIn(false);
      setLogin('');
      return;
    }

    setIsLoggedIn(loggedInFlag && hasToken);
    setLogin(localStorage.getItem(userKey) || '');
  }, [storageKey, userKey]);

  const handleLogin = async ({ login: loginValue, password }) => {
    const data = await apiLogin(loginValue, password);
    const displayName =
      data?.user?.login ||
      data?.user?.email ||
      data?.username ||
      loginValue;
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(userKey, displayName);
    setIsLoggedIn(true);
    setLogin(displayName);
  };

  const handleLogout = async () => {
    await apiLogout();
    setIsLoggedIn(false);
    setLogin('');
  };

  return (
    <div className="App">
      <main className={isLoggedIn ? 'main--vote' : undefined}>
        {isLoggedIn ? (
          <>
            <div className="auth-header">
              <div className="welcome-text">Witaj {login}</div>
              <button className="logout-button" onClick={handleLogout} type="button">
                Wyloguj się
              </button>
            </div>
            <PictureDisplay />
          </>
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;
