import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
	ADMIN = 'admin',
	STAFF = 'staff',
}

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	username!: string;

	@Column()
	password!: string;

	@Column({
		type: 'enum',
		enum: UserRole,
	})
	role!: UserRole;
}
