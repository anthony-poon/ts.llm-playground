import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {ChatLockEntity} from "@entity/chat-lock.entity";
import {Chat} from "@core/chat";
import {DateTime} from "luxon";

interface NewChatOptions {
    ttl?: number,
    chat?: Chat,
}

@Entity("chat")
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({
        type: 'varchar',
        length: 32,
        nullable: false,
        unique: true,
    })
    remoteId?: number;

    @Column({
        type: "jsonb",
        nullable: false
    })
    json?: object;

    @OneToOne(() => ChatLockEntity, { nullable: false, eager: true, cascade: ['insert', 'update', 'remove'] })
    @JoinColumn()
    lock?: ChatLockEntity;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    static getNewChat(remoteId: number, opts: NewChatOptions = {}) {
        const entity = new ChatEntity();
        const lock = new ChatLockEntity();
        const chat = opts.chat || new Chat();
        entity.remoteId = remoteId;
        entity.lock = lock;
        lock.chat = entity;
        entity.json = JSON.parse(chat.dehydrate());
        lock.expireAt = opts.ttl ? DateTime.now().plus({ second: opts.ttl }).toJSDate() : null;
        return entity;
    }
}