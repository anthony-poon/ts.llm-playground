import {Repository} from "typeorm";
import {UserEntity} from "@entity/user.entity";
import database from "@database";

const { dataSource: source } = database;

export type UserRepository = Repository<UserEntity> & {
    upsertByRemoteId: (entity: Partial<UserEntity> & { remoteId: string }) => Promise<UserEntity>;
}

const userRepository: UserRepository = source.getRepository(UserEntity).extend({
    upsertByRemoteId: async (entity: Partial<UserEntity> & { remoteId: string }) => {
        const upserted = await source.getRepository(UserEntity).createQueryBuilder()
            .insert()
            .into(UserEntity)
            .values(entity)
            .orUpdate(['firstName', 'lastName', 'languageCode', 'lastSeenAt'], ['remoteId'])
            .returning('*') // Postgres specific: returns the inserted/updated entity
            .execute();
        return upserted.generatedMaps[0] as UserEntity;
    }
})

export default userRepository;