import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {ChatEntity} from "@entity/chat.entity";

@Entity("chat_lock")
export class ChatLockEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(() => ChatEntity, (chat) => chat.lock)
    chat?: ChatEntity;

    @Column({
        type: 'timestamp',
        nullable: true
    })
    expireAt?: Date|null;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;
}