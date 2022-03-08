import { Client } from "discord.js";

import { logHandler } from "./utils/logHandler";

(async () => {
  const bot = new Client({ intents: ["GUILDS", "GUILD_PRESENCES"] });

  bot.on("ready", () => {
    logHandler.log("debug", "Discord bot connected!");
    bot.user?.setActivity("Naomi's presence.", { type: "WATCHING" });
  });

  await bot.login(process.env.BOT_TOKEN);
})();
