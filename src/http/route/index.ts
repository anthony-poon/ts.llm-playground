import express, { Express } from 'express';
import { ValidationError } from 'joi';

import { BadRequestError, HTTPError, InternalError } from '../error';
import loggerFactory from "@core/logger";
import defaultRoute from "./default";
import webhookRouter from "./webhook/webhook";
import {ZodError} from "zod";

const logger = loggerFactory.create('router');

const errorHandler = (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid input',
      details: err.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join('.'),
      })),
    });
  }
  if (err instanceof InternalError) {
    logger.error(err.message);
    return res.status(err.code);
  }
  if (err instanceof BadRequestError) {
    return res.status(err.code).json({
      error: err.constructor.name,
      message: err.message,
    });
  }
  if (err instanceof HTTPError) {
    return res.status(err.code);
  }
  if ((err as any).status) {
    // This checks specifically for JSON parsing errors
    return res.status((err as any).status).json({
      error: err.constructor.name,
      message: err.message,
    });
  }

  logger.error(err.message);
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong on the server.',
  });
};

export const fallback = (req: express.Request, res: express.Response) => {
  res.sendStatus(404);
};

const configRoutes = (app: Express) => {
  app.use('/', defaultRoute);
  app.use('/webhook', webhookRouter);
  app.use(errorHandler);
  app.use(fallback);
};

export default configRoutes;
