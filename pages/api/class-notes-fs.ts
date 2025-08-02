import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
      const notesDir = path.join(process.cwd(), 'public', 'class-notes');
      
      // Ensure directory exists
      if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir, { recursive: true });
      }
      
      const files = fs.readdirSync(notesDir).filter(file => file.endsWith('.md'));
      const notes: ClassNote[] = [];
      
      for (const file of files) {
        const filePath = path.join(notesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        
        const stats = fs.statSync(filePath);
        const id = path.basename(file, '.md');
        
        notes.push({
          id,
          title: data.title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          content: content.trim(),
          createdAt: data.createdAt || stats.birthtime.toISOString(),
          updatedAt: data.updatedAt || stats.mtime.toISOString()
        });
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
      
      const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const timestamp = new Date().toISOString();
      
      const frontmatter = `---
title: ${title}
createdAt: ${timestamp}
updatedAt: ${timestamp}
---

`;
      
      const fullContent = frontmatter + content;
      const filePath = path.join(process.cwd(), 'public', 'class-notes', `${id}.md`);
      
      fs.writeFileSync(filePath, fullContent);
      
      const note: ClassNote = {
        id,
        title,
        content,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
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
      
      const filePath = path.join(process.cwd(), 'public', 'class-notes', `${id}.md`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);
      
      const updatedTimestamp = new Date().toISOString();
      const frontmatter = `---
title: ${title}
createdAt: ${data.createdAt || updatedTimestamp}
updatedAt: ${updatedTimestamp}
---

`;
      
      const fullContent = frontmatter + content;
      fs.writeFileSync(filePath, fullContent);
      
      const updatedNote: ClassNote = {
        id,
        title,
        content,
        createdAt: data.createdAt || updatedTimestamp,
        updatedAt: updatedTimestamp
      };
      
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
      
      const filePath = path.join(process.cwd(), 'public', 'class-notes', `${id}.md`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
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