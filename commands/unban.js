const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')


const {
    checkAutoSync
} = require('../jobs')
/**
 * Unsync from a specific channel, after execution
 * you will no longer autoban users from the sync'd channel
 * @param {*} channel channel to unsync bans from
 * @param {*} message original message from mod
 * @param {*} chatClient referece to the chat client
 */
async function unban(channel, message, chatClient) {
    const splitMessage = message.split(" ")
    if (splitMessage[1]) {
        const toUnban = `${usernameUtil.strip(splitMessage[1])}`
        checkAutoSync(usernameUtil.strip(channel), toUnban, chatClient, true)
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, `/unban ${toUnban}`)
        })
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, `Unbanned ${toUnban} on your channel, and all channels that sync to you.`)
        })
    } else {
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, language.PROVIDE_USER)
        })
    }
}

module.exports = unban