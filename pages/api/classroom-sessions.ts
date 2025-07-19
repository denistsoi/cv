import { NextApiRequest, NextApiResponse } from 'next';

// Types for better type safety
interface StudentSession {
  name: string;
  joinedAt: number;
  lastActivity: number;
}

interface ClassroomState {
  activeSessions: Map<string, StudentSession>;
  raisedHands: Set<string>;
  sessionStartTime: number;
}

// Enhanced in-memory storage
// In production, use Redis or database with proper persistence
const classroom: ClassroomState = {
  activeSessions: new Map(),
  raisedHands: new Set(),
  sessionStartTime: Date.now()
};

// Utility functions
const validateStudent = (student: string): boolean => {
  return typeof student === 'string' && student.trim().length > 0;
};

const updateLastActivity = (student: string): void => {
  const session = classroom.activeSessions.get(student);
  if (session) {
    session.lastActivity = Date.now();
  }
};

const getClassroomStats = () => ({
  activeSessions: Array.from(classroom.activeSessions.keys()),
  raisedHands: Array.from(classroom.raisedHands),
  sessionDetails: Object.fromEntries(classroom.activeSessions),
  stats: {
    totalStudents: classroom.activeSessions.size,
    handsRaised: classroom.raisedHands.size,
    sessionStartTime: classroom.sessionStartTime,
    uptime: Date.now() - classroom.sessionStartTime
  }
});

// Action handlers
const handleJoin = (student: string) => {
  if (!validateStudent(student)) {
    return { status: 400, data: { error: 'Invalid student name', canJoin: false } };
  }

  if (classroom.activeSessions.has(student)) {
    return { status: 409, data: { error: 'Student already in classroom', canJoin: false } };
  }

  const now = Date.now();
  classroom.activeSessions.set(student, {
    name: student,
    joinedAt: now,
    lastActivity: now
  });

  return { 
    status: 200, 
    data: { 
      message: 'Student joined successfully', 
      canJoin: true,
      joinedAt: now
    } 
  };
};

const handleLeave = (student: string) => {
  if (!validateStudent(student)) {
    return { status: 400, data: { error: 'Invalid student name' } };
  }

  classroom.activeSessions.delete(student);
  classroom.raisedHands.delete(student);
  
  return { status: 200, data: { message: 'Student left successfully' } };
};

const handleKick = (student: string) => {
  if (!validateStudent(student)) {
    return { status: 400, data: { error: 'Invalid student name' } };
  }

  const wasActive = classroom.activeSessions.has(student);
  classroom.activeSessions.delete(student);
  classroom.raisedHands.delete(student);
  
  return { 
    status: 200, 
    data: { 
      message: wasActive ? 'Student kicked successfully' : 'Student was not in session',
      wasActive
    } 
  };
};

const handleRaiseHand = (student: string) => {
  if (!validateStudent(student)) {
    return { status: 400, data: { error: 'Invalid student name' } };
  }

  if (!classroom.activeSessions.has(student)) {
    return { status: 400, data: { error: 'Student not in active session' } };
  }

  updateLastActivity(student);
  classroom.raisedHands.add(student);
  
  return { status: 200, data: { message: 'Hand raised successfully' } };
};

const handleLowerHand = (student: string) => {
  if (!validateStudent(student)) {
    return { status: 400, data: { error: 'Invalid student name' } };
  }

  updateLastActivity(student);
  classroom.raisedHands.delete(student);
  
  return { status: 200, data: { message: 'Hand lowered successfully' } };
};

const handleClearHand = (student: string) => {
  if (!validateStudent(student)) {
    return { status: 400, data: { error: 'Invalid student name' } };
  }

  classroom.raisedHands.delete(student);
  
  return { status: 200, data: { message: 'Hand cleared successfully' } };
};

const handleClearAllHands = () => {
  const count = classroom.raisedHands.size;
  classroom.raisedHands.clear();
  
  return { status: 200, data: { message: `Cleared ${count} raised hands` } };
};

const handleReset = () => {
  const sessionCount = classroom.activeSessions.size;
  const handCount = classroom.raisedHands.size;
  
  classroom.activeSessions.clear();
  classroom.raisedHands.clear();
  classroom.sessionStartTime = Date.now();
  
  return { 
    status: 200, 
    data: { 
      message: 'Classroom reset successfully',
      cleared: { sessions: sessionCount, hands: handCount }
    } 
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        const stats = getClassroomStats();
        return res.status(200).json(stats);
      }

      case 'POST': {
        const { student, action } = req.body;
        
        if (!action) {
          return res.status(400).json({ error: 'Action is required' });
        }

        let result;
        switch (action) {
          case 'join':
            result = handleJoin(student);
            break;
          case 'leave':
            result = handleLeave(student);
            break;
          case 'kick':
            result = handleKick(student);
            break;
          case 'raise-hand':
            result = handleRaiseHand(student);
            break;
          case 'lower-hand':
            result = handleLowerHand(student);
            break;
          case 'clear-hand':
            result = handleClearHand(student);
            break;
          case 'clear-all-hands':
            result = handleClearAllHands();
            break;
          default:
            return res.status(400).json({ error: `Invalid action: ${action}` });
        }

        return res.status(result.status).json(result.data);
      }

      case 'DELETE': {
        const result = handleReset();
        return res.status(result.status).json(result.data);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Classroom API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}