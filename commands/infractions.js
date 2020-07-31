const usernameUtil = require('../../utils/usernames')

/**
 * Get statistics about R3KT bans & timeouts
 * on this channel and globally.
 * @param {String} user user to lookup
 * @param {Object} chatClient reference to the chatClient
 */
async function infractions(channel, message, chatClient) {
    const splitMessage = message.split(" ")
    if (splitMessage[1]) {
        const toLookup = `${usernameUtil.strip(splitMessage[1])}`

        const bans = await global.r3kt.twitchDBConn.getEvents(toLookup, 'BAN')
        const timeouts = await global.r3kt.twitchDBConn.getEvents(toLookup, 'TIMEOUT')
        const deletedMessages = await global.r3kt.twitchDBConn.getEvents(toLookup, 'DELETE_MESSAGE')

        chatClient.rateLimitedRequest(() => {
            chatClient.say(
                channel,
                `We've recorded ${bans.length} ban(s), ${timeouts.length} timeout(s) and ${deletedMessages.length} deleted message(s) on @${toLookup}.`
            )
        })
    }
}

module.exports = infractions