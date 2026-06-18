import { Body, Controller, Headers, HttpCode, Post, ValidationPipe } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AgentService } from './agent.service';
import { AgentChatDto } from './dto/agent-chat.dto';

@Public()
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @HttpCode(200)
  chat(
    @Body(new ValidationPipe({ whitelist: true })) dto: AgentChatDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;

    return this.agentService.chat(dto, token);
  }
}
