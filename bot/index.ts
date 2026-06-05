import { Events } from "discord.js";
import { Env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpenAIAIService } from "@/services/ai";
import { ChatService, ExtractionService, FileService } from "@/services/chat";
import { ContextService } from "@/services/chat/context";
import {
  ConversationService,
  MemoryService,
  TaskService,
  UserService,
} from "@/services/db";
import { createDiscordClient, DiscordSenderService } from "@/services/discord";
import { MessageHandler, ProactiveHandler } from "@/services/handler";
import { onReady } from "./handlers/on-ready";
import { startScheduler } from "./scheduler";

const supabase = createAdminClient();
const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });

const userService = new UserService(supabase);
const conversationService = new ConversationService({}, supabase);
const taskService = new TaskService(supabase);
const memoryService = new MemoryService(supabase);
const extractionService = new ExtractionService(aiService);
const chatService = new ChatService(aiService);
const fileService = new FileService();

const contextService = new ContextService(
  conversationService,
  taskService,
  memoryService,
  extractionService,
);

const discord = createDiscordClient();
const discordSenderService = new DiscordSenderService(discord);

const messageHandler = new MessageHandler(
  userService,
  conversationService,
  contextService,
  chatService,
  fileService,
  discordSenderService,
);

const proactiveHandler = new ProactiveHandler(
  {},
  userService,
  contextService,
  chatService,
  discordSenderService,
);

discord.once(Events.ClientReady, onReady);
discord.on(Events.MessageCreate, (message) => messageHandler.handle(message));

await discord.login(Env.api.discordBotToken);

// ログイン完了後にスケジューラーを起動（Discord クライアントが使える状態で開始）
startScheduler(proactiveHandler);
