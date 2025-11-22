import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async crateUser(email: string, wallet: string) {
    const newUser = await this.userRepository.create({
      email,
      walletAddress: wallet,
    });
    return await this.userRepository.save(newUser);
  }
}
