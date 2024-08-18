import userRepository, {UserRepository} from "@repository/user-repository";
import {WebhookRequest} from "../type/request";
import loggerFactory from "@core/logger";


const logger = loggerFactory.create('initialization-action')

class InitializationAction {
    constructor(private readonly userRepository: UserRepository) {
    }

    public onRequest = async (req: WebhookRequest) => {
        const { message: { from: user } } = req
        const upserted = await this.userRepository.upsertByRemoteId({
            remoteId: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            languageCode: user.language_code,
            lastSeenAt: new Date(),
            isBot: user.is_bot
        });
        logger.info('User', upserted);
    }
}

const initializationAction = new InitializationAction(userRepository);

export default initializationAction;