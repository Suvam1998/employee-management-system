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
        // Allow non-browser clients (no Origin) and any configured frontend origin.
        // Vercel preview URLs (*.vercel.app) are allowed so preview deploys work too.
        if (!origin || env.clientUrls.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
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
