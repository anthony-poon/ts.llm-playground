import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity("user")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({
        type: 'varchar',
        length: 32,
        nullable: false,
        unique: true,
    })
    remoteId?: string;

    @Column({
        type: "varchar",
        length: 32
    })
    namespace?: string;

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
        length: 256,
        nullable: true
    })
    username?: string|null;


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
