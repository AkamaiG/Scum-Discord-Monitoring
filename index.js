import { Client, Intents } from 'discord.js';
import axios from 'axios';

import { botConfig } from './config.js';

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const botData = {
  interval: null,
};

export default class DiscordModule {
  static init() {
    const isReadyStart = this.checkSettings();
    if (!isReadyStart.status) {
      console.log(isReadyStart.text);
      return;
    }

    console.log(isReadyStart.text);

    this.startDiscordBot();
  }

  static checkSettings() {
    if (!botConfig.scumServerId) {
      return { status: false, text: '[Error]: The server ID from monitoring is not specified in the config!' };
    }

    if (!botConfig.discordBotToken) {
      return { status: false, text: '[Error]: Discord bot token not specified in config!' };
    }

    if (!botConfig.intervalUpdateTime) {
      return { status: false, text: '[Error]: Update time interval not specified!' };
    }

    if (botConfig.intervalUpdateTime <= 1) {
      return { status: false, text: '[Error]: The interval time should not be less than 1 minute!' };
    }

    return { status: true, text: '[Bot]: Ready!\n[Bot]: Best regards, Akamai!' };
  }

  static startDiscordBot() {
    client.once('ready', () => {
      this.updateBotPresence();
      botData.interval = setInterval(() => {
        try {
          this.updateBotPresence();
          console.log('[Bot]: Update bot status...');
        } catch (error) {
          console.log('[Error]:');
          console.log(error);
        }
      }, 60000 * parseInt(botConfig.intervalUpdateTime, 10));
    });

    client.login(botConfig.discordBotToken);
  }

  static async getServerOnlineCountMSG() {
    return await axios.get(`https://api.scum-global.com/server?id=${parseInt(botConfig.scumServerId, 10)}`)
    .then((response) => {
        return response.data.data;
    })
    .catch((error) => {
        console.log('[Error]: Monitoring Scum Global:');
        console.log(error);
    })
  }

  static async updateBotPresence() {
    try {
      let text = 'Loading...';

      const SCUMonitorData = await this.getServerOnlineCountMSG();
      if (SCUMonitorData) {
        text = `${SCUMonitorData.currentPlayers}/${SCUMonitorData.maxPlayers} @ ${SCUMonitorData.timeOfDay}`;
      }

      client.user?.setActivity(text, { type: "WATCHING" });
    } catch (error) {
      console.log('[Error] updateBotPresence:');
      console.log(error);
    }
  }
}

DiscordModule.init();
