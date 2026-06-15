import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const ENTRIES_SELECT = {
  entries: { select: { eu: true, us: true, uk: true, cm: true } },
} as const;

@Injectable()
export class SizeGuideService {
  constructor(private readonly prisma: PrismaService) {}

  async findGlobal() {
    const guide = await this.prisma.sizeGuide.findFirst({
      where: { categoryId: null },
      include: ENTRIES_SELECT,
    });

    return {
      categoryId: null,
      categoryName: null,
      entries: guide?.entries ?? [],
    };
  }

  async findByCategory(categoryId: string) {
    const guide = await this.prisma.sizeGuide.findUnique({
      where: { categoryId },
      include: {
        ...ENTRIES_SELECT,
        category: { select: { name: true } },
      },
    });

    if (!guide)
      throw new NotFoundException('Size guide not found for this category');

    return {
      categoryId: guide.categoryId,
      categoryName: guide.category?.name ?? null,
      entries: guide.entries,
    };
  }
}
