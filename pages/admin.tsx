import { useState, useEffect } from 'react';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const ADMIN_PASSWORD = 'microbit';
const AUTH_KEY = 'microbit_admin_authed';

export default function Admin() {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clearing, setClearing] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(AUTH_KEY) === '1') {
        setAuthed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetch('/api/classroom-url')
        .then(res => res.json())
        .then(data => setCurrentUrl(data.url || ''));
    }
  }, [authed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/classroom-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentUrl(url);
      setMessage('URL updated!');
      setUrl('');
    } else {
      setMessage(data.error || 'Error updating URL');
    }
    setLoading(false);
  };

  const handleClear = async () => {
    setClearing(true);
    setMessage('');
    const res = await fetch('/api/classroom-url', {
      method: 'DELETE',
    });
    if (res.ok) {
      setCurrentUrl('');
      setMessage('URL cleared!');
    } else {
      setMessage('Error clearing URL');
    }
    setClearing(false);
  };

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1');
      setAuthed(true);
      setPwError('');
    } else {
      setPwError('Incorrect password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPassword('');
    setPwError('');
  };

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Admin Login</h2>
        <form onSubmit={handlePwSubmit}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button type="submit" style={{ width: '100%', padding: 8 }}>
            Login
          </button>
        </form>
        {pwError && <div style={{ color: 'red', marginTop: 8 }}>{pwError}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Admin: Set Classroom URL</h1>
        <button onClick={handleLogout} style={{ padding: '6px 12px', fontSize: 14 }}>Logout</button>
      </div>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="url"
          placeholder="Paste Micro:bit classroom URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 8 }}>
          {loading ? 'Saving...' : 'Set URL'}
        </button>
      </form>
      <button onClick={handleClear} disabled={clearing || !currentUrl} style={{ width: '100%', padding: 8, marginBottom: 16 }}>
        {clearing ? 'Clearing...' : 'Clear URL'}
      </button>
      {message && <div style={{ marginBottom: 16, color: 'green' }}>{message}</div>}
      <div>
        <strong>Current URL:</strong>
        <div>
          {currentUrl ? (
            <a href={currentUrl} target="_blank" rel="noopener noreferrer">{currentUrl}</a>
          ) : (
            <span>No URL set yet.</span>
          )}
        </div>
      </div>
    </div>
  );
} 