import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

// Hindari konflik tipe dengan menggunakan any untuk Response sementara
// Atau gunakan import type tetapi jika error, pakai any.
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role_id?: number;
    [key: string]: any;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any, // pakai any agar tidak bentrok tipe
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Login success',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.token;
    if (token) {
      await this.authService.logout(token);
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logout success' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const profile = await this.authService.getProfile(userId);
    return {
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }
}