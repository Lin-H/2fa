import { FC, useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from './index.module.scss';

interface Account {
  issuer: string;
  label: string;
  secret: string;
}

interface CodeData {
  code: string;
  remaining: number;
}

const CodeItem: FC<{ account: Account; index: number; onDelete: () => void; onCopy: () => void }> = ({
  account,
  index,
  onDelete,
  onCopy,
}) => {
  const [data, setData] = useState<CodeData>({ code: '------', remaining: 30 });
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = useCallback(async (): Promise<CodeData | null> => {
    try {
      const [code, remaining]: [string, number] = await invoke('generate_totp_code', {
        secret: account.secret,
      });
      const next: CodeData = { code, remaining };
      setData(next);
      return next;
    } catch {
      setData({ code: '------', remaining: 30 });
      return null;
    }
  }, [account.secret]);

  useEffect(() => {
    update();
    const timer = setInterval(update, 1000);

    // 窗口重新聚焦或页面重新可见时立即刷新 code，
    // 避免后台定时器被系统节流导致显示的 code 过期
    const handleFocus = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // 监听原生窗口焦点变化，重新获得焦点时同步刷新
    let unlistenFocus: (() => void) | undefined;
    getCurrentWindow()
      .onFocusChanged(({ payload }) => {
        if (payload) update();
      })
      .then((fn) => {
        unlistenFocus = fn;
      });

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      unlistenFocus?.();
    };
  }, [update]);

  const handleClick = async () => {
    if (showDelete || showConfirm) return;
    try {
      // 复制前重新生成最新 code，确保复制到的是未过期的值
      const fresh = await update();
      if (fresh) await navigator.clipboard.writeText(fresh.code);
      onCopy();
    } catch {
      // silent
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDelete((v) => !v);
    setShowConfirm(false);
  };

  const handleDelete = async () => {
    try {
      await invoke('delete_account', { index });
      onDelete();
    } catch {
      // silent
    }
  };

  const getProgress = (p: number) => (2 * Math.PI * 21 * p) / 100;
  const progress = (data.remaining / 30) * 100;

  const getCounterColor = () => {
    const period = 30;
    const threshold = period * 0.25; // 7.5s
    const t = data.remaining <= threshold ? 1 : (period - data.remaining) / (period - threshold);
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
    const inner = `rgb(${lerp(41, 240)},${lerp(112, 68)},${lerp(255, 56)})`;
    const outer = `rgb(${lerp(209, 240)},${lerp(224, 160)},${lerp(255, 160)})`;
    return { inner, outer };
  };

  const { inner: innerColor, outer: outerColor } = getCounterColor();

  return (
    <div className={styles.code} onContextMenu={handleContextMenu} onClick={handleClick}>
      {showDelete && (
        <div className={styles.deleteArea} onClick={(e) => e.stopPropagation()}>
          <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}>
            Delete
          </button>
        </div>
      )}
      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Confirm Delete</div>
            <div className={styles.modalBody}>Are you sure you want to delete the key for "{account.issuer}"?</div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={(e) => { e.stopPropagation(); handleDelete(); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className={styles.provider}>
          <div>
            <h3>{account.issuer}</h3>
            <div className={styles.email}>{account.label}</div>
          </div>
        </div>
        <div className={styles.key}>{data.code}</div>
      </div>
      <svg className={styles.counter}>
        <circle r="21" cx="24" cy="24" className={styles.outer} stroke={outerColor}></circle>
        <circle
          r="21"
          cx="24"
          cy="24"
          stroke={innerColor}
          strokeDasharray={`${getProgress(progress)} 999`}
          className={styles.inner}
        ></circle>
      </svg>
    </div>
  );
};

const Code: FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const result: Account[] = await invoke('load_accounts');
      setAccounts(result);
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = () => {
    setToast('Copied to clipboard');
    setTimeout(() => setToast(''), 2000);
  };

  if (accounts.length === 0) {
    return <div className={styles.empty}>No accounts yet. Add one in Settings.</div>;
  }

  return (
    <>
      {toast && <div className={styles.toast}>{toast}</div>}
      <div className={styles.list}>
        {accounts.map((acc, i) => (
          <CodeItem key={i} index={i} account={acc} onDelete={load} onCopy={handleCopy} />
        ))}
      </div>
    </>
  );
};

export default Code;
