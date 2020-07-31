const tmi = require('tmi.js');
const chalk = require('chalk')

const { config } = require('../../../resources')

class TMIAgregator {
	channels
	#client

	constructor() {
		this.client = new tmi.Client({
			connection: {
				secure: true,
				reconnect: true
			},
			channels: this.channels
		})
	}

	async connect() {
		if (config.LOG) {
			console.log(chalk.magenta(`««« Establishing connection to Twitch (TMI Aggregator)`))
			console.time(chalk.magenta(`««« Connected to Twitch (TMI Aggregator)`))
		}
		this.channels = await global.r3kt.twitchDBConn.getChannels()
		this.client.connect().then(() => this.parse())
	}

	parse() {
		if (config.LOG) {
            console.timeEnd(chalk.magenta(`««« Connected to Twitch (TMI Aggregator)`))
		}

		this.client.on("mod", (channel, username) => {
			console.log('MOD', channel, username)
			if (username.toLowerCase() == config.USERNAME) {
				//TODO: The main bot needs to be notified to join the channel when this happens
				global.r3kt.twitchDBConn.toggleReadOnly(channel, false)
			}
		})

		this.client.on("unmod", (channel, username) => {
			console.log('UNMOD', channel, username)
			if (username.toLowerCase() == config.USERNAME) {
				//TODO: The main bot needs to be notified to leave the channel when this happens
				global.r3kt.twitchDBConn.toggleReadOnly(channel, true)
			}
		})
	}
}

module.exports = TMIAgregator