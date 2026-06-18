// src/auth/auth.controller.ts
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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

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

  // @HttpCode(HttpStatus.OK)
  @Post('login/customer')
  async loginCustomer(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.loginCustomer(loginDto);

    // HttpOnly cookie khusus Customer
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

  @HttpCode(HttpStatus.OK)
  @Post('login/staff')
  async loginStaff(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.loginStaff(loginDto);

    // HttpOnly cookie khusus Staf/Admin/Finance/Superadmin
    res.cookie('staff_token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Login success (Staff Portal)',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.register(registerDto);

    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Register success',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    // Hapus sesi token pelanggan jika ada
    const token = req.cookies?.token;
    if (token) {
      await this.authService.logout(token);
    }
    
    // Hapus sesi token staf jika ada
    const staffToken = req.cookies?.staff_token;
    if (staffToken) {
      await this.authService.logout(staffToken);
    }

    // Bersihkan cookie token pelanggan
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    // Bersihkan cookie token staf
    res.clearCookie('staff_token', {
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
    const result = await this.authService.getProfile(userId);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        address: result.address,
        image: result.image,
        created_at: result.created_at,
        updated_at: result.updated_at,
        role: result.role,
      },
      permissions: result.permissions,
    };
  }
}