import { FC, useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
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

const CodeItem: FC<{ account: Account; index: number; onDelete: () => void }> = ({
  account,
  index,
  onDelete,
}) => {
  const [data, setData] = useState<CodeData>({ code: '------', remaining: 30 });
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const update = async () => {
      try {
        const [code, remaining]: [string, number] = await invoke('generate_totp_code', {
          secret: account.secret,
        });
        setData({ code, remaining });
      } catch {
        setData({ code: '------', remaining: 30 });
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [account.secret]);

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

  return (
    <div className={styles.code} onContextMenu={handleContextMenu}>
      {showDelete && (
        <div className={styles.deleteArea}>
          <button className={styles.deleteBtn} onClick={() => setShowConfirm(true)}>
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
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleDelete}>Delete</button>
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
        <circle r="21" cx="24" cy="24" className={styles.outer}></circle>
        <circle
          r="21"
          cx="24"
          cy="24"
          strokeDasharray={`${getProgress(progress)} 999`}
          className={styles.inner}
        ></circle>
      </svg>
    </div>
  );
};

const Code: FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);

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

  if (accounts.length === 0) {
    return <div className={styles.empty}>No accounts yet. Add one in Settings.</div>;
  }

  return (
    <div className={styles.list}>
      {accounts.map((acc, i) => (
        <CodeItem key={i} index={i} account={acc} onDelete={load} />
      ))}
    </div>
  );
};

export default Code;
