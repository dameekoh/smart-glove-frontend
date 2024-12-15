// api/receive-data.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Use ES module export syntax
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        message: 'API is working. Please use POST method to send data.',
      });
    }

    if (req.method === 'POST') {
      const data = req.body;
      console.log('Received data:', data);

      if (!data) {
        return res.status(400).json({ error: 'No data provided' });
      }

      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'Data must be an array' });
      }

      return res.status(200).json({
        success: true,
        message: 'Data received',
        receivedData: data,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
