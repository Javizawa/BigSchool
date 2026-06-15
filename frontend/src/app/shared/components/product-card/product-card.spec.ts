import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Product } from '../../../core/models';
import { ProductCardComponent } from './product-card';

const baseProduct: Product = {
  id: 'prod-1',
  name: 'Air Max 90',
  slug: 'air-max-90',
  brand: { id: 'b1', name: 'Nike', slug: 'nike', logoUrl: null },
  category: { id: 'c1', name: 'Running', slug: 'running', imageUrl: null },
  gender: 'MEN',
  price: 120,
  salePrice: null,
  saleEndsAt: null,
  thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  averageRating: null,
  reviewCount: 0,
  isActive: true,
  createdAt: new Date().toISOString(),
};

async function setup(product: Product = baseProduct): Promise<ComponentFixture<ProductCardComponent>> {
  await TestBed.configureTestingModule({
    imports: [ProductCardComponent],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductCardComponent);
  fixture.componentRef.setInput('product', product);
  fixture.detectChanges();
  return fixture;
}

describe('ProductCardComponent', () => {
  it('renders the product name', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Air Max 90');
  });

  it('renders the brand name', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Nike');
  });

  it('shows product thumbnail when thumbnailUrl is set', async () => {
    const fixture = await setup();
    const img: HTMLImageElement | null = fixture.nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.alt).toBe('Air Max 90');
  });

  it('shows SALE badge when salePrice is set', async () => {
    const fixture = await setup({ ...baseProduct, salePrice: 99 });
    expect(fixture.nativeElement.textContent).toContain('SALE');
  });

  it('does not show SALE badge when there is no salePrice', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).not.toContain('SALE');
  });

  it('shows rating when reviewCount is greater than 0', async () => {
    const fixture = await setup({ ...baseProduct, averageRating: 4.5, reviewCount: 10 });
    expect(fixture.nativeElement.textContent).toContain('4.5');
    expect(fixture.nativeElement.textContent).toContain('(10)');
  });

  it('hides rating section when there are no reviews', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).not.toContain('★');
  });

  it('links to the product detail page', async () => {
    const fixture = await setup();
    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/products/prod-1');
  });
});
