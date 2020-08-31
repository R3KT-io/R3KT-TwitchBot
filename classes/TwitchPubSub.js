const { PubSubClient, PubSubChatModActionMessage } = require('twitch-pubsub-client')
const { config } = require('../../../resources')
const { ApiClient } = require('twitch')
const { StaticAuthProvider } = require('twitch-auth')

const chalk = require('chalk')

class TwitchPubSub {
	pubSubClient
	modMessageListener

	constructor() {
        const clientId = twitchCreds.clientId
        const clientSecret = twitchCreds.clientSecret
        const authProvider = new StaticAuthProvider(clientId, accessToken)
        const apiClient = new ApiClient({ authProvider })
		this.pubSubClient = new PubSubClient()
	}

	async connect() {
        await pubSubClient.registerUserListener(apiClient)
        
        this.modMessageListener = await this.pubSubClient.onChatModActionMessage(userId, (message: PubSubChatModActionMessage) => {
            console.log(message)
        })
	}

}

module.exports = TwitchPubSub