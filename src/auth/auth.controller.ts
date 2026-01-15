import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body() body: GoogleAuthDto) {
    return this.authService.loginWithGoogle(body.code);
  }

  @Get('google/url')
  async googleAuthUrl() {
    return { url: this.authService.getGoogleAuthUrl() };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user?: { id: number } }) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    return this.authService.getUser(req.user.id);
  }
}
