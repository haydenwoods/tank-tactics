import { Client } from "discord-slash-commands-client";

import { config } from "../config";

import { commands } from "../commands";

export const sleep = async (ms: number) => new Promise(r => setTimeout(r, ms));

export const index = async () => {
  const { token, applicationId } = config.bot;
  const { guildId } = config.commands;

  console.log("Updating commands");
  console.log("Scope: ", guildId ? "Guild" : "Global");
  
  if (!token || !applicationId) {
    throw new Error("No token or application id");
  }

  const client = new Client(token, applicationId);

  for (const command of Object.values(commands)) {
    const updatedCommand = await client.createCommand(command.data, guildId);

    console.log("Updated command > ", updatedCommand);
      
    await sleep(5000);
  }

  console.log("Updates finished");
};

index();