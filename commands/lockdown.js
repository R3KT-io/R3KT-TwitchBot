const chalk = require('chalk')
const { config, language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')

/**
 * Sync bans with another channel (this will ban all users the other channel has banned)
 * This may need to be revisited later if we get rate-limited
 * @param {String} channel channel to sync bans with
 * @param {String} message original chat message
 * @param {Object} chatClient reference to the chat client
 */
async function lockdown(channel, message, chatClient) {
    // TODO:
    // Switch the chat to follower for 5 hours chat
    // Clear chat history
    // Notify chat
    chatClient.rateLimitedRequest(() => {
        chatClient.enableFollowersOnly(channel, config.TWITCH.LOCKDOWN_FOLLOWER_TIME)
    })
    chatClient.rateLimitedRequest(() => {
        chatClient.clear(channel)
    })
    chatClient.rateLimitedRequest(() => {
        chatClient.say(
            channel,
            language.LOCKDOWN
        )
    })
}

module.exports = lockdown