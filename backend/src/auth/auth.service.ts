import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}
  async login(dto: LoginUserDto) {
    const { email, wallet } = dto;
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      const newUser = await this.userRepository.crateUser(email, wallet);

      const payload = {
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };
      const token = this.jwtService.sign(payload);

      return token;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    return token;
  }
}
