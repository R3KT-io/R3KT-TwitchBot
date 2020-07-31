const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')

/**
 * Add a subscriber to the autosync channel
 * @param {String} channel channel to sync bans with
 * @param {String} message original chat message
 * @param {Object} chatClient reference to the chat client
 */
//TODO: there should be some kind of preventative measure here to prevent ping-ponging between channels
async function autosync(follower, message, chatClient) {
    const splitMessage = message.split(" ")
    if (splitMessage[1] != 'team') {
        const channel = usernameUtil.strip(splitMessage[1])
        const status = await global.r3kt.twitchDBConn.autoSync(follower, channel)
        chatClient.rateLimitedRequest(() => {
            chatClient.say(follower, `${status} ${usernameUtil.strip(channel)}`)
        })
    } else if (splitMessage[1] == 'team') {

    } else {
        chatClient.rateLimitedRequest(() => {
            chatClient.say(follower, language.PROVIDE_CHANNEL)
        })
    }
}

module.exports = autosync