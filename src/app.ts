import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppConfig } from './config/app.config';
import { errorHandler, requestLogger, cors } from './middleware';

// Routes
import apiRouter from './routes/api';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security & Performance
    this.app.use(
      helmet({
        contentSecurityPolicy: AppConfig.server.env === 'production',
      })
    );
    this.app.use(compression());

    // CORS
    this.app.use(cors);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Trust proxy (for rate limiting, IP detection)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API Routes
    this.app.use('/api/v1', apiRouter);

    // Fallback route
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public listen(): void {
    const { port, host } = AppConfig.server;

    this.app.listen(port, host, () => {
      console.log(`
🚀 Server is running!
📍 Environment: ${AppConfig.server.env}
🌐 URL: http://${host}:${port}
📊 Health: http://${host}:${port}/health
📚 API: http://${host}:${port}/api/v1
      `);
    });
  }
}

export default App;
