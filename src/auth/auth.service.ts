import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { GoogleService } from 'src/google/google.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { decrypt, encrypt } from 'src/security/crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private googleService: GoogleService,
  ) {}

  getGoogleAuthUrl() {
    const oauthClient = this.googleService.createOAuthClient();
    return oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'openid',
        'email',
        'profile',
      ],
    });
  }

  async loginWithGoogle(code: string) {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    const oauthClient = this.googleService.createOAuthClient();
    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.access_token) {
      throw new BadRequestException('Missing access token');
    }

    oauthClient.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauthClient });
    const { data } = await oauth2.userinfo.get();

    if (!data.id || !data.email) {
      throw new BadRequestException('Google account missing id or email');
    }

    const user = await this.prisma.user.upsert({
      where: { googleId: data.id },
      create: {
        googleId: data.id,
        email: data.email,
        name: data.name ?? null,
      },
      update: {
        email: data.email,
        name: data.name ?? null,
      },
    });

    const existingToken = await this.prisma.googleToken.findUnique({
      where: { userId: user.id },
    });

    const existingRefreshToken = existingToken?.refreshToken
      ? decrypt(existingToken.refreshToken)
      : undefined;
    const existingAccessToken = existingToken?.accessToken
      ? decrypt(existingToken.accessToken)
      : undefined;

    const refreshToken = tokens.refresh_token ?? existingRefreshToken;
    if (!refreshToken) {
      throw new BadRequestException(
        'Missing refresh token. Re-consent with access_type=offline.',
      );
    }

    const accessToken = tokens.access_token ?? existingAccessToken;
    if (!accessToken) {
      throw new BadRequestException('Missing access token');
    }

    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : existingToken?.expiryDate ?? null;

    await this.prisma.googleToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accessToken: encrypt(accessToken),
        refreshToken: encrypt(refreshToken),
        scope: tokens.scope ?? null,
        tokenType: tokens.token_type ?? null,
        expiryDate,
      },
      update: {
        accessToken: encrypt(accessToken),
        refreshToken: encrypt(refreshToken),
        scope: tokens.scope ?? existingToken?.scope ?? null,
        tokenType: tokens.token_type ?? existingToken?.tokenType ?? null,
        expiryDate,
      },
    });

    const jwt = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken: jwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
  }
}
