// api/swagger.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import swaggerUi from 'swagger-ui-express';
import { createSwaggerSpec } from '../utils/swagger';

const swaggerSpec = createSwaggerSpec();

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (req.url === '/api/swagger.json') {
      res.json(swaggerSpec);
      return;
    }
    res.send(swaggerUi.generateHTML(swaggerSpec));
  }
}
