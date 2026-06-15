// E2E tests require a running server with DB.
// Prisma 7 generates an ESM client incompatible with Jest/CJS NestJS.
// Full E2E suite will be added once endpoints are implemented with supertest + mocked Prisma.

describe('BigSchool API (e2e)', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
