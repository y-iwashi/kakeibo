import React from 'react';
import Menu from './Menu';

const Dashboard = ({ onLogout, username }) => {
  return (
    <div style={styles.container}>
      {/* ハンバーガーメニュー */}
      <Menu onLogout={onLogout} username={username} />

      {/* 背景のネオンブラー */}
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      {/* メインコンテンツ */}
      <main style={styles.content}>
        <div style={styles.titleArea}>
          <h1 style={styles.heading}>Dashboard</h1>
          <p style={styles.subheading}>支出データの概要</p>
        </div>

        {/* 概要カード（ダミー表示） */}
        <div style={styles.cardGrid}>
          <div style={styles.card}>
            <span style={styles.cardLabel}>今月の合計支出</span>
            <div style={styles.cardValue}>¥ 128,400</div>
            <span style={styles.cardBadge}>前月比 -12%</span>
          </div>

          <div style={styles.card}>
            <span style={styles.cardLabel}>データ登録件数</span>
            <div style={styles.cardValue}>42 件</div>
            <span style={styles.cardSub}>直近の更新: 今日</span>
          </div>

          <div style={styles.card}>
            <span style={styles.cardLabel}>予測カテゴリ</span>
            <div style={styles.cardValue}>食費・光熱費</div>
            <span style={styles.cardSub}>主要支出項目</span>
          </div>
        </div>

        {/* メインの分析プレースホルダーカード */}
        <div style={styles.mainCard}>
          <h3 style={styles.cardTitle}>月別支出推移（準備中）</h3>
          <div style={styles.placeholderChart}>
            <div style={{ ...styles.bar, height: '40%' }}></div>
            <div style={{ ...styles.bar, height: '65%' }}></div>
            <div style={{ ...styles.bar, height: '85%' }}></div>
            <div style={{ ...styles.bar, height: '50%' }}></div>
            <div style={{ ...styles.bar, height: '75%' }}></div>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif',
    padding: '80px 24px 40px 24px',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  glowCircle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: '50%',
    top: '-100px',
    right: '-100px',
    filter: 'blur(120px)',
    opacity: 0.25,
    pointerEvents: 'none',
  },
  glowCircle2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    borderRadius: '50%',
    bottom: '-50px',
    left: '-50px',
    filter: 'blur(120px)',
    opacity: 0.2,
    pointerEvents: 'none',
  },
  content: {
    maxWidth: '1100px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  titleArea: {
    marginBottom: '32px',
  },
  heading: {
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 8px 0',
    background: 'linear-gradient(to right, #f8fafc, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subheading: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: '20px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#38bdf8',
  },
  cardBadge: {
    fontSize: '12px',
    color: '#34d399',
    fontWeight: '600',
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748b',
  },
  mainCard: {
    padding: '32px',
    borderRadius: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  },
  cardTitle: {
    fontSize: '18px',
    margin: '0 0 24px 0',
    color: '#cbd5e1',
  },
  placeholderChart: {
    height: '180px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '0 20px',
  },
  bar: {
    flex: 1,
    background: 'linear-gradient(to top, #4f46e5, #38bdf8)',
    borderRadius: '8px 8px 0 0',
    opacity: 0.8,
  },
};

export default Dashboard;