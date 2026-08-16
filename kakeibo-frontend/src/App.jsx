import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Table from './components/Table';

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  
  // 表示する画面を管理するステート ('DashBoard' | 'Table')
  const [currentView, setCurrentView] = useState('DashBoard');

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
    setCurrentView('DashBoard'); // ログアウト時に初期画面へ戻す
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // currentView に応じて画面コンポーネントを切り替える
  return (
    <div>
      {currentView === 'DashBoard' && (
        <Dashboard
          onLogout={handleLogout}
          username={username}
          onNavigate={setCurrentView} // 画面遷移用の関数を渡す
        />
      )}
      {currentView === 'Table' && (
        <Table
          onLogout={handleLogout}
          username={username}
          onNavigate={setCurrentView} // 画面遷移用の関数を渡す
        />
      )}
    </div>
  );
}

export default App;