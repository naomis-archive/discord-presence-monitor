import { readFile } from "fs/promises";
import http from "http";
import https from "https";
import { join } from "path";

import cors from "cors";
import { Client } from "discord.js";
import express from "express";

import { Cache } from "./interfaces/Cache";
import { compilePresenceImage } from "./utils/compilePresenceImage";
import { errorHandler } from "./utils/errorHandler";
import { logHandler } from "./utils/logHandler";

(async () => {
  const cache: Cache = { large: "", small: "" };

  /* Bot Code */
  const bot = new Client({ intents: ["GUILDS", "GUILD_PRESENCES"] });

  bot.on("ready", () => {
    logHandler.log("debug", "Discord bot connected!");
    bot.user?.setActivity("Naomi's presence.", { type: "WATCHING" });
  });

  await bot.login(process.env.BOT_TOKEN);

  /* Server Code */
  const app = express();

  app.use(
    cors({
      origin: "*",
    })
  );

  app.use(express.static(join(__dirname, "../assets")));

  app.get("/", async (_, res) => {
    try {
      const guild = await bot.guilds.fetch(process.env.GUILD_ID as string);
      const naomi = await guild.members.fetch(process.env.NAOMI_ID as string);
      const naomiPresence = naomi.presence;

      if (!naomiPresence) {
        await compilePresenceImage(undefined, "offline", cache);
        res.sendFile(join(process.cwd(), "assets", "offline.png"));
        return;
      }

      const targetPresence = naomiPresence.activities.find(
        (el) => el.applicationId === process.env.PRESENCE_ID
      );

      await compilePresenceImage(targetPresence, naomiPresence.status, cache);

      res.sendFile(join(process.cwd(), "assets", "state.png"));
    } catch (err) {
      errorHandler("index route", err);
      res.json(err);
    }
  });

  app.get("/uptime", (_, res) => {
    res.send("Hello!");
  });

  const httpServer = http.createServer(app);

  httpServer.listen(5080, () => {
    logHandler.log("http", "http server listening on port 5080");
  });

  if (process.env.NODE_ENV === "production") {
    const privateKey = await readFile(
      "/etc/letsencrypt/live/rpc.nhcarrigan.com/privkey.pem",
      "utf8"
    );
    const certificate = await readFile(
      "/etc/letsencrypt/live/rpc.nhcarrigan.com/cert.pem",
      "utf8"
    );
    const ca = await readFile(
      "/etc/letsencrypt/live/rpc.nhcarrigan.com/chain.pem",
      "utf8"
    );

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca,
    };

    const httpsServer = https.createServer(credentials, app);

    httpsServer.listen(5443, () => {
      logHandler.log("http", "https server listening on port 5443");
    });
  }
})();
