import express, {NextFunction, Request, Response} from 'express';
import loggerFactory from "@core/logger";
import initialization from "./middleware/initialization";
import { WebhookRequest, WebhookSchema } from './type/request';
import messageQueue from "./middleware/message-queue";
import env from '@env';

const webhookRouter = express.Router();

const logger = loggerFactory.create("webhook-router");

export interface WebhookPayload {
  namespace: string,
  request: WebhookRequest,
}

webhookRouter.post("/:namespace", (req: Request, res: Response, next: NextFunction) => {
    try {
      const namespace = req.params["namespace"];
      const valid = env.TELEGRAM_BOTS.map(({ NAMESPACE }) => NAMESPACE);
      if (!valid.includes(namespace)) {
        res.status(404);
        return;
      }
      req.payload = {
        namespace,
        request: WebhookSchema.parse(req.body)
      } as WebhookPayload;
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
