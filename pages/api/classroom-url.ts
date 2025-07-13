import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const KEY = 'current_week_url';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch the current URL from Redis
    console.log('Fetching URL from Redis');
    const url = await redis.get<string>(KEY);
    res.status(200).json({ url });
  } else if (req.method === 'POST') {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    await redis.set(KEY, url);
    res.status(200).json({ url });
  } else if (req.method === 'DELETE') {
    await redis.del(KEY);
    res.status(200).json({ message: 'URL cleared' });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 