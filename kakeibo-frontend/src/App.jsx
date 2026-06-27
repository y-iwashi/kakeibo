import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { username, password });
    // 💡 ここに将来、DjangoのAPI（/api/login/など）を叩く処理を書きます
  };

  return (
    <div style={styles.container}>
      {/* 背景のネオンブラー（かっこいい光の玉） */}
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      {/* ログインカード */}
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>KAKEIBO</h1>
          <p style={styles.subtitle}>サインインして分析を開始</p>
        </div>

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
              required
            />
          </div>

          {/* ログインボタン */}
          <button type="submit" style={styles.button}>
            ログイン
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
}

// 🎨 インラインスタイル（CSSファイル不要でダークテーマを表現）
const styles = {
  container: {
    position: 'relative',
    // width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a', // 深みのあるダークブルー
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
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // 半透明のバック
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)', // ガラスエフェクト
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

export default App;
