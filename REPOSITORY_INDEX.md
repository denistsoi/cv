# Repository Index - CV/Micro:bit Classroom

## Overview
This is a Next.js application that serves dual purposes:
1. Personal CV/Portfolio site for Denis Tsoi
2. Micro:bit classroom management system for teaching kids

## Project Structure

```
cv/
├── data/
│   └── students.json          # List of registered students
├── pages/
│   ├── _app.tsx              # Next.js app component
│   ├── index.tsx             # Personal CV homepage
│   ├── class.tsx             # Student classroom interface
│   ├── teacher.tsx           # Teacher dashboard
│   └── api/
│       ├── class-notes-fs.ts      # File system based class notes API
│       ├── class-notes-redis.ts   # Redis based class notes API
│       ├── classroom-sessions.ts  # Session management API
│       ├── classroom-url.ts       # Classroom URL management
│       ├── student-auth.ts        # Student authentication API
│       └── student-list.ts        # Student list API
├── public/
│   ├── class-notes/          # Markdown files for class notes
│   │   ├── microbit-glossary.md
│   │   ├── microbit-notes.md
│   │   ├── microbit-resources.md
│   │   └── week-*.md         # Weekly lesson notes
│   └── [various favicon files]
├── styles/
│   ├── globals.css           # Global styles
│   └── Home.module.css       # Homepage styles
└── [config files]            # package.json, tsconfig.json, etc.

```

## Key Features

### 1. Instant Classroom Access
- **NEW**: Students join automatically without any login or name selection
- Anonymous student IDs generated automatically (format: `Student-[random]-[timestamp]`)
- No waiting room - immediate access to classroom
- Session persistence using localStorage
- Automatic session validation every 10 seconds

### 2. Classroom Management
- **Teacher Dashboard** (`/teacher`): 
  - Set classroom URLs
  - View active sessions
  - Kick students from sessions
  - See raised hands
  - Clear all sessions
  
- **Student Interface** (`/class`):
  - Login with name
  - Join virtual classroom
  - Raise/lower hand feature
  - Access class notes with progress tracking
  - Interactive checkboxes in notes

### 3. Class Notes System
- Markdown-based notes stored in `/public/class-notes/`
- Interactive features:
  - Checkbox progress tracking
  - Progress saved locally per student
  - Support for GitHub Flavored Markdown
  - Week-by-week curriculum

## API Endpoints

### `/api/student-auth` (NEW)
- **POST**: Authenticate student login
- Body: `{ student: string, password?: string }`
- Returns: `{ success: boolean, student?: string, error?: string }`

### `/api/classroom-sessions`
- **GET**: Retrieve active sessions and raised hands
- **POST**: Join/leave classroom, raise/lower hand
- Body: `{ student: string, action: 'join'|'leave'|'raise-hand'|'lower-hand', password?: string }`

### `/api/classroom-url`
- **GET**: Get current classroom URL
- **POST**: Set classroom URL (teacher only)

### `/api/student-list`
- **GET**: Get list of registered students from `data/students.json`

### `/api/class-notes-fs`
- **GET**: Retrieve all class notes from file system

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables for Redis (if using Redis storage):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

3. Run development server:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Homepage: `http://localhost:3000`
   - Student Login: `http://localhost:3000/class`
   - Teacher Dashboard: `http://localhost:3000/teacher`

## Automatic Access Flow

1. Students navigate to `/class`
2. System automatically generates an anonymous student ID
3. Student is immediately joined to the classroom
4. Full access to all classroom features
5. Session persists across page refreshes

## Security Considerations

- Sessions are validated server-side
- Duplicate session prevention
- Optional password protection
- Teacher-only endpoints protected
- Local storage for session persistence

## Future Enhancements

- Implement proper password validation
- Add student registration system
- Enhanced teacher controls
- Real-time collaboration features
- Assignment submission system
- Progress tracking dashboard