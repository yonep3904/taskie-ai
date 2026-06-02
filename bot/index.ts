import { Events } from "discord.js";
import { Env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpenAIAIService } from "@/services/ai/openai";
import { ChatService } from "@/services/chat";
import { ConversationService } from "@/services/conversation";
import { createDiscordClient } from "@/services/discord/client";
import { DiscordSenderService } from "@/services/discord/sender";
import { ExtractionService } from "@/services/extraction";
import { TaskService } from "@/services/task";
import { UserService } from "@/services/user";
import { MessageHandler } from "./handlers/on-message-create";
import { onReady } from "./handlers/on-ready";

const supabase = createAdminClient();
const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });

const userService = new UserService(supabase);
const conversationService = new ConversationService(supabase);
const taskService = new TaskService(supabase);
const extractionService = new ExtractionService(aiService);
const chatService = new ChatService(aiService);

const client = createDiscordClient();
const discordSenderService = new DiscordSenderService(client);

const messageHandler = new MessageHandler(
  userService,
  conversationService,
  taskService,
  extractionService,
  chatService,
  discordSenderService,
);

client.once(Events.ClientReady, onReady);
client.on(Events.MessageCreate, (message) => messageHandler.handle(message));

await client.login(Env.api.discordBotToken);
