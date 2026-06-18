import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AgentChatRequest {
  message: string;
  sessionId?: string;
}

export interface AgentChatResponse {
  reply: string;
  sessionId: string;
  toolsUsed: string[];
}

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/agent/chat`;

  chat(body: AgentChatRequest) {
    return this.http.post<AgentChatResponse>(this.url, body);
  }
}
