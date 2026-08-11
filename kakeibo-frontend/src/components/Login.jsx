import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // Django の JWT 発行エンドポイントへ送信
      const response = await fetch('/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error('ユーザー名またはパスワードが正しくありません');
      }

      const data = await response.json();

      // JWT トークンを保存
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      // ログイン成功を親コンポーネントへ通知
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 背景のネオンブラー */}
      {/* <div style={styles.glowCircle1}></div> */}
      {/* <div style={styles.glowCircle2}></div> */}

      {/* ログインカード */}
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>KAKEIBO</h1>
          <p style={styles.subtitle}>サインインして作業を開始</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* ユーザー名入力 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              style={styles.input}
              disabled={isLoading}
              required
            />
          </div>

          {/* パスワード入力 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={isLoading}
              required
            />
          </div>

          {/* ログインボタン */}
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* フッターリンク */}
        <div style={styles.footer}>
          <a href="/admin/" style={styles.link}>
            Djangoシステム管理画面はこちら →
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif',
    overflow: 'hidden',
    margin: 0,
  },
  glowCircle1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: '50%',
    top: '15%',
    left: '25%',
    filter: 'blur(80px)',
    opacity: 0.4,
    zIndex: 1,
  },
  glowCircle2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    borderRadius: '50%',
    bottom: '15%',
    right: '25%',
    filter: 'blur(100px)',
    opacity: 0.3,
    zIndex: 1,
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    borderRadius: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    zIndex: 2,
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '2px',
    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
    paddingLeft: '4px',
  },
  input: {
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  button: {
    marginTop: '12px',
    padding: '14px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    transition: 'all 0.2s ease',
  },
  error: {
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
  },
  link: {
    fontSize: '13px',
    color: '#94a3b8',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
};

export default Login;