import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthUser } from './auth.types';
import { Request } from 'express';

interface Auth0Claims {
  sub: string;
  email?: string;
  name?: string;
}

@Injectable()
export class Auth0JwtGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private prisma: PrismaService) {
    this.jwks = createRemoteJWKSet(
      new URL(`${this.getIssuerUrl()}.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || Array.isArray(authHeader)) {
      throw new UnauthorizedException('Missing authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const issuerUrl = this.getIssuerUrl();
    const audience = this.getAudience();

    let payload: Auth0Claims;
    try {
      const verified = await jwtVerify(token, this.jwks, {
        issuer: issuerUrl,
        audience,
      });
      payload = verified.payload as Auth0Claims;
    } catch (_error) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.upsert({
      where: { auth0Id: payload.sub },
      create: {
        auth0Id: payload.sub,
        email: payload.email ?? `${payload.sub}@auth0.local`,
        name: payload.name ?? null,
      },
      update: {
        email: payload.email ?? undefined,
        name: payload.name ?? undefined,
      },
    });

    request.user = {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
    };
    return true;
  }

  private getIssuerUrl(): string {
    const issuerUrl =
      process.env.AUTH0_ISSUER_URL ?? process.env.AUTH0_DOMAIN;
    if (!issuerUrl) {
      throw new Error('AUTH0_ISSUER_URL or AUTH0_DOMAIN is required');
    }
    return issuerUrl.startsWith('http') ? issuerUrl : `https://${issuerUrl}/`;
  }

  private getAudience(): string {
    const audience = process.env.AUTH0_AUDIENCE;
    if (!audience) {
      throw new Error('AUTH0_AUDIENCE is required');
    }
    return audience;
  }
}
