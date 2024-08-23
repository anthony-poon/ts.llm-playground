

import database from "@database";
import mqClient from "@client/mq";
import env from "@env";
import telegramWorker from "../worker/telegram-worker";

(async () => {
    await database.initialize();
    await mqClient.connect();
    await mqClient.listen(env.TG_MESSAGE_QUEUE, telegramWorker.handle);
})();