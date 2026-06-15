import { Controller, Get, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Get('me')
  syncMe(@Request() req: ExpressRequest) {
    return this.service.syncUser(req.supabaseUser!);
  }
}
