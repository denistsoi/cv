import { useEffect, useState } from 'react';

export default function Classroom() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentList, setStudentList] = useState<string[]>([]);
  const [inWaitingRoom, setInWaitingRoom] = useState(false); // Changed to false - no waiting room
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [sessionError, setSessionError] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // localStorage helper functions
  const getStoredSession = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('classroom-session');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  const setStoredSession = (student: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('classroom-session', JSON.stringify({
        student,
        timestamp: Date.now()
      }));
    }
  };

  const clearStoredSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('classroom-session');
    }
  };

  const validateStoredSession = async (storedSession: any) => {
    try {
      const response = await fetch('/api/classroom-sessions');
      const data = await response.json();
      const serverActiveSessions = data.activeSessions || [];

      // Check if the stored session is still valid on the server
      return serverActiveSessions.includes(storedSession.student);
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  // Generate anonymous student ID
  const generateAnonymousId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `Student-${random}-${timestamp}`;
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check for existing localStorage session
        const storedSession = getStoredSession();

        // Fetch classroom URL, active sessions, and student list
        const [urlData, sessionData, studentData] = await Promise.all([
          fetch('/api/classroom-url').then(res => res.json()),
          fetch('/api/classroom-sessions').then(res => res.json()),
          fetch('/api/student-list').then(res => res.json())
        ]);

        setUrl(urlData.url || '');
        setActiveSessions(sessionData.activeSessions || []);
        setStudentList(studentData.students || []);
        
        
        if (storedSession && storedSession.student) {
          const isValidSession = await validateStoredSession(storedSession);

          if (isValidSession) {
            // Session is still valid, restore the user's state
            setSelectedStudent(storedSession.student);
            setInWaitingRoom(false);
          } else {
            // Session is no longer valid, create new anonymous session
            const anonymousId = generateAnonymousId();
            await joinClassroomDirectly(anonymousId);
          }
        } else {
          // No stored session, create new anonymous session
          const anonymousId = generateAnonymousId();
          // We'll join after defining the function
          setSelectedStudent(anonymousId);
          setStoredSession(anonymousId);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Auto-join effect
  useEffect(() => {
    if (selectedStudent && !activeSessions.includes(selectedStudent) && !loading) {
      joinClassroomDirectly(selectedStudent);
    }
  }, [selectedStudent, loading]);

  // Periodic session validation effect
  useEffect(() => {
    if (!inWaitingRoom && selectedStudent) {
      const validateSession = async () => {
        try {
          const response = await fetch('/api/classroom-sessions');
          const data = await response.json();
          const serverActiveSessions = data.activeSessions || [];

          // If current student is no longer in server sessions, they were kicked
          if (!serverActiveSessions.includes(selectedStudent)) {
            clearStoredSession();
            setInWaitingRoom(true);
            setSelectedStudent('');
            setSessionError('Your session has been ended by the teacher. Please rejoin if needed.');
          }

          setActiveSessions(serverActiveSessions);
        } catch (error) {
          console.error('Error validating session:', error);
        }
      };

      // Check session validity every 10 seconds
      const interval = setInterval(validateSession, 10000);
      return () => clearInterval(interval);
    }
  }, [inWaitingRoom, selectedStudent]);

  const handleStudentSelect = (student: string) => {
    setSelectedStudent(student);
    setSessionError('');
  };

  const joinClassroomDirectly = async (studentId: string) => {
    try {
      const response = await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student: studentId,
          action: 'join'
        }),
      });

      const data = await response.json();

      if (data.canJoin) {
        // Store session in localStorage
        setStoredSession(studentId);
        setSelectedStudent(studentId);
        setInWaitingRoom(false);
        setActiveSessions(prev => [...prev, studentId]);
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
    }
  };

  const joinClassroom = async () => {
    const studentToJoin = selectedStudent || loginName.trim();
    if (!studentToJoin) return;

    try {
      const response = await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student: studentToJoin,
          action: 'join',
          password: loginPassword // Include password for validation if using login
        }),
      });

      const data = await response.json();

      if (data.canJoin) {
        // Store session in localStorage
        setStoredSession(studentToJoin);
        setSelectedStudent(studentToJoin);
        setInWaitingRoom(false);
        setActiveSessions(prev => [...prev, studentToJoin]);
        setLoginName('');
        setLoginPassword('');
      } else {
        setSessionError(data.error || `${studentToJoin} is already in the classroom. Please contact your teacher if you need to rejoin.`);
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
      setSessionError('Failed to join classroom. Please try again.');
    }
  };

  const logout = async () => {
    if (selectedStudent) {
      try {
        await fetch('/api/classroom-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student: selectedStudent,
            action: 'leave'
          }),
        });
        setActiveSessions(prev => prev.filter(s => s !== selectedStudent));
      } catch (error) {
        console.error('Error leaving classroom:', error);
      }
    }

    // Clear localStorage session
    clearStoredSession();
    setInWaitingRoom(true);
    setSelectedStudent('');
    setSessionError('');
  };

  const confirmLogout = () => {
    if (confirm('Are you sure you want to leave the classroom?')) {
      logout();
    }
  };



  if (loading) {
    return (
      <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (inWaitingRoom) {
    return (
      <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
        <h1>Micro:bit Classroom</h1>
        <p>Please login to join the classroom:</p>

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Enter your name"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinClassroom()}
            style={{
              width: '100%',
              padding: 10,
              fontSize: 16,
              borderRadius: 4,
              border: '1px solid #ccc',
              marginBottom: 10
            }}
          />
          <input
            type="password"
            placeholder="Enter password (optional)"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinClassroom()}
            style={{
              width: '100%',
              padding: 10,
              fontSize: 16,
              borderRadius: 4,
              border: '1px solid #ccc'
            }}
          />
        </div>

        <details style={{ marginBottom: 20, fontSize: 14, color: '#666' }}>
          <summary style={{ cursor: 'pointer', marginBottom: 10 }}>Or select from registered students</summary>
          <select
            value={selectedStudent}
            onChange={(e) => handleStudentSelect(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              fontSize: 16,
              borderRadius: 4,
              border: '1px solid #ccc'
            }}
          >
            <option value="">-- Select your name --</option>
            {studentList.map((student) => (
              <option key={student} value={student} disabled={activeSessions.includes(student)}>
                {student} {activeSessions.includes(student) ? '(Already in class)' : ''}
              </option>
            ))}
          </select>
        </details>

        {sessionError && (
          <div style={{
            marginBottom: 20,
            padding: 12,
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: 4,
            color: '#c62828'
          }}>
            {sessionError}
          </div>
        )}

        {activeSessions.length > 0 && (
          <div style={{ marginBottom: 20, fontSize: 14, color: '#666' }}>
            <strong>Currently in class:</strong> {activeSessions.join(', ')}
          </div>
        )}

        <button
          onClick={joinClassroom}
          disabled={(!selectedStudent && !loginName.trim()) || activeSessions.includes(selectedStudent)}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            backgroundColor: (selectedStudent || loginName.trim()) && !activeSessions.includes(selectedStudent) ? '#0070f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: (selectedStudent || loginName.trim()) && !activeSessions.includes(selectedStudent) ? 'pointer' : 'not-allowed'
          }}
        >
          Join Classroom
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
      <div style={{ padding: 24, border: '1px solid #ccc', borderRadius: 8, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1>Welcome to Micro:bit Classroom!</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          Session: {selectedStudent}
        </div>
      </div>


        {url ? (
          <button
            onClick={() => window.open(url, '_blank')}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              width: '100%',
              marginBottom: 16,
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0051cc';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0070f3';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Join Class Session
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
            No classroom link has been set yet. Please check back soon!
          </div>
        )}
        
        <div style={{ marginTop: 24 }}>
          <a href="/notes" target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, color: '#0070f3', textDecoration: 'underline' }}>
            📚 View Class Notes
          </a>
        </div>
      </div>
    </div>
  );
} 