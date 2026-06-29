import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type User } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentChatDto } from './dto/agent-chat.dto';
import {
  ADMIN_TOOLS,
  AgentToolsExecutor,
  PUBLIC_TOOLS,
  ToolDefinition,
  ToolName,
  USER_TOOLS,
} from './agent.tools';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

interface Session {
  messages: Message[];
  updatedAt: Date;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos
const MAX_TOOL_ITERATIONS = 5;
const SYSTEM_PROMPT = `Eres el asistente virtual de Love4Sneakers, una tienda online especializada en zapatillas deportivas y lifestyle.

## Tu misión
Ayudar a los clientes a encontrar las zapatillas perfectas, resolver dudas sobre productos y pedidos, y hacer recomendaciones personalizadas basadas en datos reales.

## Límites estrictos de tema
Solo puedes responder preguntas relacionadas con: zapatillas, productos del catálogo, tallas, precios, marcas, pedidos, envíos, devoluciones y el funcionamiento de la tienda Love4Sneakers.
Si el usuario pregunta cualquier otra cosa (programación, cocina, política, entretenimiento, etc.), responde ÚNICAMENTE con una variación de: "Solo puedo ayudarte con temas relacionados con Love4Sneakers y nuestras zapatillas. ¿En qué puedo ayudarte?" — sin desarrollar ni dar pistas sobre el tema solicitado.

## Reglas de uso de herramientas (OBLIGATORIAS)
- SIEMPRE usa una herramienta antes de responder sobre productos, precios, tallas o disponibilidad. Nunca inventes datos.
- Si el usuario menciona una marca, categoría, talla, precio o tipo de zapatilla → llama a search_products.
- Si el usuario pregunta por un producto concreto que ya apareció en la conversación → llama a get_product_details para obtener stock y variantes exactas.
- Si muestras un producto y el usuario parece interesado → llama a recommend_products para sugerir alternativas.
- Si el usuario pregunta por su pedido → llama a get_order_status con el ID que indique.
- Para preguntas vagas como "¿qué tenéis?" o "¿qué es lo más vendido?" → llama a search_products con limit=5 sin filtros, o con los filtros que se puedan inferir.

## Formato de respuesta para productos
Cuando muestres productos, usa SIEMPRE este formato por producto:
**[Nombre]** — [Precio] €
Tallas disponibles: [lista separada por comas]
Colores: [lista]
[Ver producto →](/products/[slug])

Si hay precio de oferta, muéstralo como: ~~[precio original]~~ **[precio oferta] €**

## Otras reglas
- Responde siempre en el mismo idioma que el usuario.
- Sé conciso: máximo 4 productos por respuesta salvo que el usuario pida más.
- Si el usuario pide algo que requiere autenticación y no está logueado, indícalo amablemente y sugiere que inicie sesión.
- No menciones IDs internos, UUIDs ni detalles técnicos al usuario.
- Formatea los precios con coma decimal (89,95 €), no con punto.
- NUNCA narres el uso de herramientas en tu respuesta. No escribas frases como "voy a buscar", "llamo a search_products", "esto me devuelve" ni similares. Presenta los resultados directamente, como si ya los conocieras.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly groq: Groq;
  private readonly sessions = new Map<string, Session>();
  private readonly toolsExecutor: AgentToolsExecutor;
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey)
      this.logger.warn('GROQ_API_KEY no configurada — el agente no funcionará');

    this.groq = new Groq({ apiKey });
    this.toolsExecutor = new AgentToolsExecutor(prisma);
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
    );

    // Limpiar sesiones expiradas cada 15 minutos
    setInterval(() => this.pruneSessions(), 15 * 60 * 1000);
  }

  async chat(dto: AgentChatDto, bearerToken?: string) {
    const { supabaseId, role } = await this.resolveAuth(bearerToken);
    const tools = this.selectTools(role);
    const sessionId = dto.sessionId ?? randomUUID();
    const session = this.getOrCreateSession(sessionId);

    session.messages.push({ role: 'user', content: dto.message });
    session.updatedAt = new Date();

    const toolsUsed: ToolName[] = [];

    try {
      const reply = await this.runAgentLoop(
        session.messages,
        tools,
        toolsUsed,
        supabaseId,
      );
      session.messages.push({ role: 'assistant', content: reply });

      return { reply, sessionId, toolsUsed };
    } catch (err) {
      // Eliminamos el mensaje de usuario para no dejar la sesión en mal estado
      session.messages.pop();
      throw err;
    }
  }

  private async runAgentLoop(
    messages: Message[],
    tools: ToolDefinition[],
    toolsUsed: ToolName[],
    supabaseId?: string,
  ): Promise<string> {
    const history = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages,
    ];

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      let response: ChatCompletion;
      try {
        response = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: history as Parameters<
            typeof this.groq.chat.completions.create
          >[0]['messages'],
          tools: tools,
          tool_choice: 'auto',
          temperature: 0.3,
          max_tokens: 1024,
        });
      } catch (err: unknown) {
        const error = err as {
          status?: number;
          error?: { error?: { code?: string } };
        };
        this.logger.error('Groq API error', error);

        if (error.status === 429) {
          throw new HttpException(
            'Límite de peticiones alcanzado. Inténtalo de nuevo en unos segundos.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        // El modelo generó argumentos inválidos para una herramienta — reintentamos sin herramientas
        if (
          error.status === 400 &&
          error.error?.error?.code === 'tool_use_failed'
        ) {
          this.logger.warn('tool_use_failed — reintentando sin herramientas');
          const fallback = await this.groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: history as Parameters<
              typeof this.groq.chat.completions.create
            >[0]['messages'],
            tool_choice: 'none',
            temperature: 0.3,
            max_tokens: 1024,
          });
          return (
            fallback.choices[0].message.content ??
            'Lo siento, no pude generar una respuesta.'
          );
        }

        throw new ServiceUnavailableException(
          'El servicio de IA no está disponible temporalmente.',
        );
      }

      const choice = response.choices[0];

      if (
        choice.finish_reason === 'stop' ||
        !choice.message.tool_calls?.length
      ) {
        return (
          choice.message.content ?? 'Lo siento, no pude generar una respuesta.'
        );
      }

      // El modelo quiere llamar herramientas
      history.push({
        role: 'assistant',
        content: choice.message.content ?? '',
        ...(choice.message.tool_calls && {
          tool_calls: choice.message.tool_calls,
        }),
      } as unknown as Message);

      for (const toolCall of choice.message.tool_calls) {
        const toolName = toolCall.function.name as ToolName;
        let toolArgs: Record<string, unknown> = {};

        try {
          toolArgs = JSON.parse(toolCall.function.arguments) as Record<
            string,
            unknown
          >;
        } catch {
          this.logger.warn(`Argumentos inválidos para herramienta ${toolName}`);
        }

        this.logger.debug(`Ejecutando herramienta: ${toolName}`, toolArgs);

        const result = await this.toolsExecutor.execute(
          toolName,
          toolArgs,
          supabaseId,
        );

        if (!toolsUsed.includes(toolName)) toolsUsed.push(toolName);

        history.push({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
          name: toolName,
        });
      }
    }

    // Si se agotaron las iteraciones, pedimos respuesta sin más herramientas
    const finalResponse = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: history as Parameters<
        typeof this.groq.chat.completions.create
      >[0]['messages'],
      temperature: 0.3,
      max_tokens: 1024,
    });

    return (
      finalResponse.choices[0].message.content ??
      'No pude completar la solicitud.'
    );
  }

  private async resolveAuth(
    token?: string,
  ): Promise<{ supabaseId?: string; role: 'anonymous' | 'user' | 'admin' }> {
    if (!token) return { role: 'anonymous' };

    try {
      const result = (await this.supabase.auth.getUser(token)) as {
        data: { user: User | null };
        error: unknown;
      };
      const user: User | null = result.data.user;
      if (!user) return { role: 'anonymous' };
      const appMeta = user.app_metadata as Record<string, unknown>;
      const userMeta = user.user_metadata as Record<string, unknown>;
      const isAdmin =
        appMeta?.['role'] === 'ADMIN' || userMeta?.['role'] === 'ADMIN';
      return { supabaseId: user.id, role: isAdmin ? 'admin' : 'user' };
    } catch {
      return { role: 'anonymous' };
    }
  }

  private selectTools(role: 'anonymous' | 'user' | 'admin'): ToolDefinition[] {
    if (role === 'admin') return ADMIN_TOOLS;
    if (role === 'user') return USER_TOOLS;
    return PUBLIC_TOOLS;
  }

  private getOrCreateSession(sessionId: string): Session {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { messages: [], updatedAt: new Date() });
    }
    return this.sessions.get(sessionId)!;
  }

  private pruneSessions() {
    const cutoff = new Date(Date.now() - SESSION_TTL_MS);
    for (const [id, session] of this.sessions) {
      if (session.updatedAt < cutoff) this.sessions.delete(id);
    }
    this.logger.debug(`Sesiones activas: ${this.sessions.size}`);
  }
}
