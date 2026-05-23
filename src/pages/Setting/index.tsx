import { FC, useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useHashLocation } from 'wouter/use-hash-location';
import { scan } from '@tauri-apps/plugin-barcode-scanner';
import styles from './index.module.scss';

const Setting: FC = () => {
  const [, setLocation] = useHashLocation();
  const [issuer, setIssuer] = useState('');
  const [secret, setSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const autoFilled = useRef(false);

  // detect platform
  useEffect(() => {
    invoke<string>('get_platform').then((p) => {
      if (p === 'android' || p === 'ios') setIsMobile(true);
    });
  }, []);

  // parse otpauth:// URI
  const parseUri = (uri: string) => {
    try {
      if (!uri.startsWith('otpauth://')) return null;
      const url = new URL(uri);
      const qSecret = url.searchParams.get('secret') || '';
      const qIssuer = url.searchParams.get('issuer') || '';
      const rawPath = decodeURIComponent(url.pathname);
      const label = rawPath.replace(/^\/totp\//, '') || '';
      const extractedIssuer = qIssuer || (label.includes(':') ? label.split(':')[0] : '');
      if (!qSecret) return null;
      return { issuer: extractedIssuer, label, secret: qSecret };
    } catch {
      return null;
    }
  };

  // desktop: watch clipboard for QR codes
  useEffect(() => {
    if (isMobile || autoFilled.current) return;

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
  }, [isMobile]);

  // mobile: scan QR code with camera
  const handleScan = async () => {
    try {
      const result = await scan();
      if (!result || !result.content) return;
      const parsed = parseUri(result.content);
      if (parsed && parsed.secret) {
        setIssuer(parsed.issuer);
        setSecret(parsed.secret);
        setStatus(`Scanned QR code for ${parsed.issuer || 'unknown'}`);
      } else {
        setStatus('Invalid 2FA QR code');
      }
    } catch (e) {
      setStatus('Scan cancelled or failed');
    }
  };

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
      setTimeout(() => setLocation('/'), 600);
    } catch {
      setStatus('Save failed');
    }
  };

  return (
    <div className={styles.setting}>
      {status && <div className={styles.status}>{status}</div>}
      {isMobile && (
        <button className={styles.scanBtn} onClick={handleScan}>
          Scan QR Code
        </button>
      )}
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
