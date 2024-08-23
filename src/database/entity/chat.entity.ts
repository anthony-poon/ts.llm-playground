import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn, Unique,
    UpdateDateColumn
} from 'typeorm';
import {ChatLockEntity} from "@entity/chat-lock.entity";
import {Chat} from "@core/chat";
import {DateTime} from "luxon";
import e from 'express';

interface NewChatOptions {
    userId: string,
    remoteId: string,
    namespace: string,
    ttl?: number,
    chat?: Chat,
}

@Entity("chat")
@Unique(["userId", "remoteId", "namespace"])
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({
        type: 'varchar',
        length: 32,
        nullable: false,
    })
    userId?: string;

    @Column({
        type: 'varchar',
        length: 32,
        nullable: false,
    })
    remoteId?: string;

    @Column({
        type: "varchar",
        length: 32
    })
    namespace?: string;

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

    static getNewChat(opts: NewChatOptions) {
        const entity = new ChatEntity();
        const lock = new ChatLockEntity();
        const chat = opts.chat || new Chat();
        entity.namespace = opts.namespace;
        entity.remoteId = opts.remoteId;
        entity.userId = opts.userId;
        entity.lock = lock;
        lock.chat = entity;
        entity.json = JSON.parse(chat.dehydrate());
        lock.expireAt = opts.ttl ? DateTime.now().plus({ second: opts.ttl }).toJSDate() : null;
        return entity;
    }
}