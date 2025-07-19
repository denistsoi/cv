import { useEffect, useState } from 'react';

const ADMIN_PASSWORD = 'microbit';
const AUTH_KEY = 'microbit_teacher_authed';

export default function TeacherDashboard() {
  // Authentication state
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');

  // Session management state
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Classroom URL state
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlMessage, setUrlMessage] = useState('');

  // Student list state
  const [studentList, setStudentList] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');
  const [bulkStudents, setBulkStudents] = useState('');
  const [studentMessage, setStudentMessage] = useState('');

  // Active tab state
  const [activeTab, setActiveTab] = useState<'sessions' | 'settings'>('sessions');

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(AUTH_KEY) === '1') {
        setAuthed(true);
      }
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (authed) {
      fetchClassroomData();
      fetchStudentList();
      fetchCurrentUrl();
      
      // Refresh sessions every 5 seconds
      const interval = setInterval(fetchClassroomData, 5000);
      return () => clearInterval(interval);
    }
  }, [authed]);

  const fetchClassroomData = async () => {
    try {
      const response = await fetch('/api/classroom-sessions');
      const data = await response.json();
      setActiveSessions(data.activeSessions || []);
      setRaisedHands(data.raisedHands || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classroom data:', error);
      setLoading(false);
    }
  };

  const fetchStudentList = async () => {
    try {
      const response = await fetch('/api/student-list');
      const data = await response.json();
      setStudentList(data.students || []);
    } catch (error) {
      console.error('Error fetching student list:', error);
    }
  };

  const fetchCurrentUrl = async () => {
    try {
      const response = await fetch('/api/classroom-url');
      const data = await response.json();
      setCurrentUrl(data.url || '');
    } catch (error) {
      console.error('Error fetching classroom URL:', error);
    }
  };

  // Authentication handlers
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

  // Session management handlers
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
      setRaisedHands(prev => prev.filter(s => s !== student));
    } catch (error) {
      console.error('Error kicking student:', error);
    }
  };

  const clearHand = async (student: string) => {
    try {
      await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student,
          action: 'clear-hand'
        }),
      });
      setRaisedHands(prev => prev.filter(s => s !== student));
    } catch (error) {
      console.error('Error clearing hand:', error);
    }
  };

  const clearAllHands = async () => {
    try {
      await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear-all-hands'
        }),
      });
      setRaisedHands([]);
    } catch (error) {
      console.error('Error clearing all hands:', error);
    }
  };

  const clearAllSessions = async () => {
    if (confirm('Are you sure you want to clear all active sessions?')) {
      try {
        await fetch('/api/classroom-sessions', {
          method: 'DELETE',
        });
        setActiveSessions([]);
        setRaisedHands([]);
      } catch (error) {
        console.error('Error clearing sessions:', error);
      }
    }
  };

  // URL management handlers
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlLoading(true);
    setUrlMessage('');
    
    try {
      const res = await fetch('/api/classroom-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setCurrentUrl(url);
        setUrlMessage('URL updated successfully!');
        setUrl('');
      } else {
        setUrlMessage(data.error || 'Error updating URL');
      }
    } catch (error) {
      setUrlMessage('Error updating URL');
    }
    
    setUrlLoading(false);
  };

  const clearUrl = async () => {
    try {
      const res = await fetch('/api/classroom-url', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setCurrentUrl('');
        setUrlMessage('URL cleared successfully!');
      } else {
        setUrlMessage('Error clearing URL');
      }
    } catch (error) {
      setUrlMessage('Error clearing URL');
    }
  };

  // Student list management handlers
  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.trim()) return;

    try {
      const res = await fetch('/api/student-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: newStudent.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStudentList(data.students);
        setNewStudent('');
        setStudentMessage('Student added successfully!');
      } else {
        setStudentMessage(data.error || 'Error adding student');
      }
    } catch (error) {
      setStudentMessage('Error adding student');
    }
  };

  const removeStudent = async (student: string) => {
    try {
      const res = await fetch('/api/student-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student }),
      });
      const data = await res.json();

      if (res.ok) {
        setStudentList(data.students);
        setStudentMessage('Student removed successfully!');
      } else {
        setStudentMessage(data.error || 'Error removing student');
      }
    } catch (error) {
      setStudentMessage('Error removing student');
    }
  };

  const updateBulkStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    const students = bulkStudents
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (students.length === 0) {
      setStudentMessage('Please enter at least one student name');
      return;
    }

    try {
      const res = await fetch('/api/student-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });
      const data = await res.json();

      if (res.ok) {
        setStudentList(data.students);
        setBulkStudents('');
        setStudentMessage(`Student list updated! ${data.count} students total.`);
      } else {
        setStudentMessage(data.error || 'Error updating student list');
      }
    } catch (error) {
      setStudentMessage('Error updating student list');
    }
  };

  // Authentication screen
  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Teacher Login</h2>
        <form onSubmit={handlePwSubmit}>
          <input
            type="password"
            placeholder="Enter teacher password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 12, marginBottom: 16, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ width: '100%', padding: 12, fontSize: 16, backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Login
          </button>
        </form>
        {pwError && <div style={{ color: '#f44336', marginTop: 12, textAlign: 'center' }}>{pwError}</div>}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24 }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Teacher Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', fontSize: 14, backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: 24, borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            backgroundColor: activeTab === 'sessions' ? '#0070f3' : 'transparent',
            color: activeTab === 'sessions' ? 'white' : '#0070f3',
            border: 'none',
            borderBottom: activeTab === 'sessions' ? '2px solid #0070f3' : '2px solid transparent',
            cursor: 'pointer',
            marginRight: 8
          }}
        >
          Live Sessions
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            backgroundColor: activeTab === 'settings' ? '#0070f3' : 'transparent',
            color: activeTab === 'settings' ? 'white' : '#0070f3',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #0070f3' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Settings
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div>
          {/* Raised Hands Section */}
          {raisedHands.length > 0 && (
            <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#e65100' }}>🖐️ Raised Hands ({raisedHands.length})</h3>
                <button
                  onClick={clearAllHands}
                  style={{
                    padding: '6px 12px',
                    fontSize: 14,
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Clear All Hands
                </button>
              </div>
              <div>
                {raisedHands.map((student) => (
                  <div key={student} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 8,
                    marginBottom: 4,
                    backgroundColor: 'white',
                    borderRadius: 4
                  }}>
                    <span style={{ fontWeight: 'bold' }}>✋ {student}</span>
                    <button
                      onClick={() => clearHand(student)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Sessions Section */}
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h3>Active Sessions ({activeSessions.length})</h3>
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
                    <span>
                      {student}
                      {raisedHands.includes(student) && <span style={{ marginLeft: 8, color: '#ff9800' }}>✋</span>}
                    </span>
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
                cursor: activeSessions.length > 0 ? 'pointer' : 'not-allowed',
                marginTop: 16
              }}
            >
              Clear All Sessions
            </button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          {/* Classroom URL Section */}
          <div style={{ marginBottom: 32, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h3>Classroom URL</h3>
            <form onSubmit={handleUrlSubmit} style={{ marginBottom: 16 }}>
              <input
                type="url"
                placeholder="Paste Micro:bit classroom URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                style={{ width: '100%', padding: 12, marginBottom: 12, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={urlLoading} style={{ flex: 1, padding: 12, fontSize: 16, backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  {urlLoading ? 'Saving...' : 'Set URL'}
                </button>
                <button type="button" onClick={clearUrl} disabled={!currentUrl} style={{ padding: '12px 24px', fontSize: 16, backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: currentUrl ? 'pointer' : 'not-allowed' }}>
                  Clear
                </button>
              </div>
            </form>
            
            {urlMessage && <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: 4, color: '#2e7d32' }}>{urlMessage}</div>}
            
            <div>
              <strong>Current URL:</strong>
              <div style={{ marginTop: 8 }}>
                {currentUrl ? (
                  <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', wordBreak: 'break-all' }}>{currentUrl}</a>
                ) : (
                  <span style={{ color: '#666' }}>No URL set yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Student List Section */}
          <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h3>Student List ({studentList.length})</h3>
            
            {/* Add Single Student */}
            <form onSubmit={addStudent} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Add student name"
                  value={newStudent}
                  onChange={e => setNewStudent(e.target.value)}
                  style={{ flex: 1, padding: 12, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '12px 24px', fontSize: 16, backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Add
                </button>
              </div>
            </form>

            {/* Bulk Update Students */}
            <form onSubmit={updateBulkStudents} style={{ marginBottom: 16 }}>
              <textarea
                placeholder="Enter student names (one per line) to replace the entire list"
                value={bulkStudents}
                onChange={e => setBulkStudents(e.target.value)}
                rows={6}
                style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8, resize: 'vertical' }}
              />
              <button type="submit" style={{ padding: '12px 24px', fontSize: 16, backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Update Entire List
              </button>
            </form>

            {studentMessage && <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: 4, color: '#2e7d32' }}>{studentMessage}</div>}

            {/* Current Student List */}
            <div>
              <h4>Current Students:</h4>
              {studentList.length === 0 ? (
                <p style={{ color: '#666' }}>No students in the list.</p>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
                  {studentList.map((student, index) => (
                    <div key={student} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 8,
                      marginBottom: 4,
                      backgroundColor: '#f9f9f9',
                      borderRadius: 4
                    }}>
                      <span>{index + 1}. {student}</span>
                      <button
                        onClick={() => removeStudent(student)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}