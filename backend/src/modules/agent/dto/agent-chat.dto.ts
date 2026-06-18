import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';

export class AgentChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
