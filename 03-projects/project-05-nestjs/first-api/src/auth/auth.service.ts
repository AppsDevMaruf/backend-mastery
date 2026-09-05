import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../user/user.repository';
import { UserRole } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async register(data: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const newUser = await this.userRepository.createUser({
      role: UserRole.USER,
      name: data.name,
      email: data.email,
      passwordHash,
      refreshTokenHash: null,
    });
    return {
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  }

  async login(data: LoginDto) {
    const user = await this.userRepository.findByEmailWithPassword(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
        'JWT_ACCESS_EXPIRES_IN',
      ),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.userRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findByIdWithRefreshToken(
      payload.sub,
    );

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token is not valid');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token is not valid');
    }

    const newPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
        'JWT_ACCESS_EXPIRES_IN',
      ),
    });

    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await this.userRepository.updateRefreshTokenHash(
      user.id,
      newRefreshTokenHash,
    );

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  async logout(userId: number) {
    await this.userRepository.clearRefreshTokenHash(userId);
    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
