// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ngEnv = (import.meta as any).env as Record<string, string>;

export const environment = {
  production: true,
  apiUrl: '/api/v1',
  supabaseUrl: ngEnv['NG_APP_SUPABASE_URL'] ?? '',
  supabaseAnonKey: ngEnv['NG_APP_SUPABASE_ANON_KEY'] ?? '',
  cloudinaryCloudName: ngEnv['NG_APP_CLOUDINARY_CLOUD_NAME'] ?? '',
  cloudinaryUploadPreset: ngEnv['NG_APP_CLOUDINARY_UPLOAD_PRESET'] ?? '',
  stripePublishableKey: ngEnv['NG_APP_STRIPE_PUBLISHABLE_KEY'] ?? '',
};
