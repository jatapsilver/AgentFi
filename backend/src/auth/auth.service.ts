import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
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

  async validateToken(token: string) {
    if (
      !token ||
      !/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)
    ) {
      return { valid: false };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new NotImplementedException('Server configuration is incorrect');
    }
    const payload = this.jwtService.verify(token, { secret });

    payload.exp = new Date(payload.exp * 1000);

    payload.iat = new Date(payload.iat * 1000);

    if (!payload.role) {
      throw new UnauthorizedException(
        'You do not have the necessary permissions',
      );
    }
    if (payload.exp < new Date()) {
      return { valid: false };
    }
    if (!payload) {
      return { valid: false };
    }
    if (!payload.sub) {
      return { valid: false };
    }
    const user = await this.userRepository.getUserById(payload.sub);
    if (!user) {
      return { valid: false };
    }
    const walletAddress = user.walletAddress;
    return { valid: true, walletAddress };
  }
}
