const fs = require('fs')
const chalk = require('chalk')

const { config } = require('../../../resources')

const twitchCreds = require('../../../secure/twitch/twitch-creds')

const {
    checkAutoSync
} = require('../jobs')

const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch').default
const { ChatClient } = require('twitch-chat-client')

const { customBanMessage } = require('../easterEggs')

const RateLimiter = require('../../abstracts/RateLimiter')


class TwitchMinimal extends RateLimiter {
    // Publics
    channels = []
    requestQueue = []
    // Privates
    #socket = null
    #auth = null
    #chatClient = null

    /**
     * Represents a Twitch Chatbot.
     * @constructor
     * @param {channels} channels - List of channels to subscribe to.
     */
    constructor() {
        super(config.TWITCH.RATE_LIMIT, config.TWITCH.TIME)
    }

    start() {
        this.auth()
            .then(() => this.bind())
    }

    /**
     * Authenticate to Twitch API
     * @async
     * @method
     */
    async auth() {
        if (config.LOG) {
            console.log(chalk.magenta(`««« Establishing connection to Twitch`))
            console.time(chalk.magenta(`»»» Authentecated with Twitch`))
            console.log(chalk.magenta(`««« Authenticating with Twitch`))
        }
        const clientId = twitchCreds.clientId;
        const clientSecret = twitchCreds.clientSecret;
        const tokenData = JSON.parse(await fs.readFileSync('./secure/twitch/twitch-tokens.json', 'UTF-8'));

        // Use the refreshable auth provider to prevent manual token generation.
        this.auth = new RefreshableAuthProvider(
            new StaticAuthProvider(
                clientId,
                tokenData.accessToken
            ),
            {
                clientSecret,
                refreshToken: tokenData.refreshToken,
                expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
                onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
                    const newTokenData = {
                        accessToken,
                        refreshToken,
                        expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
                    }
                    await fs.writeFileSync('./secure/twitch/twitch-tokens.json', JSON.stringify(newTokenData, null, 4), 'UTF-8')
                }
            }
        );
    }

    async connectChatClient() {
        this.channels = await global.r3kt.twitchDBConn.getChannels(false)

        if (this.chatClient && this.chatClient.isConnected)
            await this.chatClient.quit()

        const clientOpts = { channels: this.channels }
        if (config.VERBOSE) clientOpts.logger = { minLevel: 'debug' }

        this.chatClient = new ChatClient(this.auth, clientOpts)
        this.chatClient.rateLimitedRequest = method => this.addToQueue(method)

        await this.chatClient.connect().catch(e => {
            console.log(chalk.red(`Failed to connect to Twitch: ${e}`))
        })
    }

    /**
     * Bind to Twitch IRC notifications with the authed creds
     * This will parse out different events sent from Twitch
     * and dispatch them to the appropriot handlers.
     * @async
     * @method
     */
    async bind() {
        if (config.LOG) {
            console.timeEnd(chalk.magenta(`»»» Authentecated with Twitch`))
            console.time(chalk.magenta(`»»» Connected to Twitch`))
        }

        await this.connectChatClient()

        // If the bot disconnects, attempt to reconnect automatically
        this.chatClient.onDisconnect((manually, reason) => {
            console.log(chalk.red("Disconnected from Twitch, reconnecting..."))
            this.chatClient.reconnect().then(() => {
                console.log(chalk.magenta(`»»» Connected to Twitch`))
            }).catch(e => {
                console.log(chalk.yellow(`Couldn't reconnect: ${e}`))
            })
        })

        if (config.LOG)
            console.timeEnd(chalk.magenta(`»»» Connected to Twitch`))


        // When a user is banned, record the incident in the DB
        this.chatClient.onBan((channel, user) => {
            global.r3kt.twitchDBConn.newEvent(
                channel,
                'System',
                user,
                'BAN',
                'Generic Twitch ban.'
            )
            checkAutoSync(channel, user, this.chatClient)
            customBanMessage(channel, user, this.chatClient)
        })

        // When a user is timed out, record the incident in the DB
        this.chatClient.onTimeout((channel, user, _) => {
            global.r3kt.twitchDBConn.newEvent(
                channel,
                'System',
                user,
                'TIMEOUT',
                'Generic Twitch timeout.'
            )
        })


        // When a message is deleted on a channel
        this.chatClient.onMessageRemove((channel, messageId, msg) => {
            const user = msg.tags.get('login')
            global.r3kt.twitchDBConn.newEvent(
                channel,
                'System',
                user,
                'DELETE_MESSAGE',
                'Generic Twitch message deletion.',
                msg.message.value
            )
        })
    }
}

module.exports = TwitchMinimal