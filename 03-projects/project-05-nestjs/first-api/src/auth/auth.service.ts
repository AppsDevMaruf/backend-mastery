import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/user/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { UserRole } from 'src/user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
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
      secret: 'dev-access-secret',
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: 'dev-refresh-secret',
      expiresIn: '7d',
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
        secret: 'dev-refresh-secret',
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

    console.log('DB refresh hash:', user.refreshTokenHash);

    console.log('Refresh token valid:', isValid);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token is not valid');
    }

    const newPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // নতুন Access Token
    const accessToken = await this.jwtService.signAsync(newPayload, {
      secret: 'dev-access-secret',
      expiresIn: '15m',
    });

    // নতুন Refresh Token
    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      secret: 'dev-refresh-secret',
      expiresIn: '7d',
    });

    // নতুন Refresh Token-এর hash
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    // পুরোনো hash replace হবে
    await this.userRepository.updateRefreshTokenHash(
      user.id,
      newRefreshTokenHash,
    );

    return {
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken,
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
