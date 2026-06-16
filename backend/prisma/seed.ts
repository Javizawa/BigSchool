import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ---------------------------------------------------------------------------
// Imágenes de placeholder realistas (Unsplash CDN, no requieren cuenta)
// ---------------------------------------------------------------------------
const IMG = {
  nike_am90:      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  nike_af1:       'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80',
  nike_react:     'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
  adidas_ultra:   'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&q=80',
  adidas_samba:   'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80',
  adidas_stan:    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80',
  nb_574:         'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
  nb_990:         'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
  puma_suede:     'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
  converse_ct:    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80',
  jordan_1:       'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600&q=80',
  vans_old:       'https://images.unsplash.com/photo-1465479423260-c4afc24172c6?w=600&q=80',
};

async function main() {
  console.log('🌱 Limpiando base de datos...');
  await prisma.stockNotification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderTracking.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.return.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productSeo.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sizeGuideEntry.deleteMany();
  await prisma.sizeGuide.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  // -------------------------------------------------------------------------
  console.log('👟 Creando marcas...');
  // -------------------------------------------------------------------------
  const [nike, adidas, nb, puma, converse, jordan, vans] = await Promise.all([
    prisma.brand.create({ data: { name: 'Nike',       slug: 'nike',       logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' } }),
    prisma.brand.create({ data: { name: 'Adidas',     slug: 'adidas',     logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' } }),
    prisma.brand.create({ data: { name: 'New Balance',slug: 'new-balance',logoUrl: null } }),
    prisma.brand.create({ data: { name: 'Puma',       slug: 'puma',       logoUrl: null } }),
    prisma.brand.create({ data: { name: 'Converse',   slug: 'converse',   logoUrl: null } }),
    prisma.brand.create({ data: { name: 'Jordan',     slug: 'jordan',     logoUrl: null } }),
    prisma.brand.create({ data: { name: 'Vans',       slug: 'vans',       logoUrl: null } }),
  ]);

  // -------------------------------------------------------------------------
  console.log('📦 Creando categorías...');
  // -------------------------------------------------------------------------
  const [running, basketball, casual, training] = await Promise.all([
    prisma.category.create({ data: { name: 'Running',    slug: 'running',    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80' } }),
    prisma.category.create({ data: { name: 'Basketball', slug: 'basketball', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80' } }),
    prisma.category.create({ data: { name: 'Casual',     slug: 'casual',     imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' } }),
    prisma.category.create({ data: { name: 'Training',   slug: 'training',   imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' } }),
  ]);

  // -------------------------------------------------------------------------
  console.log('🛍️ Creando guías de tallas...');
  // -------------------------------------------------------------------------
  const sizeGuide = await prisma.sizeGuide.create({
    data: {
      categoryId: running.id,
      entries: {
        create: [
          { eu: 38, us: 6,   uk: 5,   cm: 24.0 },
          { eu: 39, us: 6.5, uk: 5.5, cm: 24.5 },
          { eu: 40, us: 7,   uk: 6,   cm: 25.0 },
          { eu: 41, us: 8,   uk: 7,   cm: 25.5 },
          { eu: 42, us: 8.5, uk: 7.5, cm: 26.5 },
          { eu: 43, us: 9.5, uk: 8.5, cm: 27.5 },
          { eu: 44, us: 10,  uk: 9,   cm: 28.0 },
          { eu: 45, us: 11,  uk: 10,  cm: 28.5 },
          { eu: 46, us: 12,  uk: 11,  cm: 29.5 },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  console.log('👟 Creando productos...');
  // -------------------------------------------------------------------------
  const products = [
    // RUNNING — HOMBRE
    {
      name: 'Nike Air Max 90', slug: 'nike-air-max-90', brandId: nike.id, categoryId: running.id,
      gender: 'man', price: 139.95, salePrice: null,
      description: 'Icónico diseño retro con amortiguación Air Max visible. Perfecto para el día a día con estilo.',
      thumbnailUrl: IMG.nike_am90, isActive: true,
      variants: [
        { sku: 'NAM90-BLK-41', size: 41, color: 'Negro',   colorHex: '#1a1a1a', stock: 5,  imageUrls: [IMG.nike_am90] },
        { sku: 'NAM90-BLK-42', size: 42, color: 'Negro',   colorHex: '#1a1a1a', stock: 8,  imageUrls: [IMG.nike_am90] },
        { sku: 'NAM90-BLK-43', size: 43, color: 'Negro',   colorHex: '#1a1a1a', stock: 3,  imageUrls: [IMG.nike_am90] },
        { sku: 'NAM90-WHT-42', size: 42, color: 'Blanco',  colorHex: '#ffffff', stock: 6,  imageUrls: [IMG.nike_am90] },
        { sku: 'NAM90-WHT-43', size: 43, color: 'Blanco',  colorHex: '#ffffff', stock: 4,  imageUrls: [IMG.nike_am90] },
      ],
    },
    {
      name: 'Nike React Infinity', slug: 'nike-react-infinity', brandId: nike.id, categoryId: running.id,
      gender: 'man', price: 159.99, salePrice: 119.99,
      description: 'Máxima amortiguación React para largas distancias. Reduce el riesgo de lesiones con su diseño envolvente.',
      thumbnailUrl: IMG.nike_react, isActive: true,
      variants: [
        { sku: 'NRI-BLU-40', size: 40, color: 'Azul',  colorHex: '#2563eb', stock: 4, imageUrls: [IMG.nike_react] },
        { sku: 'NRI-BLU-41', size: 41, color: 'Azul',  colorHex: '#2563eb', stock: 7, imageUrls: [IMG.nike_react] },
        { sku: 'NRI-BLU-42', size: 42, color: 'Azul',  colorHex: '#2563eb', stock: 2, imageUrls: [IMG.nike_react] },
        { sku: 'NRI-GRY-42', size: 42, color: 'Gris',  colorHex: '#6b7280', stock: 5, imageUrls: [IMG.nike_react] },
        { sku: 'NRI-GRY-44', size: 44, color: 'Gris',  colorHex: '#6b7280', stock: 3, imageUrls: [IMG.nike_react] },
      ],
    },
    {
      name: 'Adidas Ultraboost 23', slug: 'adidas-ultraboost-23', brandId: adidas.id, categoryId: running.id,
      gender: 'man', price: 189.95, salePrice: null,
      description: 'La tecnología Boost devuelve energía en cada zancada. El favorito de los corredores de alto rendimiento.',
      thumbnailUrl: IMG.adidas_ultra, isActive: true,
      variants: [
        { sku: 'AUB23-WHT-41', size: 41, color: 'Blanco',  colorHex: '#ffffff', stock: 3, imageUrls: [IMG.adidas_ultra] },
        { sku: 'AUB23-WHT-42', size: 42, color: 'Blanco',  colorHex: '#ffffff', stock: 6, imageUrls: [IMG.adidas_ultra] },
        { sku: 'AUB23-WHT-43', size: 43, color: 'Blanco',  colorHex: '#ffffff', stock: 4, imageUrls: [IMG.adidas_ultra] },
        { sku: 'AUB23-BLK-43', size: 43, color: 'Negro',   colorHex: '#1a1a1a', stock: 5, imageUrls: [IMG.adidas_ultra] },
        { sku: 'AUB23-BLK-44', size: 44, color: 'Negro',   colorHex: '#1a1a1a', stock: 2, imageUrls: [IMG.adidas_ultra] },
      ],
    },
    {
      name: 'New Balance 990v6', slug: 'new-balance-990v6', brandId: nb.id, categoryId: running.id,
      gender: 'man', price: 219.95, salePrice: null,
      description: 'Fabricado en EE.UU. Combinación perfecta de soporte, comodidad y durabilidad para el runner exigente.',
      thumbnailUrl: IMG.nb_990, isActive: true,
      variants: [
        { sku: 'NB990-GRY-40', size: 40, color: 'Gris', colorHex: '#9ca3af', stock: 3, imageUrls: [IMG.nb_990] },
        { sku: 'NB990-GRY-41', size: 41, color: 'Gris', colorHex: '#9ca3af', stock: 5, imageUrls: [IMG.nb_990] },
        { sku: 'NB990-GRY-42', size: 42, color: 'Gris', colorHex: '#9ca3af', stock: 4, imageUrls: [IMG.nb_990] },
        { sku: 'NB990-NVY-43', size: 43, color: 'Navy', colorHex: '#1e3a8a', stock: 2, imageUrls: [IMG.nb_990] },
      ],
    },

    // CASUAL — MUJER
    {
      name: 'Nike Air Force 1', slug: 'nike-air-force-1', brandId: nike.id, categoryId: casual.id,
      gender: 'woman', price: 109.95, salePrice: null,
      description: 'El clásico atemporal. Cuero premium y suela Air que no pasa de moda.',
      thumbnailUrl: IMG.nike_af1, isActive: true,
      variants: [
        { sku: 'NAF1-WHT-37', size: 37, color: 'Blanco', colorHex: '#ffffff', stock: 6, imageUrls: [IMG.nike_af1] },
        { sku: 'NAF1-WHT-38', size: 38, color: 'Blanco', colorHex: '#ffffff', stock: 8, imageUrls: [IMG.nike_af1] },
        { sku: 'NAF1-WHT-39', size: 39, color: 'Blanco', colorHex: '#ffffff', stock: 5, imageUrls: [IMG.nike_af1] },
        { sku: 'NAF1-BLK-38', size: 38, color: 'Negro',  colorHex: '#1a1a1a', stock: 4, imageUrls: [IMG.nike_af1] },
        { sku: 'NAF1-BLK-40', size: 40, color: 'Negro',  colorHex: '#1a1a1a', stock: 3, imageUrls: [IMG.nike_af1] },
      ],
    },
    {
      name: 'Adidas Samba OG', slug: 'adidas-samba-og', brandId: adidas.id, categoryId: casual.id,
      gender: 'woman', price: 99.95, salePrice: 79.95,
      description: 'Icono del street style. Diseño vintage con la Y-3 stripes y suela de goma natural.',
      thumbnailUrl: IMG.adidas_samba, isActive: true,
      variants: [
        { sku: 'ASOG-WHT-36', size: 36, color: 'Blanco', colorHex: '#ffffff', stock: 4, imageUrls: [IMG.adidas_samba] },
        { sku: 'ASOG-WHT-37', size: 37, color: 'Blanco', colorHex: '#ffffff', stock: 6, imageUrls: [IMG.adidas_samba] },
        { sku: 'ASOG-WHT-38', size: 38, color: 'Blanco', colorHex: '#ffffff', stock: 3, imageUrls: [IMG.adidas_samba] },
        { sku: 'ASOG-BRN-38', size: 38, color: 'Marrón', colorHex: '#78350f', stock: 5, imageUrls: [IMG.adidas_samba] },
        { sku: 'ASOG-BRN-39', size: 39, color: 'Marrón', colorHex: '#78350f', stock: 2, imageUrls: [IMG.adidas_samba] },
      ],
    },
    {
      name: 'Converse Chuck Taylor All Star', slug: 'converse-chuck-taylor', brandId: converse.id, categoryId: casual.id,
      gender: 'woman', price: 74.95, salePrice: null,
      description: 'El básico definitivo. Lona resistente y puntera de goma. Combina con todo.',
      thumbnailUrl: IMG.converse_ct, isActive: true,
      variants: [
        { sku: 'CCT-WHT-36', size: 36, color: 'Blanco', colorHex: '#ffffff', stock: 10, imageUrls: [IMG.converse_ct] },
        { sku: 'CCT-WHT-37', size: 37, color: 'Blanco', colorHex: '#ffffff', stock: 8,  imageUrls: [IMG.converse_ct] },
        { sku: 'CCT-WHT-38', size: 38, color: 'Blanco', colorHex: '#ffffff', stock: 6,  imageUrls: [IMG.converse_ct] },
        { sku: 'CCT-BLK-37', size: 37, color: 'Negro',  colorHex: '#1a1a1a', stock: 7,  imageUrls: [IMG.converse_ct] },
        { sku: 'CCT-RED-38', size: 38, color: 'Rojo',   colorHex: '#dc2626', stock: 4,  imageUrls: [IMG.converse_ct] },
      ],
    },

    // UNISEX
    {
      name: 'Adidas Stan Smith', slug: 'adidas-stan-smith', brandId: adidas.id, categoryId: casual.id,
      gender: 'unisex', price: 89.95, salePrice: null,
      description: 'El tenis más vendido de la historia. Minimalismo atemporal que nunca pasa de moda.',
      thumbnailUrl: IMG.adidas_stan, isActive: true,
      variants: [
        { sku: 'ASS-WHT-38', size: 38, color: 'Blanco', colorHex: '#ffffff', stock: 5, imageUrls: [IMG.adidas_stan] },
        { sku: 'ASS-WHT-40', size: 40, color: 'Blanco', colorHex: '#ffffff', stock: 7, imageUrls: [IMG.adidas_stan] },
        { sku: 'ASS-WHT-42', size: 42, color: 'Blanco', colorHex: '#ffffff', stock: 6, imageUrls: [IMG.adidas_stan] },
        { sku: 'ASS-WHT-44', size: 44, color: 'Blanco', colorHex: '#ffffff', stock: 3, imageUrls: [IMG.adidas_stan] },
      ],
    },
    {
      name: 'New Balance 574', slug: 'new-balance-574', brandId: nb.id, categoryId: casual.id,
      gender: 'unisex', price: 94.95, salePrice: 69.95,
      description: 'La silueta más icónica de New Balance. ENCAP para soporte y amortiguación, toda la semana.',
      thumbnailUrl: IMG.nb_574, isActive: true,
      variants: [
        { sku: 'NB574-GRN-38', size: 38, color: 'Verde',  colorHex: '#16a34a', stock: 4, imageUrls: [IMG.nb_574] },
        { sku: 'NB574-GRN-40', size: 40, color: 'Verde',  colorHex: '#16a34a', stock: 6, imageUrls: [IMG.nb_574] },
        { sku: 'NB574-GRN-42', size: 42, color: 'Verde',  colorHex: '#16a34a', stock: 3, imageUrls: [IMG.nb_574] },
        { sku: 'NB574-BEI-40', size: 40, color: 'Beige',  colorHex: '#d4a96a', stock: 5, imageUrls: [IMG.nb_574] },
        { sku: 'NB574-BEI-42', size: 42, color: 'Beige',  colorHex: '#d4a96a', stock: 2, imageUrls: [IMG.nb_574] },
      ],
    },
    {
      name: 'Vans Old Skool', slug: 'vans-old-skool', brandId: vans.id, categoryId: casual.id,
      gender: 'unisex', price: 79.95, salePrice: null,
      description: 'Caña baja con la icónica franja lateral. Suelo Waffle para mayor tracción.',
      thumbnailUrl: IMG.vans_old, isActive: true,
      variants: [
        { sku: 'VOS-BLK-37', size: 37, color: 'Negro', colorHex: '#1a1a1a', stock: 6, imageUrls: [IMG.vans_old] },
        { sku: 'VOS-BLK-39', size: 39, color: 'Negro', colorHex: '#1a1a1a', stock: 8, imageUrls: [IMG.vans_old] },
        { sku: 'VOS-BLK-41', size: 41, color: 'Negro', colorHex: '#1a1a1a', stock: 5, imageUrls: [IMG.vans_old] },
        { sku: 'VOS-WHT-40', size: 40, color: 'Blanco',colorHex: '#ffffff', stock: 4, imageUrls: [IMG.vans_old] },
      ],
    },

    // BASKETBALL — HOMBRE
    {
      name: 'Jordan 1 Retro High', slug: 'jordan-1-retro-high', brandId: jordan.id, categoryId: basketball.id,
      gender: 'man', price: 179.95, salePrice: null,
      description: 'La zapatilla que lo cambió todo. Diseño icónico de 1985 con Air-Sole y cuero premium.',
      thumbnailUrl: IMG.jordan_1, isActive: true,
      variants: [
        { sku: 'J1RH-BRD-40', size: 40, color: 'Bred',  colorHex: '#dc2626', stock: 2, imageUrls: [IMG.jordan_1] },
        { sku: 'J1RH-BRD-41', size: 41, color: 'Bred',  colorHex: '#dc2626', stock: 3, imageUrls: [IMG.jordan_1] },
        { sku: 'J1RH-BRD-42', size: 42, color: 'Bred',  colorHex: '#dc2626', stock: 1, imageUrls: [IMG.jordan_1] },
        { sku: 'J1RH-RYL-43', size: 43, color: 'Royal', colorHex: '#1d4ed8', stock: 2, imageUrls: [IMG.jordan_1] },
      ],
    },

    // TRAINING
    {
      name: 'Puma Suede Classic XXI', slug: 'puma-suede-classic-xxi', brandId: puma.id, categoryId: training.id,
      gender: 'unisex', price: 69.95, salePrice: 54.95,
      description: 'Gamuza suave, perfil bajo. El clásico de Puma que define el estilo urbano desde 1968.',
      thumbnailUrl: IMG.puma_suede, isActive: true,
      variants: [
        { sku: 'PSC-BLK-38', size: 38, color: 'Negro',   colorHex: '#1a1a1a', stock: 5, imageUrls: [IMG.puma_suede] },
        { sku: 'PSC-BLK-40', size: 40, color: 'Negro',   colorHex: '#1a1a1a', stock: 7, imageUrls: [IMG.puma_suede] },
        { sku: 'PSC-BLK-42', size: 42, color: 'Negro',   colorHex: '#1a1a1a', stock: 4, imageUrls: [IMG.puma_suede] },
        { sku: 'PSC-RED-40', size: 40, color: 'Rojo',    colorHex: '#dc2626', stock: 3, imageUrls: [IMG.puma_suede] },
        { sku: 'PSC-NVY-41', size: 41, color: 'Navy',    colorHex: '#1e3a8a', stock: 6, imageUrls: [IMG.puma_suede] },
      ],
    },
  ] as const;

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        brandId: p.brandId,
        categoryId: p.categoryId,
        gender: p.gender as any,
        price: p.price,
        salePrice: p.salePrice,
        description: p.description,
        thumbnailUrl: p.thumbnailUrl,
        isActive: p.isActive,
        variants: {
          create: p.variants.map((v) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            stock: v.stock,
            imageUrls: v.imageUrls,
          })),
        },
      },
    });
    process.stdout.write('.');
  }

  console.log('\n✅ Seed completado:');
  console.log(`   ${await prisma.brand.count()} marcas`);
  console.log(`   ${await prisma.category.count()} categorías`);
  console.log(`   ${await prisma.product.count()} productos`);
  console.log(`   ${await prisma.productVariant.count()} variantes`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
