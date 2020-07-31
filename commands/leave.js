const chalk = require('chalk')
const usernameUtil = require('../../utils/usernames')

const { language } = require('../../../resources')

/**
 * Signup to beta
 * @param {String} user user requesting to leave
 * @param {Object} chatClient reference to the chat client
 */
async function leave(channel, user, chatClient) {
    if (usernameUtil.strip(user) != usernameUtil.strip(channel)) {
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, language.BROADCASTER_ONLY)
        })
        return
    }
    await global.r3kt.twitchDBConn.leave(user)
    chatClient.rateLimitedRequest(() => {
        chatClient.say(channel, language.TWITCH.LEAVE_CHANNEL)
    })
    chatClient.rateLimitedRequest(() => {
        chatClient.part(user)
        console.log(chalk.blue(`Left ${usernameUtil.strip(user)}'s channel`))
    })
}

module.exports = leave