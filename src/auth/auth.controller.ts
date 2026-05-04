import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, Query, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Access } from 'src/common/decorator/access/access.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(JwtAuthGuard)
  @Access(1, 'create')
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(1, 'read')
  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Access(1, 'read')
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
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
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role

      }
    };
  }

  // ✅ TAMBAHKAN METHOD LOGOUT INI
  @UseGuards(JwtAuthGuard)
  @Access(1, 'read')
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Ambil token dari cookie
    const token = req.cookies?.token;

    if (token) {
      // Opsional: Blacklist token jika perlu (untuk invalidasi di sisi server)
      await this.authService.logout(token);
    }

    // Hapus cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logout success' };
  }
}
