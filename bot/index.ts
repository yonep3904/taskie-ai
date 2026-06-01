import { Events } from "discord.js";
import {
  getDiscordClient,
  loginDiscordClient,
} from "@/services/discord/client";
import { onMessageCreate } from "./handlers/on-message-create";
import { onReady } from "./handlers/on-ready";

const client = getDiscordClient();

client.once(Events.ClientReady, onReady);
client.on(Events.MessageCreate, onMessageCreate);

await loginDiscordClient();
