import { useEffect, useState } from 'react';

export default function Classroom() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      fetch('/api/classroom-url')
        .then(res => res.json())
        .then(data => {
          setUrl(data.url || '');
          setLoading(false);
        });
    } catch (error) {
      console.error('Error fetching classroom URL:', error);
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>Join the Micro:bit Classroom</h1>
      {loading ? (
        <div>Loading...</div>
      ) : url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 20, color: '#0070f3' }}>
          Click here to join the class
        </a>
      ) : (
        <div>No classroom link has been set yet. Please check back soon!</div>
      )}
    </div>
  );
} 