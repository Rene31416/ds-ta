import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from 'src/prisma/prisma.service';
import { decrypt, encrypt } from 'src/security/crypto';
import { GoogleService } from './google.service';

@Injectable()
export class GoogleCalendarService {
  constructor(
    private prisma: PrismaService,
    private googleService: GoogleService,
  ) {}

  private async getAuthorizedClient(userId: number) {
    const token = await this.prisma.googleToken.findUnique({
      where: { userId },
    });

    if (!token) {
      throw new BadRequestException('Google Calendar not connected');
    }

    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = decrypt(token.accessToken);
      refreshToken = decrypt(token.refreshToken);
    } catch (error) {
      throw new BadRequestException('Stored Google token is invalid');
    }

    const client = this.googleService.createOAuthClient();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: token.scope ?? undefined,
      token_type: token.tokenType ?? undefined,
      expiry_date: token.expiryDate?.getTime() ?? undefined,
    });

    if (token.expiryDate && token.expiryDate.getTime() <= Date.now() - 60_000) {
      try {
        const refreshed = await client.refreshAccessToken();
        const credentials = refreshed.credentials;
        await this.prisma.googleToken.update({
          where: { userId },
          data: {
            accessToken: encrypt(credentials.access_token ?? accessToken),
            expiryDate: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : token.expiryDate,
          },
        });
      } catch (_error) {
        // Allow the API request to surface auth errors.
      }
    }

    return client;
  }

  async hasConflict(
    userId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startAt.toISOString(),
      timeMax: endAt.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 1,
    });

    return (response.data.items?.length ?? 0) > 0;
  }
}
