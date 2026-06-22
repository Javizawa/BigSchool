export const environment = {
  production: true,
  apiUrl: import.meta.env.NG_APP_API_URL ?? '',
  supabaseUrl: import.meta.env.NG_APP_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.NG_APP_SUPABASE_ANON_KEY ?? '',
  cloudinaryCloudName: import.meta.env.NG_APP_CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryUploadPreset: import.meta.env.NG_APP_CLOUDINARY_UPLOAD_PRESET ?? '',
  stripePublishableKey: import.meta.env.NG_APP_STRIPE_PUBLISHABLE_KEY ?? '',
};
