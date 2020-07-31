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

mongoose.model('Event', Event)
mongoose.model('Channel', Channel)

module.exports = {
    Event,
    Channel
}