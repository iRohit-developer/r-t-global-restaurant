import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
	) {}

	async findByUsername(username: string): Promise<User | undefined> {
		const user = await this.usersRepository.findOne({ where: { username } });
		return user ?? undefined;
	}

	async findById(id: number): Promise<User | undefined> {
		const user = await this.usersRepository.findOne({ where: { id } });
		return user ?? undefined;
	}

	async createUser(username: string, password: string, role: UserRole): Promise<User> {
		const existing = await this.findByUsername(username);
		if (existing) {
			throw new ConflictException(`Username ${username} is already taken`);
		}

		const user = this.usersRepository.create({
			username,
			password: hashSync(password, 10),
			role,
		});

		return this.usersRepository.save(user);
	}
}
