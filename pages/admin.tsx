import { useState, useEffect } from 'react';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const KEY = 'current_week_url';

export default function Admin() {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch('/api/classroom-url')
      .then(res => res.json())
      .then(data => setCurrentUrl(data.url || ''));
  }, []);

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

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>Admin: Set Classroom URL</h1>
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