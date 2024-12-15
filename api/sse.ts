import { VercelRequest, VercelResponse } from '@vercel/node';

let clients = new Set<VercelResponse>();
let sensorData = [false, false, false, false, false]; // Initial sensor state

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (
        Array.isArray(data) &&
        data.every((item) => typeof item === 'boolean')
      ) {
        sensorData = data;
        // Notify all connected clients
        clients.forEach((client) => {
          client.write(`data: ${JSON.stringify({ sensorData })}\n\n`);
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

    // Send initial data
    res.write(`data: ${JSON.stringify({ sensorData })}\n\n`);

    // Add client to Set
    clients.add(res);

    // Remove client when connection closes
    req.on('close', () => {
      clients.delete(res);
    });
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
