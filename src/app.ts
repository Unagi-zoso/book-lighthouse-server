import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppConfig } from './config/app.config';
import { errorHandler, requestLogger, cors } from './middleware';
import { loggingService } from './services/loggingService';

// Routes
import apiRouter from './routes/api';
import apiRouterV2 from './routes/apiV2';
import certbotRouter from './routes/certbot';

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
    this.app.use('/api/v2', apiRouterV2);
    this.app.use('', certbotRouter);

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

    this.app.listen(port, host, async () => {
      const message = `Server started successfully on ${host}:${port}`;

      // DB에 서버 시작 로그 저장
      await loggingService.logSimple(
        'INFO',
        'SERVER_START',
        message,
        {
          environment: AppConfig.server.env,
          host,
          port,
          node_env: process.env.NODE_ENV,
          pid: process.pid
        }
      );
    });
  }
}

export default App;
