import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import PictureDisplay from './components/PictureDisplay';
import LoginPage from './components/LoginPage';
import { login as apiLogin, logout as apiLogout } from './api/client';

function App() {
  const storageKey = useMemo(() => 'auth:isLoggedIn', []);
  const userKey = useMemo(() => 'auth:login', []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [login, setLogin] = useState('');

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(storageKey) === 'true');
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
    localStorage.removeItem(storageKey);
    localStorage.removeItem(userKey);
    setIsLoggedIn(false);
    setLogin('');
  };

  return (
    <div className="App">
      <main>
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
