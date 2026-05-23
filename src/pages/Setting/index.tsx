import { FC, useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useHashLocation } from 'wouter/use-hash-location';
import styles from './index.module.scss';

const Setting: FC = () => {
  const [, setLocation] = useHashLocation();
  const [issuer, setIssuer] = useState('');
  const [secret, setSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState('');
  const autoFilled = useRef(false);

  // 解析 otpauth:// URI
  const parseUri = (uri: string) => {
    try {
      if (!uri.startsWith('otpauth://')) return null;
      const url = new URL(uri);
      const qSecret = url.searchParams.get('secret') || '';
      const qIssuer = url.searchParams.get('issuer') || '';
      // path 格式: /totp/Issuer:Label 或 /totp/Label
      const rawPath = decodeURIComponent(url.pathname);
      const label = rawPath.replace(/^\/totp\//, '') || '';
      const extractedIssuer = qIssuer || (label.includes(':') ? label.split(':')[0] : '');
      if (!qSecret) return null;
      return { issuer: extractedIssuer, label, secret: qSecret };
    } catch {
      return null;
    }
  };

  // 监听剪贴板中的二维码
  useEffect(() => {
    if (autoFilled.current) return;

    const check = async () => {
      try {
        const result: string | null = await invoke('check_clipboard_qr');
        if (!result) return;
        const parsed = parseUri(result);
        if (parsed && parsed.secret) {
          setIssuer(parsed.issuer);
          setSecret(parsed.secret);
          setStatus(`检测到 ${parsed.issuer || '未知'} 的二维码`);
          autoFilled.current = true;
        }
      } catch {
        // 静默失败
      }
    };

    check();
    const timer = setInterval(check, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async () => {
    if (!issuer.trim() || !secret.trim()) return;
    try {
      await invoke('save_account', {
        issuer: issuer.trim(),
        label: issuer.trim(),
        secret: secret.trim().replace(/\s/g, ''),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      // 保存后自动跳回首页
      setTimeout(() => setLocation('/'), 600);
    } catch (e) {
      setStatus('保存失败');
    }
  };

  return (
    <div className={styles.setting}>
      {status && <div className={styles.status}>{status}</div>}
      <div className={styles.card}>
        <label className={styles.label}>provider</label>
        <input
          className={styles.input}
          type="text"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          placeholder="输入提供商名称"
        />
      </div>
      <div className={styles.card}>
        <label className={styles.label}>key</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="输入密钥"
        />
      </div>
      <button
        className={`${styles.btn} ${saved ? styles.btnSaved : ''}`}
        onClick={handleSave}
        disabled={!issuer.trim() || !secret.trim()}
      >
        {saved ? '✓ 已保存，即将返回' : '保存'}
      </button>
    </div>
  );
};

export default Setting;
