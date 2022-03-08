import { createWriteStream } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

import { Activity, PresenceStatus } from "discord.js";
import fetch from "node-fetch";
import nodeHtmlToImage from "node-html-to-image";

import { Cache } from "../interfaces/Cache";

import { parseTimestamp } from "./parseTimestamp";

const colours = {
  invisible: "#747F8D",
  offline: "#747F8D",
  dnd: "#ED4245",
  online: "#3BA55D",
  idle: "#FAA81A",
};

/**
 * Module to parse the activity data and generate an image.
 *
 * @param {Activity} activity The activity data from Discord.
 * @param {string} state The user's state, such as online.
 * @param {Cache} cache The cached large and small images.
 */
export const compilePresenceImage = async (
  activity: Activity | undefined,
  state: PresenceStatus,
  cache: Cache
) => {
  if (state === "offline") {
    const html = `
<div id="container" style="background-color:#3a3240;color:#aea8d3;width:600px;border-radius:10px;padding:10px;">
    <div style="display:grid;grid-template-columns: 150px auto;">
        <img src="https://cdn.nhcarrigan.com/profile-transparent.png" width="120px" style="border-radius:50%;border:5px solid ${colours[state]};" />
        <div>
            <p style="font-weight:bold;font-family:Helvetica;font-size:20px">Naomi</p>
            <p style="font-family:Helvetica">Is currently <span style="font-style:italic">offline</span>
        </div>
    </div>
</div>      
`;
    await nodeHtmlToImage({
      html,
      output: join(process.cwd(), "assets", "state.png"),
      selector: "#container",
      transparent: true,
    });
    return;
  }
  if (!activity) {
    const html = `
<div id="container" style="background-color:#3a3240;color:#aea8d3;width:600px;border-radius:10px;padding:10px;">
	<div style="display:grid;grid-template-columns: 150px auto;">
		<img src="https://cdn.nhcarrigan.com/profile-transparent.png" width="120px" style="border-radius:50%;border:5px solid ${colours[state]};" />
		<div>
			<p style="font-weight:bold;font-family:Helvetica;font-size:20px">Naomi</p>
			<p style="font-family:Helvetica">Is currently <span style="font-style:italic">online</span>
		</div>
	</div>

	<hr style="border:2px solid #aea8d3" />
	
	<p style="font-family:Helvetica">But not at her computer...</p>
</div>
`;
    await nodeHtmlToImage({
      html,
      output: join(process.cwd(), "assets", "state.png"),
      selector: "#container",
      transparent: true,
    });
    return;
  }
  if (activity.assets) {
    if (cache.large !== activity.assets.largeImage) {
      cache.large = activity.assets.largeImage || "";
      fetch(
        `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.largeImage}`
      ).then((res) =>
        res.body.pipe(
          createWriteStream(join(process.cwd(), "assets", "large.png"))
        )
      );
    }

    if (cache.small !== activity.assets.smallImage) {
      cache.small = activity.assets.smallImage || "";
      fetch(
        `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.smallImage}`
      ).then((res) =>
        res.body.pipe(
          createWriteStream(join(process.cwd(), "assets", "small.png"))
        )
      );
    }
  }

  const smallImage = await readFile(join(process.cwd(), "assets", "small.png"));
  const largeImage = await readFile(join(process.cwd(), "assets", "large.png"));
  const base64Small = smallImage.toString("base64");
  const base64Large = largeImage.toString("base64");

  const html = `
<body style="background:transparent;">

<div id="container" style="background-color:#3a3240;color:#aea8d3;width:600px;border-radius:10px;padding:10px;">
  <div style="display:grid;grid-template-columns: 150px auto;">
      <img src="https://cdn.nhcarrigan.com/profile-transparent.png" width="120px" style="border-radius:50%;border:5px solid ${
        colours[state]
      };" />
      <div>
          <p style="font-weight:bold;font-family:Helvetica;font-size:20px">Naomi</p>
          <p style="font-family:Helvetica">Is currently <span style="font-style:italic">${state}</span>
      </div>
  </div>

  <hr style="border:2px solid #aea8d3" />
  
  <div style="display:grid;grid-template-columns:100px auto;margin-bottom:-30px;">
      <div>
          <img src="{{largeImage}}" width="90px" />
          <img src="{{smallImage}}" style="position:relative;top:-25px;left:70px;border-radius:50%;" width="30px" />
      </div>
      <div style="font-family:Helvetica;align-self:center;margin-bottom:30px;margin-left:20px;">
          <p style="font-weight:bold;margin:0;">Naomi is on her computer!</p>
          <p style="margin:0;">${activity.details}</p>
          <p style="margin:0;">${activity.state}</p>
          <p style="margin:0;">for ${parseTimestamp(
            activity.createdTimestamp
          )}</p>
      </div>
  </div>
</div>
</body>
  `;

  await nodeHtmlToImage({
    html,
    output: join(process.cwd(), "assets", "state.png"),
    selector: "#container",
    transparent: true,
    content: {
      largeImage: "data:image/png;base64," + base64Large,
      smallImage: "data:image/png;base64," + base64Small,
    },
  });
};
