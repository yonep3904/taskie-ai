import { Events } from "discord.js";
import { Env } from "@/lib/env";
import { GeminiAIService } from "@/services/ai/gemini";
import {
  getDiscordClient,
  loginDiscordClient,
} from "@/services/discord/client";
import { createMessageHandler } from "./handlers/on-message-create";
import { onReady } from "./handlers/on-ready";

const client = getDiscordClient();
const ai = new GeminiAIService({ apiKey: Env.api.geminiApiKey });

client.once(Events.ClientReady, onReady);
client.on(Events.MessageCreate, createMessageHandler(ai));

await loginDiscordClient();
