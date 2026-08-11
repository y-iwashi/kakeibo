import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {

    // ページロード時にトークンとユーザー名を取得
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('username');

    if (token) {
      setIsLoggedIn(true);
      if (savedUser) setUsername(savedUser);
    }

  }, []);

  // ログイン成功時の処理
  const handleLoginSuccess = () => {
    const savedUser = localStorage.getItem('username');
    setUsername(savedUser || '');
    setIsLoggedIn(true);
  };

  // ログアウト時の処理
  const handleLogout = () => {
    // 保存したデータをすべて消去
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');

    // 状態をリセットしてログイン画面に戻す
    setUsername('');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} username={username} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;