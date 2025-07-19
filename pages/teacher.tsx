import { useEffect, useState } from 'react';

export default function TeacherDashboard() {
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/classroom-sessions');
      const data = await response.json();
      setActiveSessions(data.activeSessions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    // Refresh every 5 seconds
    const interval = setInterval(fetchActiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const kickStudent = async (student: string) => {
    try {
      await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student,
          action: 'kick'
        }),
      });
      setActiveSessions(prev => prev.filter(s => s !== student));
    } catch (error) {
      console.error('Error kicking student:', error);
    }
  };

  const clearAllSessions = async () => {
    if (confirm('Are you sure you want to clear all active sessions?')) {
      try {
        await fetch('/api/classroom-sessions', {
          method: 'DELETE',
        });
        setActiveSessions([]);
      } catch (error) {
        console.error('Error clearing sessions:', error);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24 }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>Teacher Dashboard</h1>
      
      <div style={{ marginBottom: 20 }}>
        <h2>Active Sessions ({activeSessions.length})</h2>
        {activeSessions.length === 0 ? (
          <p style={{ color: '#666' }}>No students currently in the classroom.</p>
        ) : (
          <div>
            {activeSessions.map((student) => (
              <div key={student} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 12,
                marginBottom: 8,
                backgroundColor: '#f5f5f5',
                borderRadius: 4
              }}>
                <span>{student}</span>
                <button
                  onClick={() => kickStudent(student)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 14,
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Kick
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={clearAllSessions}
        disabled={activeSessions.length === 0}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          backgroundColor: activeSessions.length > 0 ? '#ff9800' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: activeSessions.length > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        Clear All Sessions
      </button>
    </div>
  );
}