import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reservation } from 'generated/prisma/client';
import { GoogleCalendarService } from 'src/google/google-calendar.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private googleCalendar: GoogleCalendarService,
  ) {}

  async list(userId: number): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { startAt: 'asc' },
    });
  }

  async getById(userId: number, id: number): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  async create(
    userId: number,
    data: CreateReservationDto,
  ): Promise<Reservation> {
    const startAt = this.parseDate(data.startAt, 'startAt');
    const endAt = this.parseDate(data.endAt, 'endAt');
    this.assertValidRange(startAt, endAt);

    await this.assertNoConflict(startAt, endAt);
    await this.assertGoogleCalendarAvailability(userId, startAt, endAt);

    return this.prisma.reservation.create({
      data: {
        name: data.name,
        startAt,
        endAt,
        userId,
      },
    });
  }

  async update(
    userId: number,
    id: number,
    data: UpdateReservationDto,
  ): Promise<Reservation> {
    const existing = await this.prisma.reservation.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Reservation not found');
    }

    const startAt = data.startAt
      ? this.parseDate(data.startAt, 'startAt')
      : existing.startAt;
    const endAt = data.endAt
      ? this.parseDate(data.endAt, 'endAt')
      : existing.endAt;

    this.assertValidRange(startAt, endAt);
    await this.assertNoConflict(startAt, endAt, id);
    await this.assertGoogleCalendarAvailability(userId, startAt, endAt);

    return this.prisma.reservation.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        startAt,
        endAt,
      },
    });
  }

  async remove(userId: number, id: number): Promise<Reservation> {
    const existing = await this.prisma.reservation.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Reservation not found');
    }
    return this.prisma.reservation.delete({ where: { id } });
  }

  private parseDate(value: string | undefined, field: string): Date {
    if (!value) {
      throw new BadRequestException(`${field} is required`);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }
    return date;
  }

  private assertValidRange(startAt: Date, endAt: Date): void {
    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }
  }

  private async assertNoConflict(
    startAt: Date,
    endAt: Date,
    excludeId?: number,
  ): Promise<void> {
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Conflicts with existing reservation ${conflict.id}`,
      );
    }
  }

  private async assertGoogleCalendarAvailability(
    userId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<void> {
    const hasConflict = await this.googleCalendar.hasConflict(
      userId,
      startAt,
      endAt,
    );
    if (hasConflict) {
      throw new ConflictException('Conflicts with Google Calendar event');
    }
  }
}
