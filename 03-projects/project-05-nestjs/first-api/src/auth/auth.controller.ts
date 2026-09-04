import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.interface';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './decorators/roles.guard';
import { UserRole } from 'src/user/user.entity';
import { Permission } from './permissions/permission.enum';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshAccessToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-test')
  adminTest(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      message: 'Welcome Admin',
      data: user,
    };
  }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.USER_DELETE)
  @Get('permission-test')
  permissionTest(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      message: 'Permission granted',
      data: user,
    };
  }
}
