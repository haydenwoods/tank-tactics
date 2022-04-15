import { config } from "@/config";

import { CommandController } from "@/types/command";
import { GameStatus } from "@/types/game";
import { Direction } from "@/types/player";
import { Item } from "@/types/shop";

import { GameService } from "@/services/game";
import { PlayerService } from "@/services/player";

import { buildPlayerInfoEmbed } from "@/helpers/messages";

export class PlayerController {
  static move: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game does not exist");
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist within this game");
    }

    const direction = interaction.options.get("direction")?.value as Direction;
    const amount = (interaction.options.get("amount")?.value || 1) as number;

    await PlayerService.moveDirection({
      actionPlayer,
      game,
      direction,
      amount,
    });

    await interaction.reply(
      `${actionPlayer.user.username} has moved ${direction} ${amount} times`
    );
  };

  static shoot: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game in setup doesn't exist in this channel");
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist within this game");
    }

    const targetDiscordUser = interaction.options.get("player")?.user;
    const amount = (interaction.options.get("amount")?.value || 1) as number;

    if (!targetDiscordUser) {
      throw new Error("No target player given");
    }

    const targetPlayer = await PlayerService.findPlayerByGameAndDiscordId({
      gameId: game._id,
      discordId: targetDiscordUser.id,
    });

    if (!targetPlayer) {
      throw new Error("Target player does not exist within this game");
    }

    const { actualAmount, isNowDead } = await PlayerService.shootPlayer({
      actionPlayer,
      targetPlayer,
      amount,
    });

    await interaction.reply(
      `${actionPlayer.user.username} has shot ${targetPlayer.user.username} ${
        actualAmount > 1 ? `${actualAmount} times` : ""
      }`
    );

    if (isNowDead) {
      await interaction.followUp(`${targetPlayer.user.username} has died`);
      await interaction.followUp(
        `${actionPlayer.user.username} has been awarded all of ${targetPlayer.user.username}'s action points`
      );
    }
  };

  static give: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game does not exist");
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist within this game");
    }

    const targetDiscordUser = interaction.options.get("player")?.user;

    if (!targetDiscordUser) {
      throw new Error("No target player given");
    }

    const targetPlayer = await PlayerService.findPlayerByGameAndDiscordId({
      gameId: game._id,
      discordId: targetDiscordUser.id,
    });

    if (!targetPlayer) {
      throw new Error("Target player does not exist within this game");
    }

    const item = interaction.options.get("item")?.value as Item;
    const amount = interaction.options.get("amount")?.value as number;

    const parameters = {
      actionPlayer,
      targetPlayer,
      amount,
    };

    if (item === Item.ACTION_POINTS) {
      await PlayerService.giveActionPoints(parameters);
      await interaction.reply(
        `${actionPlayer.user.username} has given ${targetPlayer.user.username} ${amount} action points`
      );
    } else if (item === Item.HEALTH) {
      const { isActionPlayerDead, isTargetPlayerAlive } =
        await PlayerService.giveHealth(parameters);

      await interaction.reply(
        `${actionPlayer.user.username} has given ${targetPlayer.user.username} ${amount} health`
      );

      if (isActionPlayerDead) {
        await interaction.followUp(`${actionPlayer.user.username} has died`);
      }

      if (isTargetPlayerAlive) {
        await interaction.followUp(
          `${targetPlayer.user.username} has been revived`
        );
      }
    }
  };

  static buy: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game does not exist");
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist within this game");
    }

    const item = interaction.options.get("item")?.value as Item;
    const amount = (interaction.options.get("amount")?.value || 1) as number;

    await PlayerService.buyItem({ player: actionPlayer, item, amount });

    interaction.reply(
      `${actionPlayer.user.username} has bought ${amount} ${item}`
    );
  };

  static join: CommandController = async (
    interaction,
    { game, actionUser }
  ) => {
    if (!game) {
      throw new Error("Game does not exist");
    }

    if (game.status !== GameStatus.SETUP) {
      throw new Error("Game is not in setup");
    }

    if (game.players.length >= config.game.maximumPlayers) {
      throw new Error(
        `Game has a maximum of ${config.game.maximumPlayers} players`
      );
    }

    if (interaction.user.bot) {
      throw new Error("Bots are unable to join");
    }

    const doesExist = await PlayerService.findPlayerByGameAndDiscordId({
      gameId: game._id,
      discordId: actionUser.discordId,
    });

    if (doesExist) {
      throw Error("You already exist in this game");
    }

    await GameService.addPlayer({
      game,
      user: actionUser,
    });

    await interaction.reply(`${actionUser.username} has joined the game.`);
  };

  static leave: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game doesn't exist in this channel");
    }

    if (game.status !== GameStatus.SETUP) {
      throw new Error("Game is not in setup");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist in the game");
    }

    await GameService.removePlayer({ game, player: actionPlayer });

    await interaction.reply(`${actionPlayer.user.username} has left the game.`);
  };

  static displayMe: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game does not exist");
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error("Game does not exist");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist in this game");
    }

    const embed = buildPlayerInfoEmbed({
      player: actionPlayer,
      showPrivate: true,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  };

  static displayInfo: CommandController = async (
    interaction,
    { game, actionPlayer }
  ) => {
    if (!game) {
      throw new Error("Game does not exist");
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!actionPlayer) {
      throw new Error("You do not exist in this game");
    }

    const targetDiscordUser = interaction.options.get("player")?.user;

    if (!targetDiscordUser) {
      throw new Error("No target player given");
    }

    const targetPlayer = await PlayerService.findPlayerByGameAndDiscordId({
      discordId: targetDiscordUser.id,
      gameId: game._id,
    });

    if (!targetPlayer) {
      throw new Error("Target player does not exist in this game");
    }

    const embed = buildPlayerInfoEmbed({
      player: targetPlayer,
      showPrivate: false,
    });

    await interaction.reply({ embeds: [embed] });
  };
}
