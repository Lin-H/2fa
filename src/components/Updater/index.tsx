import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from '@tauri-apps/api/core';
import styles from './index.module.scss';

// 全局事件名：设置页点击“检查更新”时触发手动检查
const CHECK_EVENT = 'check-updates';

const Updater: FC = () => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const downloadedRef = useRef(0);
  const contentLengthRef = useRef(0);

  // 执行检查（仅桌面端支持自动更新）
  const runCheck = useCallback(async (manual: boolean) => {
    try {
      const platform: string = await invoke('get_platform');
      if (platform !== 'desktop') return;
      const found = await check();
      if (found) {
        setUpdate(found);
        setError('');
      } else if (manual) {
        // 手动检查且无更新时给出提示
        setToast('已是最新版本');
        setTimeout(() => setToast(''), 2000);
      }
    } catch {
      // 网络异常等情况静默处理
    }
  }, []);

  useEffect(() => {
    // 启动时自动检查一次
    runCheck(false);

    // 监听设置页触发的手动检查
    const onManualCheck = () => runCheck(true);
    window.addEventListener(CHECK_EVENT, onManualCheck);
    return () => window.removeEventListener(CHECK_EVENT, onManualCheck);
  }, [runCheck]);

  // 点击“更新”：下载并安装新版本，完成后重启应用
  const handleInstall = async () => {
    if (!update) return;
    setDownloading(true);
    setError('');
    downloadedRef.current = 0;
    contentLengthRef.current = 0;
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          contentLengthRef.current = event.data.contentLength ?? 0;
          setProgress(0);
        } else if (event.event === 'Progress') {
          downloadedRef.current += event.data.chunkLength;
          const total = contentLengthRef.current;
          const pct = total > 0 ? Math.min(Math.round((downloadedRef.current / total) * 100), 100) : 0;
          setProgress(pct);
        } else if (event.event === 'Finished') {
          setProgress(100);
        }
      });
      // 安装完成，重启应用
      await relaunch();
    } catch {
      setError('下载或安装失败，请稍后重试');
      setDownloading(false);
    }
  };

  // 点击“稍后”：关闭弹窗，下次启动或手动检查时再提醒
  const handleLater = () => {
    if (downloading) return;
    setUpdate(null);
  };

  if (!update) return null;

  return (
    <div className={styles.overlay} onClick={handleLater}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          {downloading ? '正在更新...' : `发现新版本 v${update.version}`}
        </div>
        {!downloading && update.body && (
          <div className={styles.notes}>{update.body}</div>
        )}
        {downloading && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
        {downloading && (
          <div className={styles.progressText}>{progress}%</div>
        )}
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.modalFooter}>
          {!downloading && (
            <button className={styles.cancelBtn} onClick={handleLater}>
              稍后
            </button>
          )}
          {!downloading && (
            <button className={styles.confirmBtn} onClick={handleInstall}>
              更新
            </button>
          )}
        </div>
      </div>
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
};

export default Updater;
