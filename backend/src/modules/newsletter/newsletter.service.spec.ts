import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NewsletterService } from './newsletter.service';

const mockPrisma = {
  newsletterSubscriber: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('NewsletterService', () => {
  let service: NewsletterService;

  beforeEach(async () => {
    Object.values(mockPrisma).forEach((model) =>
      Object.values(model).forEach((fn) => fn.mockReset()),
    );
    const module = await Test.createTestingModule({
      providers: [
        NewsletterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(NewsletterService);
  });

  describe('subscribe', () => {
    it('throws ConflictException when email is already subscribed', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
        email: 'a@b.com',
      });
      await expect(service.subscribe({ email: 'a@b.com' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates a subscriber when email is new', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);

      await service.subscribe({ email: 'new@b.com' });

      expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { email: 'new@b.com' } }),
      );
    });
  });

  describe('unsubscribe', () => {
    it('throws NotFoundException when email is not subscribed', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
      await expect(
        service.unsubscribe({ email: 'ghost@b.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes the subscriber when email exists', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
        email: 'a@b.com',
      });

      await service.unsubscribe({ email: 'a@b.com' });

      expect(mockPrisma.newsletterSubscriber.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'a@b.com' } }),
      );
    });
  });
});
