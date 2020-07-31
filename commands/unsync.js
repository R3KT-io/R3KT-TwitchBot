const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')

/**
 * Unsync from a specific channel, after execution
 * you will no longer autoban users from the sync'd channel
 * @param {*} channel channel to unsync bans from
 * @param {*} message original message from mod
 * @param {*} chatClient referece to the chat client
 */
async function unsync(channel, message, chatClient) {
    const splitMessage = message.split(" ")
    if (splitMessage[1]) {
        const toUnSync = `#${usernameUtil.strip(splitMessage[1])}`
        const status = await global.r3kt.twitchDBConn.unSync(channel, toUnSync)
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, `${status} ${usernameUtil.strip(toUnSync)}`)
        })
    } else {
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, language.PROVIDE_CHANNEL)
        })
    }
}

module.exports = unsync