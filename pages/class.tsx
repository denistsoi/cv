import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Classroom() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentList, setStudentList] = useState<string[]>([]);
  const [inWaitingRoom, setInWaitingRoom] = useState(true);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [sessionError, setSessionError] = useState('');
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [classNotes, setClassNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [noteProgress, setNoteProgress] = useState<Record<string, boolean>>({});

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
        setRaisedHands(sessionData.raisedHands || []);
        setStudentList(studentData.students || []);
        
        // Fetch class notes
        const notesResponse = await fetch('/api/class-notes');
        const notesData = await notesResponse.json();
        setClassNotes(notesData.notes || []);
        if (storedSession && storedSession.student) {
          const isValidSession = await validateStoredSession(storedSession);

          if (isValidSession) {
            // Session is still valid, restore the user's state
            setSelectedStudent(storedSession.student);
            setInWaitingRoom(false);
            // Check if hand is raised
            setHandRaised(sessionData.raisedHands?.includes(storedSession.student) || false);
          } else {
            // Session is no longer valid, clear localStorage
            clearStoredSession();
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Periodic session validation effect
  useEffect(() => {
    if (!inWaitingRoom && selectedStudent) {
      const validateSession = async () => {
        try {
          const response = await fetch('/api/classroom-sessions');
          const data = await response.json();
          const serverActiveSessions = data.activeSessions || [];
          const serverRaisedHands = data.raisedHands || [];

          // If current student is no longer in server sessions, they were kicked
          if (!serverActiveSessions.includes(selectedStudent)) {
            clearStoredSession();
            setInWaitingRoom(true);
            setSelectedStudent('');
            setSessionError('Your session has been ended by the teacher. Please rejoin if needed.');
          }

          setActiveSessions(serverActiveSessions);
          setRaisedHands(serverRaisedHands);
          setHandRaised(serverRaisedHands.includes(selectedStudent));
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

  const joinClassroom = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student: selectedStudent,
          action: 'join'
        }),
      });

      const data = await response.json();

      if (data.canJoin) {
        // Store session in localStorage
        setStoredSession(selectedStudent);
        setInWaitingRoom(false);
        setActiveSessions(prev => [...prev, selectedStudent]);
        setHandRaised(false); // Reset hand state when joining
      } else {
        setSessionError(`${selectedStudent} is already in the classroom. Please contact your teacher if you need to rejoin.`);
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

  const toggleRaiseHand = async () => {
    if (!selectedStudent) return;

    try {
      const action = handRaised ? 'lower-hand' : 'raise-hand';
      const response = await fetch('/api/classroom-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student: selectedStudent,
          action: action
        }),
      });

      if (response.ok) {
        setHandRaised(!handRaised);
        if (handRaised) {
          setRaisedHands((prev: string[]) => prev.filter((s: string) => s !== selectedStudent));
        } else {
          setRaisedHands((prev: string[]) => [...prev, selectedStudent]);
        }
      }
    } catch (error) {
      console.error('Error toggling hand:', error);
    }
  };

  const loadNoteProgress = (noteId: string) => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(`note-progress-${noteId}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setNoteProgress(parsed);
      } catch (error) {
        console.error('Error parsing saved progress:', error);
        setNoteProgress({});
      }
    } else {
      setNoteProgress({});
    }
  };

  const selectNote = (note: any) => {
    setSelectedNote(note);
    setNoteProgress({}); // Clear previous progress
    loadNoteProgress(note.id); // Always load progress, even without student selected
  };

  const updateCheckbox = (checkboxId: string, checked: boolean) => {
    if (!selectedNote) {
      console.log('Cannot update checkbox - missing note');
      return;
    }

    console.log('Updating checkbox:', { checkboxId, checked, currentProgress: noteProgress });
    
    // Update local state immediately
    const updatedProgress = { ...noteProgress, [checkboxId]: checked };
    console.log('Updated progress:', updatedProgress);
    setNoteProgress(updatedProgress);

    // Save to localStorage
    try {
      localStorage.setItem(`note-progress-${selectedNote.id}`, JSON.stringify(updatedProgress));
      console.log('Saved to localStorage');
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
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
        <h1>Waiting Room</h1>
        <p>Please select your name from the list below to join the Micro:bit Classroom:</p>

        <div style={{ marginBottom: 20 }}>
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
        </div>

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
          disabled={!selectedStudent || activeSessions.includes(selectedStudent)}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            backgroundColor: selectedStudent && !activeSessions.includes(selectedStudent) ? '#0070f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: selectedStudent && !activeSessions.includes(selectedStudent) ? 'pointer' : 'not-allowed'
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
          <h1>Welcome, {selectedStudent}!</h1>
        <button
          onClick={confirmLogout}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <button
          onClick={toggleRaiseHand}
          style={{
            padding: '16px 32px',
            fontSize: 18,
            backgroundColor: handRaised ? '#ff9800' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 auto'
          }}
        >
          <span style={{ fontSize: 24 }}>✋</span>
          {handRaised ? 'Lower Hand' : 'Raise Hand'}
        </button>

        {handRaised && (
          <div style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: '#fff3e0',
            border: '1px solid #ff9800',
            borderRadius: 4,
            fontSize: 14,
            color: '#e65100'
          }}>
            Your hand is raised! The teacher can see this.
          </div>
        )}
      </div>

        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 20, color: '#0070f3' }}>
            Click here to join the class
          </a>
        ) : (
          <div>No classroom link has been set yet. Please check back soon!</div>
        )}
      </div>

      {/* Class Notes Section */}
      {classNotes.length > 0 && (
        <div style={{ padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
          <h2>Class Notes</h2>
          
          {!selectedNote ? (
            <div>
              <p>Select a note to view:</p>
              {classNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #eee',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                    e.currentTarget.style.borderColor = '#2196f3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                    e.currentTarget.style.borderColor = '#eee';
                  }}
                >
                  <h4 style={{ margin: '0 0 4px 0' }}>{note.title}</h4>
                  <small style={{ color: '#666' }}>
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setSelectedNote(null)}
                style={{
                  padding: '8px 16px',
                  marginBottom: 16,
                  fontSize: 14,
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                ← Back to Notes
              </button>
              
              <h3>{selectedNote.title}</h3>
              
              <div style={{ 
                padding: 24,
                backgroundColor: '#f9f9f9',
                borderRadius: 8,
                marginTop: 16,
                maxHeight: '70vh',
                overflowY: 'auto'
              }}>
                {(() => {
                  let checkboxCounter = 0;
                  
                  // Custom checkbox component
                  const CheckboxComponent = ({ checkboxId }: { checkboxId: string }) => {
                    return (
                      <input
                        type="checkbox"
                        checked={noteProgress[checkboxId] || false}
                        onChange={(e) => updateCheckbox(checkboxId, e.target.checked)}
                        style={{ marginRight: 8, cursor: 'pointer' }}
                      />
                    );
                  };
                  
                  return (
                    <ReactMarkdown
                      key={selectedNote.id} // Force re-render when note changes
                      remarkPlugins={[remarkGfm]}
                      components={{
                        input: ({ node, checked, ...props }) => {
                          if (props.type === 'checkbox') {
                            // Use a counter-based ID for stable checkbox identification
                            const id = `checkbox-${checkboxCounter++}`;
                            return <CheckboxComponent checkboxId={id} />;
                          }
                          return <input {...props} />;
                        },
                    li: ({ children, ...props }) => (
                      <li style={{ marginBottom: 8 }} {...props}>
                        {children}
                      </li>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul style={{ marginLeft: 20 }} {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol style={{ marginLeft: 20 }} {...props}>
                        {children}
                      </ol>
                    ),
                    h1: ({ children, ...props }) => (
                      <h1 style={{ fontSize: 24, marginBottom: 16 }} {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 style={{ fontSize: 20, marginBottom: 12 }} {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 style={{ fontSize: 18, marginBottom: 8 }} {...props}>
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => (
                      <p style={{ marginBottom: 12, lineHeight: 1.6 }} {...props}>
                        {children}
                      </p>
                    ),
                  }}
                >
                  {selectedNote.content}
                </ReactMarkdown>
                  );
                })()}
              </div>
              
              <div style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#e8f5e9',
                borderRadius: 4,
                fontSize: 14,
                color: '#2e7d32'
              }}>
                ✓ Your progress is saved locally in your browser
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 