import React, { useState, useEffect, useMemo } from 'react';
import Menu from './Menu';

const Table = ({ onLogout, username, onNavigate }) => {
  // --- ステート管理 ---
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(['食品・日用品', '外食', '衣服・美容', 'インターネット', 'その他']);
  const [members, setMembers] = useState(['共有', 'な', 'ゆ']);
  const [sourceFile, setSourceFile] = useState('202608.csv');
  const [loading, setLoading] = useState(true);

  // コントロール用ステート
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showClosed, setShowClosed] = useState(true); // true: 全件表示, false: 未確定のみ

  // チェックボックス・一括操作用ステート
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkMember, setBulkMember] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); // アラートメッセージ

  // APIから最新データとマスタデータを取得
  useEffect(() => {
    fetchLatestExpenses();
  }, []);

  const fetchLatestExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/expenses/latest/', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('データの取得に失敗しました');

      const data = await response.json();
      setExpenses(data.expenses || []);
      setSourceFile(data.source_file || '');
      if (data.categories) setCategories(data.categories);
      if (data.members) setMembers(data.members);
    } catch (error) {
      console.error('Fetch Error:', error);
      showMessage('データの読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  // メッセージ表示ヘルパー
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // --- サーバーへの更新API実行 ---
  const updateExpenseOnServer = async (id, updatedFields) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/expenses/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) throw new Error('更新に失敗しました');
    } catch (error) {
      console.error('Update Error:', error);
      showMessage('サーバーの更新に失敗しました', 'error');
      // 失敗時は再取得して整合性を保つ
      fetchLatestExpenses();
    }
  };

  // 一括更新用サーバー通信
  const bulkUpdateOnServer = async (ids, updateData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/expenses/bulk-update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids, ...updateData }),
      });

      if (!response.ok) throw new Error('一括更新に失敗しました');
      return true;
    } catch (error) {
      console.error('Bulk Update Error:', error);
      showMessage('一括更新に失敗しました', 'error');
      return false;
    }
  };

  // --- 単一フィールド変更ハンドラー ---
  const handleFieldChange = (id, field, value) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    // リアルタイムでサーバーへ同期
    updateExpenseOnServer(id, { [field]: value });
  };

  // --- チェックボックス操作 ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredExpenses.map((item) => item.id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // --- 一括操作ボタンのハンドラー ---
  const handleApplyBulkCategory = async () => {
    if (!bulkCategory) return showMessage('カテゴリを選択してください', 'error');
    if (selectedIds.length === 0) return showMessage('対象の行にチェックを入れてください', 'error');

    setExpenses((prev) =>
      prev.map((item) => (selectedIds.includes(item.id) ? { ...item, category: bulkCategory } : item))
    );
    await bulkUpdateOnServer(selectedIds, { category: bulkCategory });
    showMessage(`${selectedIds.length}件のカテゴリを一括更新しました`, 'success');
  };

  const handleApplyBulkMember = async () => {
    if (!bulkMember) return showMessage('メンバーを選択してください', 'error');
    if (selectedIds.length === 0) return showMessage('対象の行にチェックを入れてください', 'error');

    setExpenses((prev) =>
      prev.map((item) => (selectedIds.includes(item.id) ? { ...item, member: bulkMember } : item))
    );
    await bulkUpdateOnServer(selectedIds, { member: bulkMember });
    showMessage(`${selectedIds.length}件のメンバーを一括更新しました`, 'success');
  };

  // 一括確定ボタンを押下した時の検証・処理
  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return showMessage('対象の行にチェックを入れてください', 'error');

    const selectedItems = expenses.filter((item) => selectedIds.includes(item.id));
    
    // カテゴリまたはメンバーが未設定の行があるかチェック
    const incompleteItems = selectedItems.filter((item) => !item.category || !item.member);

    if (incompleteItems.length > 0) {
      return showMessage('カテゴリとメンバーのどちらも入力した状態でのみ確定できます', 'error');
    }

    setExpenses((prev) =>
      prev.map((item) => (selectedIds.includes(item.id) ? { ...item, is_closed: true } : item))
    );
    await bulkUpdateOnServer(selectedIds, { is_closed: true });
    showMessage(`${selectedIds.length}件を確定済みにしました`, 'success');
    setSelectedIds([]);
  };

  // --- 検索・表示絞り込み処理（自動更新） ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // 確定済み表示トグル（showClosed: false のときは未確定のみ表示）
      if (!showClosed && item.is_closed) return false;

      // 検索バー絞り込み
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.id).toLowerCase().includes(q) ||
        (item.use_date && item.use_date.toLowerCase().includes(q)) ||
        (item.shop && item.shop.toLowerCase().includes(q)) ||
        (item.memo && item.memo.toLowerCase().includes(q)) ||
        String(item.amount).includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.member && item.member.toLowerCase().includes(q))
      );
    });
  }, [expenses, searchQuery, showClosed]);

  return (
    <div style={styles.container}>

      {/* ハンバーガーメニュー */}
      <Menu 
        onLogout={onLogout} 
        username={username} 
        onNavigate={onNavigate} 
        activeView="Table" // この画面名
      />

      {/* 背景ネオンエフェクト */}
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      <main style={styles.content}>
        {/* タイトル領域 */}
        <div style={styles.titleArea}>
          <h1 style={styles.heading}>Table</h1>
          <div style={styles.subStatus}>
            対象ファイル : <span style={styles.highlight}>{sourceFile}</span> / 編集モード :{' '}
            <span style={styles.highlight}>{isEditMode ? 'ON' : 'OFF'}</span>
            {isEditMode && (
              <>
                {' '}
                / 表示 : <span style={styles.highlight}>{showClosed ? '全件' : '未確定のみ'}</span>
              </>
            )}
          </div>
        </div>

        {/* メッセージアラート */}
        {message.text && (
          <div
            style={{
              ...styles.alert,
              backgroundColor: message.type === 'error' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              borderColor: message.type === 'error' ? '#f43f5e' : '#38bdf8',
              color: message.type === 'error' ? '#fca5a5' : '#7dd3fc',
            }}
          >
            {message.text}
          </div>
        )}

        {/* コントロールヘッダー (検索バー & トグルスイッチ) */}
        <div style={styles.controlCard}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="検索 (店名 / メモ / 金額 / カテゴリ / メンバー / 日付 など)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.toggleGroup}>
            {/* 編集モード トグル */}
            <div style={styles.toggleItem}>
              <span style={styles.toggleLabel}>編集モード</span>
              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={isEditMode}
                  onChange={(e) => setIsEditMode(e.target.checked)}
                />
                <span style={styles.slider}></span>
              </label>
            </div>

            {/* 表示 (確定済み含めるか) トグル */}
            <div style={styles.toggleItem}>
              <span style={styles.toggleLabel}>表示</span>
              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={showClosed}
                  onChange={(e) => setShowClosed(e.target.checked)}
                />
                <span style={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* 一括操作エリア (編集モードON時のみ表示) */}
        {isEditMode && (
          <div style={styles.bulkCard}>
            <h3 style={styles.bulkTitle}>一括操作</h3>
            <div style={styles.bulkGrid}>
              {/* カテゴリ一括 */}
              <div style={styles.bulkField}>
                <label style={styles.bulkLabel}>カテゴリー括</label>
                <div style={styles.bulkInputRow}>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">カテゴリを選択</option>
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleApplyBulkCategory} style={styles.applyBtn}>
                    適用
                  </button>
                </div>
              </div>

              {/* メンバー一括 */}
              <div style={styles.bulkField}>
                <label style={styles.bulkLabel}>メンバー一括</label>
                <div style={styles.bulkInputRow}>
                  <select
                    value={bulkMember}
                    onChange={(e) => setBulkMember(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">メンバーを選択</option>
                    {members.map((m, i) => (
                      <option key={i} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleApplyBulkMember} style={styles.applyBtn}>
                    適用
                  </button>
                </div>
              </div>

              {/* 確定一括 */}
              <div style={styles.bulkField}>
                <label style={styles.bulkLabel}>確定 (カテゴリ&メンバー埋まってる行だけ)</label>
                <button onClick={handleBulkConfirm} style={styles.confirmBtn}>
                  確定する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* テーブルエリア */}
        <div style={styles.tableCard}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {isEditMode && (
                    <th style={{ ...styles.th, width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          filteredExpenses.length > 0 &&
                          selectedIds.length === filteredExpenses.length
                        }
                      />
                    </th>
                  )}
                  <th style={{ ...styles.th, width: '70px' }}>ID</th>
                  <th style={{ ...styles.th, width: '120px' }}>日付</th>
                  <th style={styles.th}>店名</th>
                  <th style={styles.th}>メモ</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: '100px' }}>金額</th>
                  <th style={{ ...styles.th, width: '150px' }}>カテゴリ</th>
                  <th style={{ ...styles.th, width: '100px' }}>メンバー</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '70px' }}>確定</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isEditMode ? 9 : 8}
                      style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isEditMode ? 9 : 8}
                      style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}
                    >
                      データがありません
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((row) => (
                    <tr key={row.id} style={styles.tr}>
                      {/* チェックボックス */}
                      {isEditMode && (
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                        </td>
                      )}

                      {/* ID */}
                      <td style={{ ...styles.td, color: '#94a3b8', fontSize: '13px' }}>
                        {row.expenses_id}
                      </td>

                      {/* 日付 */}
                      <td style={styles.td}>{row.use_date}</td>

                      {/* 店名 */}
                      <td style={{ ...styles.td, fontWeight: '600' }}>{row.shop}</td>

                      {/* メモ (編集モードでインライン編集) */}
                      <td style={styles.td}>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={row.memo || ''}
                            onChange={(e) => handleFieldChange(row.id, 'memo', e.target.value)}
                            style={styles.tableInput}
                          />
                        ) : (
                          row.memo || ''
                        )}
                      </td>

                      {/* 金額 */}
                      <td style={{ ...styles.tdRight, fontWeight: '700' }}>
                        {row.amount?.toLocaleString()}
                      </td>

                      {/* カテゴリ (編集モードでドロップダウン) */}
                      <td style={styles.td}>
                        {isEditMode ? (
                          <select
                            value={row.category || ''}
                            onChange={(e) => handleFieldChange(row.id, 'category', e.target.value)}
                            style={styles.tableSelect}
                          >
                            <option value="">未選択</option>
                            {categories.map((c, i) => (
                              <option key={i} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : (
                          row.category || '-'
                        )}
                      </td>

                      {/* メンバー (編集モードでドロップダウン) */}
                      <td style={styles.td}>
                        {isEditMode ? (
                          <select
                            value={row.member || ''}
                            onChange={(e) => handleFieldChange(row.id, 'member', e.target.value)}
                            style={styles.tableSelect}
                          >
                            <option value="">未選択</option>
                            {members.map((m, i) => (
                              <option key={i} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        ) : (
                          row.member || '-'
                        )}
                      </td>

                      {/* 確定フラグバッジ */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span
                          style={{
                            ...styles.closedBadge,
                            backgroundColor: row.is_closed
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(255, 255, 255, 0.05)',
                            color: row.is_closed ? '#38bdf8' : '#64748b',
                            borderColor: row.is_closed ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {row.is_closed ? '済' : '未'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

// スタイル定義（ダーク＆ネオンテーマ統一）
const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
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
    opacity: 0.15,
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
    opacity: 0.15,
    pointerEvents: 'none',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  titleArea: {
    marginBottom: '20px',
  },
  heading: {
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    background: 'linear-gradient(to right, #f8fafc, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subStatus: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  highlight: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  controlCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    padding: '16px 20px',
    borderRadius: '16px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: '280px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  toggleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  toggleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toggleLabel: {
    fontSize: '13px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  /* トグルスイッチデザイン */
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: '24px',
    transition: '0.3s',
  },
  bulkCard: {
    padding: '20px',
    borderRadius: '16px',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.08)',
    marginBottom: '20px',
  },
  bulkTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 16px 0',
    color: '#f8fafc',
  },
  bulkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  bulkField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bulkLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  bulkInputRow: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
  },
  applyBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#334155',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  confirmBtn: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    border: 'none',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  tableCard: {
    borderRadius: '20px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '650px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#cbd5e1',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#f8fafc',
    verticalAlign: 'middle',
  },
  tdRight: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#f8fafc',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  tableInput: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#f8fafc',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  tableSelect: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#f8fafc',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  closedBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid',
  },
};

export default Table;