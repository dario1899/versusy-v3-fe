import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import PictureDisplay from './components/PictureDisplay';
import LoginPage from './components/LoginPage';
import { fetchMockCredentials } from './services/mockAuth';

function App() {
  const storageKey = useMemo(() => 'auth:isLoggedIn', []);
  const userKey = useMemo(() => 'auth:login', []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [login, setLogin] = useState('');

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(storageKey) === 'true');
    setLogin(localStorage.getItem(userKey) || '');
  }, [storageKey, userKey]);

  const handleLogin = async ({ login, password }) => {
    await fetchMockCredentials();
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(userKey, login);
    setIsLoggedIn(true);
    setLogin(login);
  };

  const handleLogout = () => {
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
