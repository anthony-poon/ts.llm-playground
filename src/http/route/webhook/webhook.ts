import express, {NextFunction, Request, Response} from 'express';
import loggerFactory from "@core/logger";
import initialization from "./middleware/initialization";
import {WebhookSchema} from "./type/request";
import messageQueue from "./middleware/message-queue";

const webhookRouter = express.Router();

const logger = loggerFactory.create("webhook-router");

webhookRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
        try {
            req.payload = WebhookSchema.parse(req.body);
            res.json({
                status: "ok"
            });
            next()
        } catch (e) {
            next(e);
        }
    },
    initialization.onRequest,
    messageQueue.publish,
)

export default webhookRouter;
