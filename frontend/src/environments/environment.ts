declare const __env: Record<string, string> | undefined;

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  supabaseUrl: typeof __env !== 'undefined' ? (__env['NG_APP_SUPABASE_URL'] ?? '') : '',
  supabaseAnonKey: typeof __env !== 'undefined' ? (__env['NG_APP_SUPABASE_ANON_KEY'] ?? '') : '',
  cloudinaryCloudName: typeof __env !== 'undefined' ? (__env['NG_APP_CLOUDINARY_CLOUD_NAME'] ?? '') : '',
  cloudinaryUploadPreset: typeof __env !== 'undefined' ? (__env['NG_APP_CLOUDINARY_UPLOAD_PRESET'] ?? '') : '',
  stripePublishableKey: typeof __env !== 'undefined' ? (__env['NG_APP_STRIPE_PUBLISHABLE_KEY'] ?? '') : '',
};
