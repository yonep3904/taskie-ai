import { Events } from "discord.js";
import { Env } from "@/lib/env";
import { OpenAIAIService } from "@/services/ai/openai";
import {
  getDiscordClient,
  loginDiscordClient,
} from "@/services/discord/client";
import { createMessageHandler } from "./handlers/on-message-create";
import { onReady } from "./handlers/on-ready";

const client = getDiscordClient();
const ai = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });

client.once(Events.ClientReady, onReady);
client.on(Events.MessageCreate, createMessageHandler(ai));

await loginDiscordClient();
