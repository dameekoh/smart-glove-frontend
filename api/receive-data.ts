import { VercelRequest, VercelResponse } from '@vercel/node';

// Store the latest sensor data
let latestSensorData: boolean[] | null = null;

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
        // Store the latest data
        latestSensorData = data;

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

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      sensorData: latestSensorData || [false, false, false, false, false],
      timestamp: new Date(),
    });
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}
