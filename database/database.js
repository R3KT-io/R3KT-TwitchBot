const mongoose = require('mongoose');
const chalk = require('chalk')

const { uri } = require('../../../secure/database')
const { config } = require('../../../resources');
const usernameUtil = require('../../utils/usernames')

const language = require('../../../resources/language');

// Load and register schemas
require('./schemas')

class Database {
    connected = false
    Event = null
    Channel = null

    /**
     * Represents a new database handler
     * @constructor
     */
    constructor() {
        if (config.LOG) {
            console.time(chalk.green(config.BOTS.TWITCH.PREFIX + " »»» Connected to MongoDB"))
            console.log(chalk.green(config.BOTS.TWITCH.PREFIX + " ««« Establishing MongoDB connection"))
        }

        mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(() => {
            this.startup()
        })
    }

    /**
     * Schema binding, and other startup tasks
     * @method
     */
    startup() {
        this.connected = true
        // Register Models
        this.Event = mongoose.model('Event')
        this.Channel = mongoose.model('Channel')
        // Startup complete
        if (config.LOG)
            console.timeEnd(chalk.green(config.BOTS.TWITCH.PREFIX + " »»» Connected to MongoDB"))
    }

    /**
     * Check if we're connected to the remote database
     * @method
     * @returns {Boolean} returns wether or not we're connected to the DB
     */
    isConnected() {
        return this.connected
    }

    /**
     * Write a new event to the database
     * @param {String} channel Channel the event happened on
     * @param {String} user The user whom triggered the event
     * @param {String} offender The actor in the event
     * @param {String} type The type of event
     * @param {String} reason The reason this event was triggered
     * @param {String} meta Additional info about the event
     */
    newEvent(channel, user = 'Automod', offender, type, reason = 'Unspecified', meta) {
        console.log(chalk.gray(`${type}: ${user} on ${channel}`))

        const newEvent = new this.Event({
            time: Date.now(),
            platform: config.PLATFORMS.TWITCH,
            issuer: user,
            channel: usernameUtil.strip(channel),
            offender: usernameUtil.strip(offender),
            type,
            reason,
            meta: {
                eventMeta: meta
            }
        })

        newEvent.save((err) => {
            if (err) console.warn('Error saving event to database!', newEvent)
        })
    }

    /**
     * Join a new channel into our database
     * @param {String} channel Channel to add to the database
     * @returns {String} returns status message
     */
    async join(channel) {
        const existingChannel = await this.Channel.findOne({
            name: usernameUtil.strip(channel)
        })
        if (existingChannel != null) {
            return language.ALREADY_SIGNED_UP
        }
        const newChannel = new this.Channel({
            time: Date.now(),
            platform: config.PLATFORMS.TWITCH,
            name: channel,
            readOnly: true
        })

        newChannel.save((err) => {
            if (err) console.warn('Error saving channel data to database!', newChannel)
        })
        return language.JOINED
    }

    /**
     * Leave a channel channel update our database
     * @param {String} channel Channel to remove from the database
     * @returns {String} returns status message
     */
    async leave(channel) {
        return this.Channel.deleteOne({ name: usernameUtil.strip(channel) })
            .catch(e => {
                if (e) console.warn('Error removing channel from the database!', channel)
            })
    }

    /**
     * Autosync allows a channel to subscribe to the bans of another channel
     * and it will automatically sync the ban to all followers of the main channel
     * @param {String} follower channel which wishes to follow the bans
     * @param {String} channel channel which the bans will be followed on
     * @returns {String} returns status message
     */
    async autoSync(follower, channel) {
        const existingChannel = await this.Channel.findOne({
            platform: 'TWITCH',
            name: usernameUtil.strip(channel)
        })
        follower = usernameUtil.strip(follower)
        if (existingChannel != null) {
            if (!existingChannel.followers.includes(follower)) {
                existingChannel.followers = [...existingChannel.followers, follower]
                await existingChannel.save((err) => {
                    if (err) console.warn('Error saving sync data to database!', existingChannel)
                })
                return language.AUTOSYNC
            } else {
                return language.ALREADY_SYNCED
            }
        } else {
            return language.TWITCH.NOT_USING_R3KT
        }
    }

