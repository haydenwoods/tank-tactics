import { GameStatus } from "@/types/game";
import { ICommand } from "@/types/command";

import { findPlayerByGameAndDiscordId, getPlayerInfo } from "@/services/player";
import { findGame } from "@/services/game";
import { buildPlayerInfoEmbed } from "@/helpers/messages";

export const me: ICommand = {
  data: {
    "name": "me",
    "description": "Show your player info for the current Tank Tactics game.",
  },
  execute: async (interaction) => {
    const { channelId } = interaction;
    const discordUser = interaction.user;

    const game = await findGame({ 
      channelId, 
      status: GameStatus.IN_PROGRESS 
    });

    if (!game) {
      throw new Error("Game does not exist");
    }
    
    const actionPlayer = await findPlayerByGameAndDiscordId({ 
      discordId: discordUser.id,
      gameId: game._id,
    });

    if (!actionPlayer) {
      throw new Error("You do not exist in this game");
    }

    const playerInfo = getPlayerInfo({ 
      actionPlayer, 
      targetPlayer: actionPlayer 
    });

    const embed = buildPlayerInfoEmbed({ 
      player: actionPlayer, 
      playerInfo 
    });

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
