// api/sse.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

let clients = new Set<VercelResponse>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (
        Array.isArray(data) &&
        data.every((item) => typeof item === 'boolean')
      ) {
        // Store data in KV storage
        await kv.set('sensorData', data);

        // Notify all connected clients
        clients.forEach((client) => {
          client.write(`data: ${JSON.stringify({ sensorData: data })}\n\n`);
        });

        return res.status(200).json({ success: true, message: 'Data updated' });
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid data format' });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      // Get data from KV storage
      const sensorData = (await kv.get('sensorData')) || [
        false,
        false,
        false,
        false,
        false,
      ];

      // Send initial data
      res.write(`data: ${JSON.stringify({ sensorData })}\n\n`);

      // Add client to Set
      clients.add(res);

      // Remove client when connection closes
      req.on('close', () => {
        clients.delete(res);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).end();
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
