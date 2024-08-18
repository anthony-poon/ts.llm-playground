import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity("chat")
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({
        type: 'int',
        nullable: false,
        unique: true,
    })
    remoteId?: number;

    @Column({
        type: "jsonb",
        nullable: false
    })
    json?: object;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;
}