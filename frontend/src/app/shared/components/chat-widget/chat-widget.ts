import {
  Component,
  ElementRef,
  SecurityContext,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { AgentApiService } from '../../../core/api/agent.api';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  html: SafeHtml | null;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-widget.html',
})
export class ChatWidgetComponent {
  private readonly agentApi = inject(AgentApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  readonly isOpen = signal(false);
  readonly loading = signal(false);
  readonly inputText = signal('');
  readonly messages = signal<ChatMessage[]>([]);
  readonly sessionId = signal<string | undefined>(undefined);

  readonly hasMessages = computed(() => this.messages().length > 0);

  readonly suggestions = [
    'Busco zapatillas de running',
    '¿Qué ofertas tenéis?',
    'Tallas disponibles en Nike',
  ];

  toggle() {
    this.isOpen.update((v) => !v);
  }

  useSuggestion(text: string) {
    this.inputText.set(text);
    void this.send();
  }

  async send() {
    const text = this.inputText().trim();
    if (!text || this.loading()) return;

    this.inputText.set('');
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', text, html: null, timestamp: new Date() },
    ]);
    this.loading.set(true);
    this.scrollToBottom();

    this.agentApi.chat({ message: text, sessionId: this.sessionId() }).subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            text: res.reply,
            html: this.toSafeHtml(res.reply),
            timestamp: new Date(),
          },
        ]);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: (err: { error?: { message?: string } }) => {
        const errText =
          err?.error?.message ?? 'Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.';
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'assistant', text: errText, html: null, timestamp: new Date() },
        ]);
        this.loading.set(false);
        this.scrollToBottom();
      },
    });
  }

  handleKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  handleMarkdownClick(event: MouseEvent | KeyboardEvent) {
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto')) return;

    event.preventDefault();
    void this.router.navigateByUrl(href);
  }

  private toSafeHtml(markdown: string): SafeHtml {
    const raw = marked.parse(markdown, { async: false }) as string;
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }
}
