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
import { Auth0JwtGuard } from './auth0-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google/url')
  async googleAuthUrl() {
    return { url: this.authService.getGoogleAuthUrl() };
  }

  @UseGuards(Auth0JwtGuard)
  @Post('google')
  async connectGoogle(
    @Req()
    req: Request & {
      user?: { id: number; auth0Id: string; email: string; name?: string | null };
    },
    @Body() body: GoogleAuthDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    return this.authService.connectGoogle(
      {
        id: req.user.id,
        auth0Id: req.user.auth0Id,
        email: req.user.email,
        name: req.user.name ?? null,
      },
      body.code,
    );
  }

  @UseGuards(Auth0JwtGuard)
  @Get('me')
  async me(
    @Req()
    req: Request & {
      user?: { id: number; auth0Id: string; email: string; name?: string | null };
    },
  ) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    return this.authService.getUser(req.user.id);
  }
}
