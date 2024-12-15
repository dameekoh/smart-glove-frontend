import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (
        Array.isArray(data) &&
        data.every((item) => typeof item === 'boolean')
      ) {
        return res.status(200).json({
          success: true,
          message: 'Data received',
          sensorData: data,
          timestamp: new Date(),
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid data format',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: 'Method not allowed' });
}
