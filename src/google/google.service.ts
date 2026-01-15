import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Injectable()
export class GoogleService {
  createOAuthClient(): InstanceType<typeof google.auth.OAuth2> {
    const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
    const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
    const redirectUri = getRequiredEnv('GOOGLE_REDIRECT_URI');

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
}
