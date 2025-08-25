import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import https from 'https';
import http from 'http';
import { AppConfig } from './config/app.config';
import { errorHandler, requestLogger, cors } from './middleware';
import { httpsRedirect, setHSTS, setSecurityHeaders, getSSLConfig } from './middleware/httpsMiddleware';
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
    // HTTPS 관련 미들웨어 (가장 먼저 적용)
    this.app.use(httpsRedirect);
    this.app.use(setHSTS);
    this.app.use(setSecurityHeaders);

    // Security & Performance
    this.app.use(
      helmet({
        contentSecurityPolicy: AppConfig.server.env === 'production',
        // HSTS는 별도로 처리하므로 helmet에서 비활성화
        hsts: false,
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
    const { httpsPort, port, host } = AppConfig.server;

    try {
      // SSL 설정 시도
      const sslConfig = getSSLConfig();

      if (sslConfig && AppConfig.server.env === 'production') {
        // HTTPS 서버 생성 (프로덕션)
        const httpsServer = https.createServer(sslConfig, this.app);
        
        httpsServer.listen(port, host, async () => {
          const message = `HTTPS Server started successfully on ${host}:${httpsPort}`;
          console.log(message);
          
          await loggingService.logSimple(
            'INFO',
            'HTTPS_SERVER_START',
            message,
            {
              environment: AppConfig.server.env,
              host,
              port: httpsPort,
              protocol: 'https',
              node_env: process.env.NODE_ENV,
              pid: process.pid
            }
          );
        });

        // HTTP 서버도 생성 (리다이렉션용)
        const httpServer = http.createServer(this.app);
        
        httpServer.listen(port, host, async () => {
          const message = `HTTP Server started successfully on ${host}:${port} (redirecting to HTTPS)`;
          console.log(message);
          
          await loggingService.logSimple(
            'INFO',
            'HTTP_REDIRECT_SERVER_START',
            message,
            {
              environment: AppConfig.server.env,
              host,
              port: port,
              protocol: 'http',
              purpose: 'redirect_to_https',
              node_env: process.env.NODE_ENV,
              pid: process.pid
            }
          );
        });

      } else {
        // HTTP 서버만 생성 (개발환경 또는 SSL 설정 없음)
        this.app.listen(port, host, async () => {
          const message = `HTTP Server started successfully on ${host}:${port}`;
          console.log(message);
          
          await loggingService.logSimple(
            'INFO',
            'HTTP_SERVER_START',
            message,
            {
              environment: AppConfig.server.env,
              host,
              port,
              protocol: 'http',
              node_env: process.env.NODE_ENV,
              pid: process.pid
            }
          );
        });
      }

    } catch (error) {
      console.error('Failed to configure SSL, falling back to HTTP:', error);
      
      // SSL 설정 실패 시 HTTP로 폴백
      this.app.listen(port, host, async () => {
        const message = `HTTP Server started successfully on ${host}:${port} (SSL configuration failed)`;
        console.log(message);
        
        await loggingService.logSimple(
          'WARN',
          'HTTP_FALLBACK_SERVER_START',
          message,
          {
            environment: AppConfig.server.env,
            host,
            port,
            protocol: 'http',
            reason: 'ssl_config_failed',
            error: error instanceof Error ? error.message : String(error),
            node_env: process.env.NODE_ENV,
            pid: process.pid
          }
        );
      });
    }
  }
}

export default App;
