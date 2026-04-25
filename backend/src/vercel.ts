import { NestFactory } from "@nestjs/core";
import { ValidationPipe, HttpException } from "@nestjs/common";
import { AppModule } from "./app.module";
import { Rfc7807ExceptionFilter } from "./shared/filters/rfc7807.filter";
import { HttpLogInterceptor } from "./shared/logger/http-log.interceptor";
import { LoggerService } from "./shared/logger/logger.service";
import { DecimalSerializationInterceptor } from "./shared/interceptors/decimal.interceptor";
import helmet from "helmet";

let cachedApp: any;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, {
      rawBody: true,
    });

    const loggerService = app.get(LoggerService);
    
    app.setGlobalPrefix("v1");
    app.useGlobalInterceptors(new HttpLogInterceptor(loggerService));
    app.useGlobalInterceptors(new DecimalSerializationInterceptor());
    
    app.use((req: any, res: any, next: any) => {
      // Health Check
      if (req.url === "/" || req.url === "/v1/health" || req.url === "/api/health") {
        return res.status(200).json({
          status: "ok",
          service: "zenvix-backend-serverless",
          mode: process.env.PERSISTENCE_MODE || "production",
          timestamp: new Date().toISOString(),
        });
      }

      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "*");
      res.header("Access-Control-Allow-Credentials", "true");

      if (req.method === "OPTIONS") {
        return res.status(200).send();
      }

      next();
    });

    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
      }),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalFilters(new Rfc7807ExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        exceptionFactory: (errors) => {
          return new HttpException({
            message: "Validation failed",
            errors: errors.map((err) => ({
              property: err.property,
              constraints: err.constraints,
            })),
          }, 400);
        },
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }

  return cachedApp(req, res);
}
