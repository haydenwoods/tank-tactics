import mongoose from "mongoose";
import { Client } from "discord.js";

import { config } from "@/config";
import { commands } from "@/commands";

const MONGO_URL = "mongodb://localhost:27017";

mongoose.connect(
  MONGO_URL,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => {
    console.log("Database connected");
  }
);

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
  partials: ["CHANNEL"],
});

client.once("ready", () => {
  console.log("Tank Tactics has started");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (!Object.keys(commands).includes(commandName)) return;

  try {
    await commands[commandName].execute(interaction);
  } catch (error) {
    return interaction.reply({
      content: error?.message || "Unknown error has occured",
      ephemeral: true,
    });
  }
});

client.login(config.bot.token);