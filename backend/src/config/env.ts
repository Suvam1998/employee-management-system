import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ems',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  // Comma-separated list of allowed frontend origins (e.g. prod + preview + localhost)
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  seedOnStart: process.env.SEED_ON_START === 'true',
  seed: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@ems.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
  },
};
