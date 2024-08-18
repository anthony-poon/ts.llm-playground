import express from 'express';
import loggerFactory from "@core/logger";
import initializationAction from "./action/initialization";
import {WebhookSchema} from "./type/request";
import mqAction from "./action/message-queue";

const webhookRouter = express.Router();

const logger = loggerFactory.create("webhook-router");

webhookRouter.post("/", async (req, res, next) => {
    try {
        const webhook = WebhookSchema.parse(req.body);
        await initializationAction.onRequest(webhook);
        await mqAction.publish(webhook);
        res.json({
            status: "ok"
        })
    } catch (e) {
        next(e);
    }

})

export default webhookRouter;
