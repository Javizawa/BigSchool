import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateBrandDto } from '../dto/create-brand.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class AdminBrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }

  async create(dto: CreateBrandDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Brand slug already exists');

    return this.prisma.brand.create({
      data: { name: dto.name, slug, logoUrl: dto.logoUrl ?? null },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }

  async update(brandId: string, dto: CreateBrandDto) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    return this.prisma.brand.update({
      where: { id: brandId },
      data: {
        name: dto.name,
        slug: slugify(dto.name),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }

  async remove(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    await this.prisma.brand.delete({ where: { id: brandId } });
  }
}
