const chalk = require('chalk')
const usernameUtil = require('../../utils/usernames')

/**
 * join a channel
 * @param {String} user user requesting to join
 * @param {Object} chatClient reference to the chat client
 */
async function join(channel, user, chatClient) {
    const joinStatus = await global.r3kt.twitchDBConn.join(user)
    chatClient.rateLimitedRequest(() => {
        chatClient.say(channel, `${joinStatus} @${usernameUtil.strip(user)}`)
        chatClient.join(user).then(() => {
            console.log(chalk.blue(`Connected to ${usernameUtil.strip(user)}'s channel`))
        })
    })
}

module.exports = join