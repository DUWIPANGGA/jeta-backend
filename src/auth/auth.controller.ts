import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, Query } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: false,        // 👈 DI SINI
      sameSite: 'lax',      // 👈 DI SINI
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: 'Login success' };
  }
}
