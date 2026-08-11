import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 起動時にトークンの有無を確認
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div>
      {isLoggedIn ? (
        <Dashboard onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;