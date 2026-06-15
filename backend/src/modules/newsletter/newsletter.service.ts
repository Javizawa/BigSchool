import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NewsletterDto } from './dto/newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: NewsletterDto) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });

    if (existing) throw new ConflictException('Email already subscribed');

    await this.prisma.newsletterSubscriber.create({
      data: { email: dto.email },
    });
  }

  async unsubscribe(dto: NewsletterDto) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });

    if (!existing) throw new NotFoundException('Email not found');

    await this.prisma.newsletterSubscriber.delete({
      where: { email: dto.email },
    });
  }
}
