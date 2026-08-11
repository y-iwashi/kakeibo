import React from 'react';

const Dashboard = ({ onLogout }) => {
  const handleLogout = () => {
    // トークンを消去
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // 親コンポーネントにログアウトを通知
    onLogout();
  };

  return (
    <div style={styles.container}>
      {/* ヘッダー領域 */}
      <header style={styles.header}>
        <h1 style={styles.title}>家計簿ダッシュボード</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          ログアウト
        </button>
      </header>

      {/* メインコンテンツ */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h3>認証成功 🎉</h3>
          <p>ログイン状態の検証用画面です。出費データ通信はスキップしています。</p>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f8f9fa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#343a40', color: '#fff' },
  title: { margin: 0, fontSize: '1.25rem' },
  logoutBtn: { padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  main: { padding: '2rem' },
  card: { padding: '1.5rem', backgroundColor: '#fff', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
};

export default Dashboard;