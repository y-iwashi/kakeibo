import React, { useState, useEffect } from 'react';
import Menu from './Menu';

const Dashboard = ({ onLogout, username, onNavigate }) => {

  // DBから取得するデータの状態
  const [summaryData, setSummaryData] = useState({
    totalExpense: 0,
    totalCount: 0,
    maxExpense: 0,
    maxExpenseShop: '',
    sourceFile: '',
    momChangeRate: null,
    summaryTable: [],
    monthlyTrends: [],
  });
  const [loading, setLoading] = useState(true);

  // 画面が表示されたタイミングで1回だけ実行
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');

        // console.log("送信トークン:", token);

        // トークンが存在しない場合はログアウト処理を実行
        if (!token) {
          console.error("アクセストークンが存在しません。ログインし直してください。");
          setLoading(false);
          onLogout();
          return;
        }

        // バックエンドAPIへリクエスト
        const response = await fetch('/api/dashboard/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // 認証トークンが必要な場合
          },
        });

        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }

        const data = await response.json();

        // 取得したデータを状態にセット
        setSummaryData({
          totalExpense: data.total_expense,
          totalCount: data.total_count,
          maxExpense: data.max_expense,
          maxExpenseShop: data.max_expense_shop,
          sourceFile: data.source_file,
          momChangeRate: data.mom_change_rate,
          summaryTable: data.summary_table || [],
          monthlyTrends: data.monthly_trends || [],
        });

      } catch (error) {
        console.error('API Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 金額を「¥ 123,456」形式に整形するヘルパー関数
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '¥ ---';
    return `¥ ${amount.toLocaleString()}`;
  };

  // 先月比バッジの表示用ヘルパー関数
  const renderMomBadge = (mom_change_rate) => {
    if (mom_change_rate === null || mom_change_rate === undefined) {
      return <span style={{ ...styles.cardBadge, color: '#94a3b8' }}>先月比データなし</span>;
    }

    const isPositive = mom_change_rate > 0;
    const isNegative = mom_change_rate < 0;

    // 増加なら赤、減少なら青
    const badgeColor = isPositive ? '#f43f5e' : isNegative ? '#38bdf8' : '#94a3b8';
    const prefix = isPositive ? '+' : '-';

    return (
      <span style={{ ...styles.cardBadge, color: badgeColor }}>
        先月比 {prefix}{mom_change_rate}%
      </span>
    );
  };

  // 折れ線グラフを描画するヘルパー関数
  const renderLineChart = (chartData) => {
    if (!chartData || chartData.length === 0) return null;

    const svgWidth = 600;
    const svgHeight = 180;
    const paddingY = 35;
    const paddingX = 40;

    // データ内の最大金額を取得（0除算防止に|| 1）
    const maxAmount = Math.max(...chartData.map((d) => d.amount)) || 1;

    // 各データ点の座標（X, Y）を計算
    const points = chartData.map((item, index) => {
      const x = paddingX + (index * (svgWidth - paddingX * 2)) / (chartData.length - 1);
      // Y座標は上が0になるため反転させて計算
      const y = svgHeight - paddingY - (item.amount / maxAmount) * (svgHeight - paddingY * 2);
      return { x, y, ...item };
    });

    // 折れ線のパス命令（M x y L x y ...）を生成
    const linePathD = points.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      ''
    );

    // 面の塗りつぶし用パス命令（底辺まで囲む）
    const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          {/* 面のグラデーション */}
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>

          {/* 線のグラデーション */}
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9963f1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* ネオン発光フィルタ */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 背景ガイド線（横の点線） */}
        <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
        <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />

        {/* 下部の塗りつぶしエリア */}
        <path d={areaPathD} fill="url(#areaGradient)" />

        {/* 折れ線 */}
        <path
          d={linePathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* データポイント（点・テキスト） */}
        {points.map((p, i) => (
          <g key={i}>
            {/* 金額テキスト */}
            <text x={p.x} y={p.y - 15} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="600">
              ¥{(p.amount / 10000).toFixed(1)}万
            </text>

            {/* 発光する円ポイント */}
            {/* <circle cx={p.x} cy={p.y} r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" filter="url(#glow)" /> */}
            <circle cx={p.x} cy={p.y} r="3" fill="#2342f3" strokeWidth="1" filter="url(#glow)" />

            {/* 月テキスト */}
            <text x={p.x} y={svgHeight - 8} fill="#cbd5e1" fontSize="9" textAnchor="middle" fontWeight="600">
              {p.month}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div style={styles.container}>
      {/* ハンバーガーメニュー */}
      <Menu 
        onLogout={onLogout} 
        username={username} 
        onNavigate={onNavigate} 
        activeView="DashBoard" // この画面名
      />

      {/* 背景ネオンエフェクト */}
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      {/* メインコンテンツ */}
      <main style={styles.content}>
        <div style={styles.titleArea}>
          <h1 style={styles.heading}>Dashboard</h1>
          <p style={styles.subheading}>2026年8月度の家計状況サマリ</p>
        </div>

        {/* KPIカードエリア（3項目） */}
        <div style={styles.cardGrid}>

          {/* 今月の合計支出 */}
          <div style={styles.card}>
            <span style={styles.cardLabel}>今月の合計支出</span>
            <div style={styles.cardValue}>
              {loading ? '読み込み中...' : formatCurrency(summaryData.totalExpense)}
            </div>
            {renderMomBadge(summaryData.momChangeRate)}
          </div>

          {/* 今月のデータ登録件数 */}
          <div style={styles.card}>
            <span style={styles.cardLabel}>今月のデータ登録件数</span>
            <div style={{ ...styles.cardValue, color: '#38bdf8' }}>
              {loading ? '読み込み中...' : summaryData.totalCount + " 件"}
            </div>
            <span style={styles.cardSub}>対象: {summaryData.sourceFile}</span>
          </div>

          {/* 今月の最高金額 */}
          <div style={styles.card}>
            <span style={styles.cardLabel}>今月の最高金額</span>
            <div style={{ ...styles.cardValue, color: '#f43f5e' }}>
              {loading ? '読み込み中...' : formatCurrency(summaryData.maxExpense)}
            </div>
            <span style={styles.cardSub}>ショップ名: {summaryData.maxExpenseShop}</span>
          </div>
        </div>

        {/* 出費サマリテーブル */}
        <div style={styles.mainCard}>
          <div style={styles.summaryHeader}>
            <h2 style={styles.summaryTitle}>Summary</h2>
            <p style={styles.summarySub}>
              対象ファイル：<span style={styles.highlightText}>{summaryData.sourceFile}</span> / <span style={styles.highlightText}>確定済みのみ</span>
            </p>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thLeft}></th>
                  <th style={styles.thRight}>合計</th>
                  <th style={styles.thRight}>一人当たり</th>
                  <th style={styles.thRight}>住信SBI振込</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      読み込み中...
                    </td>
                  </tr>
                ) : (
                  (summaryData.summaryTable || []).map((row, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.tdLabel}>{row.label}</td>
                      <td style={styles.tdRight}>{formatCurrency(row.total)}</td>
                      <td style={styles.tdMutedRight}>{formatCurrency(row.per_person)}</td>
                      <td style={styles.tdRight}>{formatCurrency(row.sbi)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 月別支出推移グラフ */}
        <div style={{ ...styles.mainCard, marginTop: '24px' }}>
          <div style={styles.summaryHeader}>
            <h3 style={styles.cardTitle}>月別支出推移</h3>
            <span style={styles.cardSub}>ここ1年の変動傾向</span>
          </div>

          {/* スクロール用ラッパーに変更（スマホ表示時は横スクロールが出る） */}
          <div style={styles.chartWrapper}>
            <div style={styles.chartInner}>
              {renderLineChart(summaryData.monthlyTrends || [])}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: '35px 24px 60px 24px',
    boxSizing: 'border-box',
  },
  glowCircle1: {
    position: 'absolute',
    width: '450px',
    height: '450px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: '50%',
    top: '-100px',
    right: '-100px',
    filter: 'blur(140px)',
    opacity: 0.2,
    pointerEvents: 'none',
  },
  glowCircle2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    borderRadius: '50%',
    bottom: '-50px',
    left: '-50px',
    filter: 'blur(140px)',
    opacity: 0.18,
    pointerEvents: 'none',
  },
  content: {
    maxWidth: '1000px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  titleArea: {
    marginBottom: '28px',
  },
  heading: {
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 6px 0',
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
    padding: '20px 24px',
    borderRadius: '20px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: '-0.5px',
  },
  cardBadge: {
    fontSize: '12px',
    color: '#f43f5e',
    fontWeight: '600',
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748b',
  },
  chartWrapper: {
    overflowX: 'auto',                 // 横スクロールを許可
    WebkitOverflowScrolling: 'touch',  // iOSでの慣性スクロールを有効化
    paddingBottom: '8px',              // スクロールバー表示用の下部余白
  },
  chartInner: {
    minWidth: '600px',                 // スマホ時でも最低600pxの幅を確保
    width: '100%',                     // PCなどの広い画面では100%に広がります
  },
  mainCard: {
    padding: '28px 32px',
    borderRadius: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  },
  summaryHeader: {
    marginBottom: '20px',
  },
  summaryTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 6px 0',
    color: '#f8fafc',
  },
  summarySub: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
  highlightText: {
    color: '#cbd5e1',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
  },
  thLeft: {
    textAlign: 'left',
    padding: '10px 1px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#f8fafc',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  thRight: {
    textAlign: 'right',
    padding: '10px 1px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#f8fafc',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tdLabel: {
    padding: '10px 1px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    width: '20%',
  },
  tdRight: {
    padding: '10px 1px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'right',
  },
  tdMutedRight: {
    padding: '10px 1px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'right',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    color: '#f8fafc',
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '200px',
    paddingTop: '20px',
    gap: '12px',
  },
  barGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  barValue: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  barTrack: {
    width: '100%',
    maxWidth: '40px',
    height: '140px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
    padding: '2px',
    boxSizing: 'border-box',
  },
  barFill: {
    width: '100%',
    borderRadius: '6px',
    transition: 'height 0.3s ease',
  },
  barLabel: {
    fontSize: '12px',
    color: '#cbd5e1',
    fontWeight: '500',
  },
};

export default Dashboard;