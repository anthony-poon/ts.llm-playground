import express, { Express } from 'express';
import path from 'path';

import { HttpEnv } from '@env';
import loggerFactory from '@core/logger';
import configRoutes from './route';
import './type';
import loggerMiddleware from "./middleware/logger";
import telegramClient from "@client/telegram";

const logger = loggerFactory.create('app');

class ExpressHttp {
  private app: Express;
  constructor(private readonly env: HttpEnv) {
    this.app = express();
  }

  public initialize = async () => {
    logger.info('Starting HTTP server');
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(loggerMiddleware)
    await this.boostrap();
    configRoutes(this.app);
    logger.info('Server start');
  }

  public listen() {
    if (!this.app) {
      throw new Error('Services have not been started yet');
    }
    logger.info(`Listening on ${this.env.IP_ADDRESS}:${this.env.PORT}`);
    this.app.listen(this.env.PORT, this.env.IP_ADDRESS);
  }

  private boostrap = async () => {
    try {
      await telegramClient.setAllWebhook();
    } catch (e) {
      logger.error('Unable to run bootstrap', {
        error: (e as Error).message
      })
      process.exit(1);
    }
  }
}

export default ExpressHttp;
