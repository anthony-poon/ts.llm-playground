import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity("user")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({
        type: 'int',
        nullable: false,
        unique: true,
    })
    remoteId: number|undefined;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true
    })
    firstName?: string|null;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true
    })
    lastName?: string|null;

    @Column({
        type: 'varchar',
        length: 8,
        nullable: true
    })
    languageCode?: string|null;

    @Column({
        type: 'boolean',
        default: false
    })
    isBot: boolean = false;

    @Column({
        type: 'boolean',
        nullable: false,
        default: true
    })
    isAllowed: boolean = true;

    @Column({
        type: 'date',
        nullable: false,
    })
    lastSeenAt?: Date;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;
}
