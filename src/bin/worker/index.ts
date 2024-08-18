

import database from "@database";
import mqClient from "@client/mq";
import env from "@env";
import telegramQueueWorker from "./telegram-queue-worker";

(async () => {
    await database.initialize();
    await mqClient.connect();
    await mqClient.listen(env.TG_MESSAGE_QUEUE, telegramQueueWorker.handle);
})();