const mongoose = require('mongoose')

const Schema = mongoose.Schema

/**
 * Represents an events on a platform
 * this could be a ban, timeout, mute, etc.
 */
const Event = new Schema({
    time: Date,
    channel: {
        type: String,
        default: 'Global'
    },
    issuer: {
        type: String,
        default: 'Nobody'
    },
    offender: String,
    type: String,
    platform: {
        type: String,
        default: 'Unspecified'
    },
    reason: String,
    meta: Object
})

/**
 * Represents a channel our bot should track
 */
const Channel = new Schema({
    time: Date,
    platform: String,
    name: String,
    teams: Array,
    readOnly: {
        type: Boolean,
        default: true
    },
    followers: {
        type: Array,
        default: []
    }
})

/**
 * Represents a user containing information on linked channels
 */
const User = new Schema({
    time: Date,
    username: String,
    linkedAccounts: {
        twitch: {
            display_name: String
        }
    },
    team: String,
    teams: Array
})

/**
 * Represents a users preferences
 */
const Preference = new Schema({
    time: Date,
    user: String,
    banThreshold: Number,
    twitch: Object,
    teams: Object
})

/**
 * Represents a team
 */
const Team = new Schema({
    linkedUsers: Array,
    name: Number
})


module.exports = {
    Event: mongoose.models.Event || mongoose.model('Event', Event),
    Channel: mongoose.models.Channel || mongoose.model('Channel', Channel),
    User: mongoose.models.User || mongoose.model('User', User),
    Preference: mongoose.models.Preference || mongoose.model('Preference', Preference),
    Team: mongoose.models.Team || mongoose.model('Team', Team)
}