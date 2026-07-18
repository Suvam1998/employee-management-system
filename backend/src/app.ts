import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import organizationRoutes from './routes/organizationRoutes';
import { notFound, errorHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (no Origin header).
        if (!origin) return callback(null, true);

        let hostname: string;
        try {
          hostname = new URL(origin).hostname;
        } catch {
          return callback(new Error(`Invalid origin: ${origin}`));
        }

        // Allow any localhost / 127.0.0.1 port (dev servers drift to 3001, 3002…),
        // any configured frontend origin, and any Vercel deploy (*.vercel.app).
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        if (isLocalhost || env.clientUrls.includes(origin) || /\.vercel\.app$/.test(hostname)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve uploaded profile images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/organization', organizationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
