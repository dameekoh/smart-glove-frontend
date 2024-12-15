import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'POST') {
    const data = req.body;

    if (
      Array.isArray(data) &&
      data.every((item) => typeof item === 'boolean')
    ) {
      console.log('Received boolean array:', data);
      const trueCount = data.filter(Boolean).length;

      res.status(200).json({
        success: true,
        message: 'Data received successfully!',
        trueCount: trueCount,
        receivedData: data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected an array of booleans.',
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
