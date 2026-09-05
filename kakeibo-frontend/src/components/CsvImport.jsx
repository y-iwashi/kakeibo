import React, { useState, useRef } from 'react';
import Menu from './Menu';

const CsvImport = ({ onLogout, username, onNavigate }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [metaInfo, setMetaInfo] = useState(null); // 1行目の会員情報など
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  // トーストメッセージ表示
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // CSVファイルの読み込みと解析
  const parseCSV = (fileObj) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;

        // Shift-JIS でデコード
        let decoder = new TextDecoder('shift-jis');
        let text = decoder.decode(buffer);

        // 文字化けチェック（UTF-8 の可能性がある場合）
        // if (text.includes('')) {
        //   decoder = new TextDecoder('utf-8');
        //   text = decoder.decode(buffer);
        // }

        // 行ごとに分割してパース
        const lines = text
          .split(/\r\n|\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length === 0) {
          showMessage('ファイルが空です', 'error');
          return;
        }

        // カンマ区切り解析（クォート考慮）
        const parseLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ''));
          return result;
        };

        const parsedLines = lines.map(parseLine);

        // 明細判定: 1行目がメタ情報（氏名・カード番号など）か判定
        let meta = null;
        let records = [];

        // 日付形式 (YYYY/MM/DD または YYYY-MM-DD) かどうかで利用明細行かチェック
        const dateRegex = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;

        if (parsedLines[0] && !dateRegex.test(parsedLines[0][0])) {
          // 1行目がヘッダー/メタ情報の場合
          meta = {
            name: parsedLines[0][0] || '',
            cardNumber: parsedLines[0][1] || '',
            cardType: parsedLines[0][2] || '',
          };
          records = parsedLines.slice(1);
        } else {
          records = parsedLines;
        }

        // 明細行の整理 (利用日, 店名, 金額, 支払区分...)
        const formattedRecords = records
          .filter((row) => row.length >= 3 && dateRegex.test(row[0]))
          .map((row, idx) => ({
            id: idx + 1,
            use_date: row[0],
            shop: row[1],
            amount: parseInt(row[2]?.replace(/,/g, ''), 10) || 0,
            payment_type: row[3] || '',
            memo: row[6] || '',
          }));

        setMetaInfo(meta);
        setPreviewData(formattedRecords);
        setFile(fileObj);
        showMessage(`${formattedRecords.length} 件のデータを読み込みました`, 'success');
      } catch (err) {
        console.error(err);
        showMessage('CSVの解析に失敗しました', 'error');
      }
    };

    reader.readAsArrayBuffer(fileObj);
  };

  // ファイル選択ハンドラー
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        return showMessage('.csv ファイルを選択してください', 'error');
      }
      parseCSV(selectedFile);
    }
  };

  // ドラッグ＆ドロップハンドラー
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        return showMessage('.csv ファイルを選択してください', 'error');
      }
      parseCSV(droppedFile);
    }
  };

  // サーバーへインポート実行
  const handleImport = async () => {
    if (!file || previewData.length === 0) {
      return showMessage('インポートするデータがありません', 'error');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/expenses/import/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('インポートに失敗しました');

      const data = await response.json();
      showMessage(data.message || 'インポートが完了しました', 'success');

      // リセット
      setFile(null);
      setPreviewData([]);
      setMetaInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Import Error:', error);
      showMessage('サーバーへのインポートに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Menu onLogout={onLogout} username={username} onNavigate={onNavigate} activeView="Import" />

      {/* 背景ネオン */}
      {/* <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div> */}

      {/* トースト通知 (画面最前面の固定配置) */}
      <div
        style={{
          ...styles.toast,
          opacity: message.text ? 1 : 0,
          transform: message.text ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
          pointerEvents: message.text ? 'auto' : 'none',
          backgroundColor: message.type === 'error' ? 'rgba(30, 27, 38, 0.95)' : 'rgba(15, 23, 42, 0.95)',
          borderColor: message.type === 'error' ? '#f43f5e' : '#38bdf8',
          color: message.type === 'error' ? '#fca5a5' : '#7dd3fc',
          boxShadow: message.type === 'error'
            ? '0 10px 25px -5px rgba(244, 63, 94, 0.3)'
            : '0 10px 25px -5px rgba(56, 189, 248, 0.3)',
        }}
      >
        {/* <span style={{ fontSize: '16px' }}>{message.type === 'error' ? '⚠️' : '✨'}</span> */}
        {message.text}
      </div>

      <main style={styles.content}>
        <div style={styles.titleArea}>
          <h1 style={styles.heading}>CSV Import</h1>
          <div style={styles.subStatus}>カード利用明細 (CSV) の一括取り込み</div>
        </div>

        {/* ファイルドロップ領域 */}
        <div
          style={{
            ...styles.dropZone,
            borderColor: isDragging ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
            backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'rgba(30, 41, 59, 0.6)',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={styles.dropIcon}>📁</div>
          <div style={styles.dropText}>
            {file ? (
              <span style={{ color: '#38bdf8', fontWeight: '700' }}>{file.name}</span>
            ) : (
              'CSVファイルをドラッグ＆ドロップ、またはクリックして選択'
            )}
          </div>
          <div style={styles.dropSubText}>三井住友カードなどのVpass明細CSVに対応</div>
        </div>

        {/* ファイルメタ情報表示 */}
        {metaInfo && (
          <div style={styles.metaCard}>
            <div style={styles.metaItem}>
              会員名: <span style={styles.metaVal}>{metaInfo.name}</span>
            </div>
            <div style={styles.metaItem}>
              カード番号: <span style={styles.metaVal}>{metaInfo.cardNumber}</span>
            </div>
            <div style={styles.metaItem}>
              種別: <span style={styles.metaVal}>{metaInfo.cardType}</span>
            </div>
          </div>
        )}

        {/* プレビュー表示エリア */}
        {previewData.length > 0 && (
          <div style={styles.previewContainer}>
            <div style={styles.previewHeader}>
              <div style={styles.previewTitle}>
                プレビュー (全 <span style={styles.highlight}>{previewData.length}</span> 件)
              </div>
              <button
                onClick={handleImport}
                disabled={loading}
                style={{
                  ...styles.importBtn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'インポート中...' : 'この内容でインポート'}
              </button>
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '40px' }}>No.</th>
                      <th style={{ ...styles.th, width: '110px' }}>利用日</th>
                      <th style={styles.th}>利用店名・商品名</th>
                      <th style={{ ...styles.th, width: '250px' }}>メモ</th>
                      <th style={{ ...styles.th, textAlign: 'right', width: '100px' }}>金額</th>
                      {/* <th style={{ ...styles.th, width: '100px' }}>支払区分</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row) => (
                      <tr key={row.id} style={styles.tr}>
                        <td style={{ ...styles.td, color: '#94a3b8', fontSize: '12px' }}>{row.id}</td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{row.use_date}</td>
                        <td style={styles.td}>{row.shop}</td>
                        <td style={styles.td}>{row.memo}</td>
                        <td style={styles.tdRight}>{row.amount.toLocaleString()}</td>
                        {/* <td style={{ ...styles.td, color: '#94a3b8', fontSize: '12px' }}>{row.payment_type}</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: '35px 24px 40px 24px',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
//   glowCircle1: {
//     position: 'absolute',
//     width: '450px',
//     height: '450px',
//     background: 'linear-gradient(135deg, #6366f1, #a855f7)',
//     borderRadius: '50%',
//     top: '-100px',
//     right: '-100px',
//     filter: 'blur(140px)',
//     opacity: 0.15,
//     pointerEvents: 'none',
//   },
//   glowCircle2: {
//     position: 'absolute',
//     width: '400px',
//     height: '400px',
//     background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
//     borderRadius: '50%',
//     bottom: '-50px',
//     left: '-50px',
//     filter: 'blur(140px)',
//     opacity: 0.15,
//     pointerEvents: 'none',
//   },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid',
    backdropFilter: 'blur(12px)',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
    fontWeight: '700',
  },
  dropZone: {
    border: '2px dashed',
    borderRadius: '16px',
    padding: '15px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    backdropFilter: 'blur(16px)',
    marginBottom: '20px',
  },
  dropIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  dropText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '6px',
  },
  dropSubText: {
    fontSize: '12px',
    color: '#64748b',
  },
  metaCard: {
    display: 'flex',
    gap: '24px',
    padding: '12px 20px',
    borderRadius: '12px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#94a3b8',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    gap: '6px',
  },
  metaVal: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  importBtn: {
    padding: '10px 24px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    border: 'none',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s ease',
  },
  tableCard: {
    borderRadius: '16px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '450px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '10px 12px',
    fontSize: '12px',
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
    padding: '8px 12px',
    fontSize: '13px',
    color: '#f8fafc',
    verticalAlign: 'middle',
  },
  tdRight: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#f8fafc',
    textAlign: 'right',
    fontWeight: '700',
    verticalAlign: 'middle',
  },
};

export default CsvImport;