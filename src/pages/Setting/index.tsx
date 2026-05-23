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

  // parse otpauth:// URI
  const parseUri = (uri: string) => {
    try {
      if (!uri.startsWith('otpauth://')) return null;
      const url = new URL(uri);
      const qSecret = url.searchParams.get('secret') || '';
      const qIssuer = url.searchParams.get('issuer') || '';
      // path format: /totp/Issuer:Label or /totp/Label
      const rawPath = decodeURIComponent(url.pathname);
      const label = rawPath.replace(/^\/totp\//, '') || '';
      const extractedIssuer = qIssuer || (label.includes(':') ? label.split(':')[0] : '');
      if (!qSecret) return null;
      return { issuer: extractedIssuer, label, secret: qSecret };
    } catch {
      return null;
    }
  };

  // watch clipboard for QR codes
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
          setStatus(`Detected QR code for ${parsed.issuer || 'unknown'}`);
          autoFilled.current = true;
        }
      } catch {
        // silent
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
      // navigate back to home after save
      setTimeout(() => setLocation('/'), 600);
    } catch (e) {
      setStatus('Save failed');
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
          placeholder="Enter provider name"
        />
      </div>
      <div className={styles.card}>
        <label className={styles.label}>key</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter secret key"
        />
      </div>
      <button
        className={`${styles.btn} ${saved ? styles.btnSaved : ''}`}
        onClick={handleSave}
        disabled={!issuer.trim() || !secret.trim()}
      >
        {saved ? '✓ Saved, returning...' : 'Save'}
      </button>
    </div>
  );
};

export default Setting;
