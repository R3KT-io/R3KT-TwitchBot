const chalk = require('chalk')
const { config, language } = require('../../../resources')

/**
 * When a ban happens, check to see if there are any channels that
 * are auto sync'd, return a list of all sync'd channels
 * @param {String} channel channel to check for subscribers on
 * @param {String} user user to ban on subscribers channels
 * @param {Object} chatClient reference to the chat client
 */
async function checkAutoSync(channel, user, chatClient, unban = false) {
    const subscribers = await global.r3kt.twitchDBConn.getAutoSyncFollowers(channel)
    subscribers.forEach(async c => {
        if (unban) {
            chatClient.rateLimitedRequest(() => {
                chatClient.say(c, `/unban ${user}`)
            })
        } else {
            chatClient.rateLimitedRequest(async () => {
                const isBanned = await global.r3kt.twitchDBConn.isBanned(user, c)
                if (!isBanned)
                    chatClient.ban(c, user, `${config.USERNAME} ${language.BANSYNC} ${channel.replace('#', '@')}`)
                        .catch(_ => {
                            if (config.LOG)
                                console.log(chalk.gray(`${user} already banned from ${c}`))
                        })
            })
        }
    })
}

module.exports = checkAutoSync