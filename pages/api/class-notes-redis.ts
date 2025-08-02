import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const NOTES_KEY = 'classnotes:list';
const NOTE_PREFIX = 'classnote:';

interface ClassNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const noteIds = await redis.smembers(NOTES_KEY) || [];
      const notes: ClassNote[] = [];
      
      for (const id of noteIds) {
        const note = await redis.get<ClassNote>(`${NOTE_PREFIX}${id}`);
        if (note) {
          notes.push(note);
        }
      }
      
      notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      res.status(200).json({ notes });
    } catch (error) {
      console.error('Error fetching class notes:', error);
      res.status(500).json({ error: 'Failed to fetch class notes' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }
      
      const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const note: ClassNote = {
        id,
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await redis.set(`${NOTE_PREFIX}${id}`, note);
      await redis.sadd(NOTES_KEY, id);
      
      res.status(201).json({ note });
    } catch (error) {
      console.error('Error creating class note:', error);
      res.status(500).json({ error: 'Failed to create class note' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, title, content } = req.body;
      
      if (!id || !title || !content) {
        return res.status(400).json({ error: 'ID, title and content are required' });
      }
      
      const existingNote = await redis.get<ClassNote>(`${NOTE_PREFIX}${id}`);
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      const updatedNote: ClassNote = {
        ...existingNote,
        title,
        content,
        updatedAt: new Date().toISOString()
      };
      
      await redis.set(`${NOTE_PREFIX}${id}`, updatedNote);
      
      res.status(200).json({ note: updatedNote });
    } catch (error) {
      console.error('Error updating class note:', error);
      res.status(500).json({ error: 'Failed to update class note' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      
      await redis.del(`${NOTE_PREFIX}${id}`);
      await redis.srem(NOTES_KEY, id);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting class note:', error);
      res.status(500).json({ error: 'Failed to delete class note' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}