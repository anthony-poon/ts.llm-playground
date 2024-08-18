import {Repository} from "typeorm";
import database from "@database";
import {ChatEntity} from "@entity/chat.entity";

const { dataSource: source } = database;

export type ChatRepository = Repository<ChatEntity> & {
}

const chatRepository: ChatRepository = source.getRepository(ChatEntity).extend({
})

export default chatRepository;