import React, { useState, useEffect, useMemo } from 'react';
import Menu from './Menu';

const Table = ({ onLogout, username, onNavigate }) => {
  // --- ステート管理 ---
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [sourceFile, setSourceFile] = useState('202608.csv'); // TODO: 初期値は仮置き。実際にはAPIから取得する
  const [loading, setLoading] = useState(true);

  // コントロール用ステート
  const [searchQuery, setSearchQuery] = useState('');  // 検索バーの入力値
  const [isEditMode, setIsEditMode] = useState(false); // true: 編集モードON, false: 編集モードOFF
  const [showClosed, setShowClosed] = useState(true);  // true: 全件表示, false: 未確定のみ

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

      //API呼び出し
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
  const updateExpenseOnServer = async (expenses_id, updatedFields) => {
    // 調査用ログを追加
    console.log('--- [単一更新リクエスト開始] ---');
    console.log('送信対象ID (expenses_id):', expenses_id);
    console.log('送信データ (updatedFields):', updatedFields);
    console.log('リクエストURL:', `/api/expenses/${expenses_id}/`);

    // IDが未定義(undefined/null)の場合はログを出して処理中断
    if (!expenses_id) {
      console.error('【エラー】expenses_id が undefined または null のためリクエストを中断しました');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/expenses/${expenses_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      console.log('レスポンスステータス:', response.status);

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
    // 調査用ログを追加
    console.log('--- [一括更新リクエスト開始] ---');
    console.log('送信対象ID配列 (ids):', ids);
    console.log('送信データ (updateData):', updateData);

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

      console.log('一括更新 レスポンスステータス:', response.status);

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
      prev.map((item) => (item.expenses_id === id ? { ...item, [field]: value } : item))
    );
    // リアルタイムでサーバーへ同期
    updateExpenseOnServer(id, { [field]: value });
  };

  // --- チェックボックス操作 ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredExpenses.map((item) => item.expenses_id);
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
      prev.map((item) => (selectedIds.includes(item.expenses_id) ? { ...item, category: bulkCategory } : item))
    );
    await bulkUpdateOnServer(selectedIds, { category: bulkCategory });
    showMessage(`${selectedIds.length}件のカテゴリを一括更新しました`, 'success');
  };

  const handleApplyBulkMember = async () => {
    if (!bulkMember) return showMessage('メンバーを選択してください', 'error');
    if (selectedIds.length === 0) return showMessage('対象の行にチェックを入れてください', 'error');

    setExpenses((prev) =>
      prev.map((item) => (selectedIds.includes(item.expenses_id) ? { ...item, member: bulkMember } : item))
    );
    await bulkUpdateOnServer(selectedIds, { member: bulkMember });
    showMessage(`${selectedIds.length}件のメンバーを一括更新しました`, 'success');
  };

  // 一括確定ボタンを押下した時の検証・処理
  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return showMessage('対象の行にチェックを入れてください', 'error');

    const selectedItems = expenses.filter((item) => selectedIds.includes(item.expenses_id));
    
    // カテゴリまたはメンバーが未設定の行があるかチェック
    const incompleteItems = selectedItems.filter((item) => !item.category || !item.member);

    if (incompleteItems.length > 0) {
      return showMessage('カテゴリとメンバーのどちらも入力した状態でのみ確定できます', 'error');
    }

    setExpenses((prev) =>
      prev.map((item) => (selectedIds.includes(item.expenses_id) ? { ...item, is_closed: true } : item))
    );
    await bulkUpdateOnServer(selectedIds, { is_closed: true });
    showMessage(`${selectedIds.length}件を確定済みにしました`, 'success');
    setSelectedIds([]);
  };

  // 日付文字列 ('YYYY-MM-DD') を 'YYYY/MM/DD(日)' 形式に変換し、曜日とスタイルを返す関数
  const formatDateWithDay = (dateStr) => {
    if (!dateStr) return { formatted: '-', isWeekend: false };

    // '2026-07-06' などを Date オブジェクトに変換 (時刻補正のためハイフンをスラッシュに置換)
    const date = new Date(dateStr.replace(/-/g, '/'));
    if (isNaN(date.getTime())) return { formatted: dateStr, isWeekend: false };

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dayOfWeekNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = date.getDay(); // 0: 日曜日, 6: 土曜日

    const formatted = `${year}/${month}/${day}(${dayOfWeekNames[dayOfWeek]})`;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 土日の判定

    return { formatted, isWeekend };
  };

  // --- 検索・表示絞り込み処理（自動更新） ---
  const filteredExpenses = useMemo(() => {

    return expenses.filter((item) => {

      // 確定済み表示トグル（showClosed: false のときは未確定のみ表示）
      if (!showClosed && item.is_closed) return false;

      // 検索バー絞り込み
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();

      // 検索対象フィールド: ID, 日付, 店名, メモ, 金額, カテゴリ, メンバー
      return (
        String(item.expenses_id ?? '').toLowerCase().includes(q) ||
        String(item.use_date ?? '').toLowerCase().includes(q) ||
        String(item.shop ?? '').toLowerCase().includes(q) ||
        String(item.memo ?? '').toLowerCase().includes(q) ||
        String(item.amount ?? '').includes(q) ||
        String(item.category ?? '').toLowerCase().includes(q) ||
        String(item.member ?? '').toLowerCase().includes(q)
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
                {/* <span style={styles.slider}></span> */}
              </label>
            </div>

            {/* 表示 (確定済み含めるか) トグル */}
            <div style={styles.toggleItem}>
              <span style={styles.toggleLabel}>確定済みも表示</span>
              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={showClosed}
                  onChange={(e) => setShowClosed(e.target.checked)}
                />
                {/* <span style={styles.slider}></span> */}
              </label>
            </div>
          </div>
        </div>

        {/* 一括操作エリア (編集モードON時のみ表示) */}
        <div style={{
          ...styles.bulkCardWrapper,
          maxHeight: isEditMode ? '120px' : '0px',
          opacity: isEditMode ? 1 : 0,
          marginBottom: isEditMode ? '15px' : '0px',
        }}>
          <div style={styles.bulkCard}>
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
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
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
                    {members.map((m) => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.member_name}
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
        </div>

        {/* テーブルエリア */}
        <div style={{
          ...styles.tableCard,
          ...(isEditMode ? styles.tableCardEditMode : {})
        }}>
          <div style={{
            ...styles.tableWrapper,
            maxHeight: isEditMode ? '515px' : '650px',
          }}>
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
                          filteredExpenses.every((item) => selectedIds.includes(item.expenses_id))
                        }
                      />
                    </th>
                  )}
                  <th style={{ ...styles.th, width: '30px' }}>ID</th>
                  <th style={{ ...styles.th, width: '97px' }}>日付</th>
                  <th style={styles.th}>店名</th>
                  <th style={styles.th}>メモ</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: '60px' }}>金額</th>
                  <th style={{ ...styles.th, width: '135px' }}>カテゴリ</th>
                  <th style={{ ...styles.th, width: '81px' }}>メンバー</th>
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
                            checked={selectedIds.includes(row.expenses_id)}
                            onChange={() => handleSelectRow(row.expenses_id)}
                          />
                        </td>
                      )}

                      {/* ID */}
                      <td style={{ ...styles.td, color: '#94a3b8', fontSize: '13px' }}>
                        {row.expenses_id}
                      </td>

                      {/* 日付 */}
                      {/* <td style={styles.td}>{row.use_date}</td> */}
                      <td style={styles.td}>
                        {(() => {
                          const { formatted, isWeekend } = formatDateWithDay(row.use_date);
                          return (
                            <span style={{ color: isWeekend ? '#ff8398' : 'inherit' }}>
                              {formatted}
                            </span>
                          );
                        })()}
                      </td>

                      {/* 店名 */}
                      <td style={{ ...styles.td, fontWeight: '600' }}>{row.shop}</td>

                      {/* メモ (編集モードでインライン編集) */}
                      <td style={styles.td}>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={row.memo || ''}
                            onChange={(e) => handleFieldChange(row.expenses_id, 'memo', e.target.value)}
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
                            // 初期値: null の場合は空文字、値があれば ID を指定
                            value={row.category ?? ''}
                            onChange={(e) => handleFieldChange(
                              row.expenses_id, 
                              'category', 
                              e.target.value ? Number(e.target.value) : null
                            )}
                            style={styles.tableSelect}
                          >
                            <option value="">未選択</option>
                            {categories.map((c) => (
                              <option key={c.category_id} value={c.category_id}>
                                {c.category_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          row.category_detail?.category_name ?? '未選択'
                        )}
                      </td>

                      {/* メンバー (編集モードでドロップダウン) */}
                      <td style={styles.td}>
                        {isEditMode ? (
                          <select
                            value={row.member ?? ''}
                            onChange={(e) => handleFieldChange(
                              row.expenses_id, 
                              'member', 
                              e.target.value ? Number(e.target.value) : null
                            )}
                            style={styles.tableSelect}
                          >
                            <option value="">未選択</option>
                            {members.map((m) => (
                              <option key={m.member_id} value={m.member_id}>
                                {m.member_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          row.member_detail?.member_name ?? '未選択'
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

// スタイル定義
const styles = {
  container: {
    position: 'relative',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: '35px 24px 0px 24px',
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
    maxWidth: '1300px',
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
    padding: '7px 7px',
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
    // gap: '5px',
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
  // slider: {
  //   position: 'absolute',
  //   cursor: 'pointer',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: 'rgba(51, 65, 85, 0.8)',
  //   borderRadius: '24px',
  //   transition: '0.3s',
  // },
  bulkCardWrapper: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-bottom 0.3s ease-in-out',
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
  /* テーブルエリア */
  tableCard: {
    borderRadius: '20px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  },
  /* 編集モード時のテーブル発光スタイル */
  tableCardEditMode: {
    border: '1px solid rgba(56, 189, 248, 0.4)',
    boxShadow: '0 0 25px rgba(56, 189, 248, 0.15), 0 20px 40px rgba(0, 0, 0, 0.3)',
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '650px',
    transition: 'max-height 0.3s ease-in-out', // 滑らかに高さを変化させる
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  /* テーブルヘッダー */
  th: {
    padding: '10px 10px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#cbd5e1',
    backgroundColor: 'rgb(15, 23, 42)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  td: {
    // padding: '12px 16px',
    padding: '3px 10px',
    fontSize: '14px',
    color: '#f8fafc',
    verticalAlign: 'middle',
  },
  tdRight: {
    // padding: '12px 16px',
    padding: '3px 10px',
    fontSize: '14px',
    color: '#f8fafc',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  tableInput: {
    width: '100%',
    padding: '3px 10px',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#f8fafc',
    fontSize: '13px',
    boxSizing: 'border-box',
    height: '28px',
  },
  tableSelect: {
    width: '100%',
    padding: '3px 10px',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#f8fafc',
    fontSize: '13px',
    boxSizing: 'border-box',
    height: '28px',
  },
  closedBadge: {
    display: 'inline-block',
    padding: '0px 7px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid',
  },
};

export default Table;