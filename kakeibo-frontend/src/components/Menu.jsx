import React, { useState } from 'react';

// 1. props に onNavigate と activeView を受け取る
const Menu = ({ onLogout, username, onNavigate, activeView }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // ユーザー名の取得（propsが空ならlocalStorage、無ければ'Guest'）
  const currentUser = username || localStorage.getItem('username') || 'Guest';

  // メニューアイテムリスト (アイコンと識別ID/値を追加)
  const navItems = [
    { label: 'DashBoard', id: 'DashBoard' },
    { label: 'CSV Import', id: 'Import' },
    { label: 'Table', id: 'Table' },
    { label: 'EDA', id: 'EDA' },
    { label: 'Zones', id: 'Zones' },
    { label: 'Prediction', id: 'Prediction' },
  ];

  // メニュー項目が押された時の処理
  const handleNavClick = (targetId) => {
    toggleMenu();
    if (onNavigate) {
      onNavigate(targetId); // App.jsx の currentView 状態を更新
    }
  };

  const handleLogoutClick = () => {
    toggleMenu();
    // トークン類を直接消去
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');

    if (onLogout) {
      onLogout();
    } else {
      // App.jsxの関数が渡っていない場合も強制リロードでログイン画面へ戻す
      window.location.reload();
    }
  };

  return (
    <>
      {/* ハンバーガーボタン */}
      <button onClick={toggleMenu} style={styles.hamburgerBtn} aria-label="Toggle Menu">
        <div style={{ ...styles.bar, transform: isOpen ? 'rotate(45deg) translate(5px, 6px)' : 'none' }} />
        <div style={{ ...styles.bar, opacity: isOpen ? 0 : 1 }} />
        <div style={{ ...styles.bar, transform: isOpen ? 'rotate(-45deg) translate(5px, -6px)' : 'none' }} />
      </button>

      {/* バックドロップ（メニュー表示時の背景オーバーレイ） */}
      {isOpen && <div onClick={toggleMenu} style={styles.backdrop} />}

      {/* スライドメニュー本体 */}
      <aside style={{ ...styles.sidebar, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={styles.menuHeader}>
          <h2 style={styles.logoText}>KAKEIBO</h2>
        </div>

        {/* ナビゲーションリンク */}
        <nav style={styles.navGroup}>
          {navItems.map((item) => {
            const isActive = activeView === item.id || activeView === item.label;
            return (
              <button
                key={item.id}
                style={{
                  ...styles.navItem,
                  // 現在アクティブな画面のスタイルを少し明るくハイライト
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#cbd5e1',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  boxShadow: isActive ? 'inset 0 0 15px rgba(56, 189, 248, 0.08)' : 'none',
                }}
                onClick={() => handleNavClick(item.id)}
              >
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Django Adminリンク */}
          <a
            href="/admin/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.adminLink}
            onClick={toggleMenu}
          >
            <span>Admin (Django)</span>
          </a>
        </nav>

        {/* ユーザー情報＆ログアウト領域 */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{currentUser.charAt(0).toUpperCase()}</div>
            <div style={styles.userDetails}>
              <span style={styles.userLabel}>ログイン中</span>
              <span style={styles.username}>{currentUser}</span>
            </div>
          </div>

          <button onClick={handleLogoutClick} style={styles.logoutBtn}>
            ログアウト
          </button>
        </div>
      </aside>
    </>
  );
};

const styles = {
  hamburgerBtn: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 1001,
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  bar: {
    width: '20px',
    height: '2px',
    backgroundColor: '#38bdf8',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '280px',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '80px 20px 24px 20px',
    boxSizing: 'border-box',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '10px 0 30px rgba(0, 0, 0, 0.5)',
  },
  menuHeader: {
    marginBottom: '20px',
    paddingLeft: '8px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '2px',
    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  adminLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    color: '#38bdf8',
    fontSize: '15px',
    fontWeight: '500',
    textDecoration: 'none',
    marginTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  userSection: {
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '16px',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userLabel: {
    fontSize: '11px',
    color: '#64748b',
  },
  username: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default Menu;