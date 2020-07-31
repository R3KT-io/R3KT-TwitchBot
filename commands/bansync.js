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
async function bansync(channel, message, chatClient) {
    const splitMessage = message.split(" ")
    if (splitMessage[1]) {
        const toSync = usernameUtil.strip(usernameUtil.strip(splitMessage[1]))
        const bans = await global.r3kt.twitchDBConn.getBans(toSync)
        let offenders = []
        bans.forEach(ban => offenders.push(ban.offender))
        offenders = [...new Set(offenders)]
        chatClient.rateLimitedRequest(() => {
            chatClient.say(
                channel,
                `Syncing ${offenders.length} ban(s) with @${toSync}`
            )
        })
        offenders.forEach(async offender => {
            const isBanned = await global.r3kt.twitchDBConn.isBanned(offender, channel)
            if (!isBanned) {
                chatClient.rateLimitedRequest(() => {
                    chatClient.ban(channel, offender, `${config.USERNAME} ${language.BANSYNC} @${toSync}`)
                        .then(() => {
                            if (config.LOG)
                                console.log(chalk.gray(`Banning ${offender} from ${channel}.`))
                        })
                        .catch(_ => {
                            if (config.LOG)
                                console.log(chalk.gray(`${offender} already banned from ${channel}`))
                        })
                })
            }
        })
    } else {
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, language.PROVIDE_CHANNEL)
        })
    }
}

module.exports = bansync