    /**
     * Removes auto ban sync of follower on specified channel
     * @param {String} follower follower to unsync
     * @param {String} channel channel to unfollow from
     * @returns {String} returns status message
     */
    async unSync(follower, channel) {
        const existingChannel = await this.Channel.findOne({
            platform: 'TWITCH',
            name: usernameUtil.strip(channel)
        })
        follower = usernameUtil.strip(follower)
        if (existingChannel != null) {
            existingChannel.followers = existingChannel.followers
                .filter(ch => ch !== follower)
            await existingChannel.save((err) => {
                if (err) console.warn('Error saving sync data to database!', existingChannel)
            })
            return language.UNSYNCED;
        }
    }

    /**
     * Toggle the read-only status of a specified channel
     * @param {String} channel channel to toggle read only status on
     * @param {Boolean} state the state at which to toggle it to
     */
    async toggleReadOnly(channel, state) {
        const channelToToggle = await this.Channel
            .findOne({ name: usernameUtil.strip(channel) })
        channelToToggle.readOnly = state
        channelToToggle.save(err => {
            if (err) console.warn('Error saving channel data to database!', channelToToggle)
        })
    }

    /**
     * Checks wether a specified channel is read only or not
     * @param {String} name name of the channel to check
     * @returns {Boolean} returns if channel is read only
     */
    async isReadOnly(name) {
        const c = await this.Channel
            .findOne({ name: usernameUtil.strip(name) })
        if (c) return c.readOnly
        return true
    }

    /**
     * Checks wether a user is banned on a channel
     * @param {String} user user to check
     * @param {String} channel channel to check
     * @returns {Boolean} returns if the user is banned
     */
    async isBanned(user, channel) {
        channel = usernameUtil.strip(channel)
        user = usernameUtil.strip(user)
        const ban = await this.Event
            .findOne({
                channel,
                type: 'BAN',
                offender: user,
                platform: 'TWITCH'
            })
        return ban != null
    }

    /**
     * Get a list of staticstics both globally, and on the specified channel
     * @param {String} channel channel to get statistics on
     * @returns {Object} list of stats
     */
    async getStats(channel) {
        const channelBans = await this.Event.where({ channel, type: 'BAN' }).countDocuments().exec()
        const channelTimeouts = await this.Event.where({ channel, type: 'TIMEOUT' }).countDocuments().exec()
        const channelDeleted = await this.Event.where({ channel, type: 'DELETE_MESSAGE' }).countDocuments().exec()
        const globalBans = await this.Event.where({ type: 'BAN' }).countDocuments().exec()
        const globalTimeouts = await this.Event.where({ type: 'TIMEOUT' }).countDocuments().exec()
        const globalDeleted = await this.Event.where({ type: 'DELETE_MESSAGE' }).countDocuments().exec()

        return {
            channelBans,
            channelTimeouts,
            channelDeleted,
            globalBans,
            globalTimeouts,
            globalDeleted
        }
    }

    /**
     * Get a list of bans on a specific channel
     * @param {String} channel channel to check bans on
     * @param {String} platform platform to check for bans on
     * @param {Number} limit amount of bans to check
     * @returns {Array} returns an array
     */
    async getBans(channel, platform, limit = 999) {
        const query = { channel, type: 'BAN' }
        if (platform != null) query.platform = platform
        const channelBans = await this.Event.find(query).limit(limit)
        return channelBans
    }

    /**
     * Get all channels, if supplied you can get them by their
     * read only status. Or just get all channels.
     * @param {Boolean} readOnly status of read only
     * @returns {Array} returns an array of channels
     */
    async getChannels(readOnly = false) {
        const query = {}
        if (readOnly) query.readOnly = false
        const channels = await this.Channel.find(query)
        const channelNames = []
        channels.forEach(c => {
            channelNames.push(c.name)
        })
        return channelNames
    }

    /**
     * Find events for a specified user
     * @param {String} user User to find events
     * @param {String} type Type of event to filter by (optional)
     * @returns {Array} returns array of events
     */
    async getEvents(user, type) {
        const query = { offender: utils.usernameUtil.strip(user) }
        if (type != null) query.type = type
        const events = await this.Event.find(query)
        return events
    }

    /**
     * Get a list of the followers of a specified channel
     * @param {String} channel channel to look for followers on
     * @returns {Array} returns an array of followers
     */
    async getAutoSyncFollowers(channel) {
        const existingChannel = await this.Channel.findOne({
            platform: 'TWITCH',
            name: usernameUtil.strip(channel)
        })
        if (existingChannel != null)
            return existingChannel.followers
        return []
    }
}

module.exports = Database