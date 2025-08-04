import { config } from 'dotenv';

// Load environment variables
config();

export const AppConfig = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  },

  // Database Configuration (for future use)
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // External APIs
  externalApis: {
    jsonPlaceholder: process.env.JSON_PLACEHOLDER_URL || 'https://jsonplaceholder.typicode.com',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'dev',
  }
} as const;

export type AppConfigType = typeof AppConfig;
