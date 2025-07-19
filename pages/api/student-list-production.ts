import { NextApiRequest, NextApiResponse } from 'next';

// PRODUCTION STORAGE OPTIONS
// Choose one of the following based on your infrastructure:

// =============================================================================
// OPTION 1: PostgreSQL with Prisma (Recommended for most applications)
// =============================================================================
/*
// 1. Install dependencies:
// npm install prisma @prisma/client
// npm install -D prisma

// 2. Initialize Prisma:
// npx prisma init

// 3. Add to schema.prisma:
model Classroom {
  id       Int       @id @default(autoincrement())
  students Student[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Student {
  id          Int       @id @default(autoincrement())
  name        String
  classroomId Int
  classroom   Classroom @relation(fields: [classroomId], references: [id])
  createdAt   DateTime  @default(now())
}

// 4. Set DATABASE_URL in .env:
// DATABASE_URL="postgresql://username:password@localhost:5432/classroom_db"

// 5. Run migrations:
// npx prisma migrate dev --name init
// npx prisma generate

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function loadStudentList(): Promise<string[]> {
  try {
    const classroom = await prisma.classroom.findFirst({
      include: { students: { orderBy: { name: 'asc' } } }
    });
    return classroom?.students.map(s => s.name) || DEFAULT_STUDENTS;
  } catch (error) {
    console.error('Database error:', error);
    return DEFAULT_STUDENTS;
  }
}

async function saveStudentList(students: string[]): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Get or create classroom
      let classroom = await tx.classroom.findFirst();
      if (!classroom) {
        classroom = await tx.classroom.create({ data: {} });
      }

      // Clear existing students
      await tx.student.deleteMany({
        where: { classroomId: classroom.id }
      });

      // Add new students
      if (students.length > 0) {
        await tx.student.createMany({
          data: students.map(name => ({
            name,
            classroomId: classroom.id
          }))
        });
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save student list');
  }
}
*/

// =============================================================================
// OPTION 2: Redis (Great for high-performance applications)
// =============================================================================
/*
// 1. Install Redis client:
// npm install @upstash/redis
// or for self-hosted: npm install redis

// 2. Set REDIS_URL in .env:
// REDIS_URL="redis://localhost:6379"
// or for Upstash: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

// For Upstash Redis:
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

// For self-hosted Redis:
// import { createClient } from 'redis';
// const redis = createClient({ url: process.env.REDIS_URL });

async function loadStudentList(): Promise<string[]> {
  try {
    const data = await redis.get('classroom:students');
    return data ? JSON.parse(data as string) : DEFAULT_STUDENTS;
  } catch (error) {
    console.error('Redis error:', error);
    return DEFAULT_STUDENTS;
  }
}

async function saveStudentList(students: string[]): Promise<void> {
  try {
    await redis.set('classroom:students', JSON.stringify(students));
    // Optional: Set expiration (e.g., 30 days)
    // await redis.expire('classroom:students', 30 * 24 * 60 * 60);
  } catch (error) {
    console.error('Redis error:', error);
    throw new Error('Failed to save student list');
  }
}
*/

// =============================================================================
// OPTION 3: MongoDB (Good for document-based storage)
// =============================================================================
/*
// 1. Install MongoDB driver:
// npm install mongodb

// 2. Set MONGODB_URI in .env:
// MONGODB_URI="mongodb://localhost:27017/classroom"
// or MongoDB Atlas: "mongodb+srv://username:password@cluster.mongodb.net/classroom"

import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

async function loadStudentList(): Promise<string[]> {
  try {
    const { db } = await connectToDatabase();
    const classroom = await db.collection('classroom').findOne({ _id: 'main' });
    return classroom?.students || DEFAULT_STUDENTS;
  } catch (error) {
    console.error('MongoDB error:', error);
    return DEFAULT_STUDENTS;
  }
}

async function saveStudentList(students: string[]): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('classroom').replaceOne(
      { _id: 'main' },
      { _id: 'main', students, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (error) {
    console.error('MongoDB error:', error);
    throw new Error('Failed to save student list');
  }
}
*/

// =============================================================================
// OPTION 4: File-based Storage (Simple, but not recommended for production)
// =============================================================================
import fs from 'fs/promises';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'students.json');

async function ensureDataDirectory() {
  const dataDir = path.dirname(STORAGE_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadStudentList(): Promise<string[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_STUDENTS;
  } catch (error) {
    // File doesn't exist or is corrupted, create with default list
    await saveStudentList(DEFAULT_STUDENTS);
    return DEFAULT_STUDENTS;
  }
}

async function saveStudentList(students: string[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await fs.writeFile(STORAGE_FILE, JSON.stringify(students, null, 2));
  } catch (error) {
    console.error('File storage error:', error);
    throw new Error('Failed to save student list');
  }
}

// =============================================================================
// COMMON CODE (works with any storage option above)
// =============================================================================

const DEFAULT_STUDENTS = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'Diana Prince',
  'Ethan Hunt',
  'Fiona Green',
  'George Wilson',
  'Hannah Davis',
  'Ian Thompson',
  'Julia Roberts'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        const students = await loadStudentList();
        return res.status(200).json({ 
          students,
          count: students.length 
        });
      }

      case 'POST': {
        const { students } = req.body;
        
        if (!Array.isArray(students)) {
          return res.status(400).json({ error: 'Students must be an array' });
        }

        // Validate and clean student names
        const cleanedStudents = students
          .map(name => typeof name === 'string' ? name.trim() : '')
          .filter(name => name.length > 0)
          .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

        if (cleanedStudents.length === 0) {
          return res.status(400).json({ error: 'At least one valid student name is required' });
        }

        await saveStudentList(cleanedStudents);
        
        return res.status(200).json({ 
          message: 'Student list updated successfully',
          students: cleanedStudents,
          count: cleanedStudents.length
        });
      }

      case 'PUT': {
        const { student } = req.body;
        
        if (!student || typeof student !== 'string' || student.trim().length === 0) {
          return res.status(400).json({ error: 'Valid student name is required' });
        }

        const cleanedStudent = student.trim();
        const currentStudents = await loadStudentList();
        
        if (currentStudents.includes(cleanedStudent)) {
          return res.status(409).json({ error: 'Student already exists in the list' });
        }

        const updatedStudents = [...currentStudents, cleanedStudent].sort();
        await saveStudentList(updatedStudents);
        
        return res.status(200).json({ 
          message: 'Student added successfully',
          students: updatedStudents,
          count: updatedStudents.length
        });
      }

      case 'DELETE': {
        const { student: studentToRemove } = req.body;
        
        if (studentToRemove) {
          // Remove specific student
          const currentStudents = await loadStudentList();
          const updatedStudents = currentStudents.filter(name => name !== studentToRemove);
          
          if (updatedStudents.length === currentStudents.length) {
            return res.status(404).json({ error: 'Student not found in the list' });
          }
          
          await saveStudentList(updatedStudents);
          
          return res.status(200).json({ 
            message: 'Student removed successfully',
            students: updatedStudents,
            count: updatedStudents.length
          });
        } else {
          // Clear all students
          const currentStudents = await loadStudentList();
          const removedCount = currentStudents.length;
          
          await saveStudentList([]);
          
          return res.status(200).json({ 
            message: `Cleared all students (${removedCount} removed)`,
            students: [],
            count: 0
          });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Student list API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}