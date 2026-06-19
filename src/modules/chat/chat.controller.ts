import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';

/**
 * Read-only chat history for CraftX's opt-in WhatsApp history import.
 *
 * The chat *list* (`GET /sessions/:id/chats`) is already provided natively by the
 * upstream SessionController, so only the per-chat history endpoint lives here — it
 * reads from whatsapp-web.js's already-synced local Store (fetchMessages), with no
 * number enumeration or sending, which keeps it on the low-risk side of WhatsApp
 * automation.
 */
@ApiTags('chats')
@Controller('sessions/:sessionId/chats')
export class ChatController {
  constructor(private readonly sessionService: SessionService) {}

  @Get(':chatId/history')
  @ApiOperation({ summary: 'Read the last N messages of one chat (text + metadata only)' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'chatId', description: 'Chat ID, e.g. 4917...@c.us' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max messages (default 100)' })
  @ApiResponse({ status: 200, description: 'Chat history' })
  @ApiResponse({ status: 400, description: 'Session is not started' })
  async history(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
  ) {
    const engine = this.sessionService.getEngine(sessionId);
    if (!engine) {
      throw new BadRequestException('Session is not started');
    }
    const parsed = limit ? Number(limit) : 100;
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 100;
    return engine.getChatHistory(chatId, safeLimit);
  }
}
