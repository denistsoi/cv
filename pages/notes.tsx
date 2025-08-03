import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Notes() {
  const [classNotes, setClassNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [noteProgress, setNoteProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notesResponse = await fetch('/api/class-notes-fs');
        const notesData = await notesResponse.json();
        setClassNotes(notesData.notes || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notes:', error);
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const loadNoteProgress = (noteId: string) => {
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
    setNoteProgress({});
    loadNoteProgress(note.id);
  };

  const updateCheckbox = (checkboxId: string, checked: boolean) => {
    if (!selectedNote) {
      console.log('Cannot update checkbox - missing note');
      return;
    }

    console.log('Updating checkbox:', { checkboxId, checked, currentProgress: noteProgress });
    
    const updatedProgress = { ...noteProgress, [checkboxId]: checked };
    console.log('Updated progress:', updatedProgress);
    setNoteProgress(updatedProgress);

    try {
      localStorage.setItem(`note-progress-${selectedNote.id}`, JSON.stringify(updatedProgress));
      console.log('Saved to localStorage');
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
        <div>Loading notes...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
      <div style={{ padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
        <h1>Class Notes</h1>
        
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
                    key={selectedNote.id}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      input: ({ node, checked, ...props }) => {
                        if (props.type === 'checkbox') {
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
                      a: ({ children, href, ...props }) => (
                        <a 
                          href={href} 
                          style={{ 
                            color: '#0070f3', 
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px'
                          }} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
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
    </div>
  );
}