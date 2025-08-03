import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { student, password } = req.body;

    // Basic validation
    if (!student || typeof student !== 'string') {
      return res.status(400).json({ success: false, error: 'Student name is required' });
    }

    // Optional: Add password validation logic here
    // For now, we'll allow any student to join without password validation
    // You can implement your own authentication logic

    return res.status(200).json({ 
      success: true, 
      student: student.trim() 
    });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}