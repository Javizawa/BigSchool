// Generates environment.prod.ts with values from process.env at build time.
// Runs as prebuild step on Vercel so Angular compiles the values as constants.
const fs = require('fs');
const path = require('path');

const get = (key) => process.env[key] || '';

const content = `export const environment = {
  production: true,
  apiUrl: '${get('NG_APP_API_URL')}',
  supabaseUrl: '${get('NG_APP_SUPABASE_URL')}',
  supabaseAnonKey: '${get('NG_APP_SUPABASE_ANON_KEY')}',
  cloudinaryCloudName: '${get('NG_APP_CLOUDINARY_CLOUD_NAME')}',
  cloudinaryUploadPreset: '${get('NG_APP_CLOUDINARY_UPLOAD_PRESET')}',
  stripePublishableKey: '${get('NG_APP_STRIPE_PUBLISHABLE_KEY')}',
};
`;

fs.writeFileSync(
  path.join(__dirname, '../src/environments/environment.prod.ts'),
  content
);

console.log('environment.prod.ts generado con variables de entorno.');
