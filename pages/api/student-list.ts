import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

// File-based storage for production
const STORAGE_FILE = path.join(process.cwd(), 'data', 'students.json');

const DEFAULT_STUDENTS: string[] = [];

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
    // File doesn't exist, create with default list
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