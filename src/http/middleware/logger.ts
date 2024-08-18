import { NextFunction, Request, Response } from 'express';
import loggerFactory from "@core/logger";

const logger = loggerFactory.create("logger-middleware")

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    logger.debug("HTTP Request.", {
        url: req.url,
        body: req.body,
        params: req.params
    })
    next();
};

export default loggerMiddleware;