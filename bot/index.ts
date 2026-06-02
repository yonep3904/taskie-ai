import { Events } from "discord.js";
import { Env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpenAIAIService } from "@/services/ai";
import { ChatService, ExtractionService } from "@/services/chat";
import {
  ConversationService,
  MemoryService,
  TaskService,
  UserService,
} from "@/services/db";
import { createDiscordClient, DiscordSenderService } from "@/services/discord";
import { MessageHandler } from "@/services/handler";
import { onReady } from "./handlers/on-ready";

const supabase = createAdminClient();
const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });

const userService = new UserService(supabase);
const conversationService = new ConversationService({}, supabase);
const taskService = new TaskService(supabase);
const memoryService = new MemoryService(supabase);
const extractionService = new ExtractionService(aiService);
const chatService = new ChatService(aiService);

const discord = createDiscordClient();
const discordSenderService = new DiscordSenderService(discord);

const messageHandler = new MessageHandler(
  userService,
  conversationService,
  taskService,
  memoryService,
  extractionService,
  chatService,
  discordSenderService,
);

discord.once(Events.ClientReady, onReady);
discord.on(Events.MessageCreate, (message) => messageHandler.handle(message));

await discord.login(Env.api.discordBotToken);
