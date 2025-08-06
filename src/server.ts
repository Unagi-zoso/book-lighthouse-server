#!/usr/bin/env node

import App from './app';
import { AppConfig } from './config/app.config';
import { loggingService } from './services/loggingService';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await loggingService.logSimple('INFO', 'SERVER_SHUTDOWN', 'SIGTERM received. Shutting down gracefully', { signal: 'SIGTERM' });
  process.exit(0);
});

process.on('SIGINT', async () => {
  await loggingService.logSimple('INFO', 'SERVER_SHUTDOWN', 'SIGINT received. Shutting down gracefully', { signal: 'SIGINT' });
  process.exit(0);
});

// Start the application
const startServer = async (): Promise<void> => {
  try {
    await loggingService.logSimple('INFO', 'SERVER_INIT', `Starting application in ${AppConfig.server.env} mode`, { 
      environment: AppConfig.server.env,
      node_env: process.env.NODE_ENV 
    });

    const app = new App();
    app.listen();
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
