import type { User } from '@supabase/supabase-js';

declare module 'express' {
  interface Request {
    supabaseUser?: User;
    user?: User;
  }
}
