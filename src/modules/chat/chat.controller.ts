import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';

/**
 * Read-only chat browsing for CraftX's opt-in history import.
 *
 * Both endpoints read from whatsapp-web.js's already-synced local Store
 * (getChats / fetchMessages) — there is no number enumeration or sending here,
 * which keeps them on the low-risk side of WhatsApp automation.
 */
@ApiTags('chats')
@Controller('sessions/:sessionId/chats')
export class ChatController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: 'List 1:1 chats from the local store (groups excluded)' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'List of chat summaries' })
  async list(@Param('sessionId') sessionId: string) {
    const engine = this.getEngine(sessionId);
    return engine.getChats();
  }

  @Get(':chatId/history')
  @ApiOperation({ summary: 'Read the last N messages of one chat (text + metadata only)' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'chatId', description: 'Chat ID, e.g. 4917...@c.us' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max messages (default 100)' })
  @ApiResponse({ status: 200, description: 'Chat history' })
  async history(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
  ) {
    const engine = this.getEngine(sessionId);
    const parsed = limit ? Number(limit) : 100;
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 100;
    return engine.getChatHistory(chatId, safeLimit);
  }

  private getEngine(sessionId: string) {
    const engine = this.sessionService.getEngine(sessionId);
    if (!engine) {
      throw new Error('Session is not started');
    }
    return engine;
  }
}
