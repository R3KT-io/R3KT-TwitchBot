const TwitchMinimal = require('./TwitchMinimal')

const {
    autosync, unsync,
    bansync, stats, join, leave,
    infractions, lockdown, unban
} = require('../commands')

const {
    amIModded
} = require('../utils')

const language = require('../../../resources/language')

class TwitchCommands extends TwitchMinimal {
    /**
     * Represents a Twitch Chatbot.
     * @constructor
     * @param {channels} channels - List of channels to subscribe to.
     */
    constructor() {
        super()
    }

    start() {
        this.auth()
            .then(() => this.bind()
            .then(() => {
                this.chatClient.onPrivmsg((channel, user, message, payload) => {
                    this.handleMsg(channel, user, message, payload)
                })
            }))
    }

    /**
     * Get a list of the channels we're listening to
     * @method
     * @returns Retruns array of channels the bot is subscribed to
     */
    get getChannels() {
        return this.channels
    }

    /**
     * Handles messages and dispatches them to the correct methods
     * @param {*} channel Channel the message was sent in
     * @param {*} user  User that sent the message
     * @param {*} message The message in plain text that was sent
     * @param {*} payload The entire message object from Twitch
     */
    handleMsg(channel, user, message, payload) {
        if (payload.userInfo.isMod || payload.userInfo.isBroadcaster)
            this.modCommands(...arguments)
        this.commands(...arguments)
    }

    /**
     * A list of commands that moderators and up have access to
     * We will parse the command sent and dispatch to the correct
     * handler (stored under /src/twitch/commands)
     * @param {String} channel Channel the message was sent in
     * @param {String} user  User that sent the message
     * @param {String} message The message in plain text that was sent
     * @param {Object} payload The entire message object from Twitch
     * @param {Object} cc reference to the Chat Client connection
     */
    async modCommands(channel, user, message, payload) {
        const isReadOnly = await global.r3kt.twitchDBConn.isReadOnly(channel)
        if (!isReadOnly) {
            if (message.startsWith("!bansync")) bansync(channel, message, this.chatClient)
            if (message.startsWith("!autosync")) autosync(channel, message, this.chatClient)
            if (message.startsWith("!unsync")) unsync(channel, message, this.chatClient)
            if (message.startsWith("!stats")) stats(channel, this.chatClient)
            if (message.startsWith("!infractions")) infractions(channel, message, this.chatClient)
            if (message.startsWith("!lockdown")) lockdown(channel, message, this.chatClient)
            if (message.startsWith("!unban")) unban(channel, message, this.chatClient)
            if (message.startsWith("!r3kt leave")) leave(channel, user, this.chatClient)
        } else {
            // TODO: Check if I have mod permissions, if so update the DB and run the command again
            const isModded = await amIModded(channel, this.chatClient)
            if (!isModded) {
                this.chatClient.rateLimitedRequest(() => {
                    this.chatClient.say(channel, language.NOT_MODDED)
                })
            } else {
                await global.r3kt.twitchDBConn.toggleReadOnly(channel, false)
                this.modCommands(...arguments)
            }
        }
    }

    commands(channel, user, message, payload, cc) {
        if (message.startsWith("!r3kt join") || message.startsWith("!r3ktjoin"))
            join(channel, user, this.chatClient)
    }
}

module.exports = TwitchCommands