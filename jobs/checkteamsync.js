const chalk = require('chalk')
const { config, language } = require('../../../resources')

/**
 * When a ban happens, check to see if there are any channels that
 * are auto sync'd, return a list of all sync'd channels
 * @param {String} channel channel to check for subscribers on
 * @param {String} user user to ban on subscribers channels
 * @param {Object} chatClient reference to the chat client
 */
async function checkTeamSync(channel, user, chatClient, unban = false) {
    const streamersR3ktUser = await global.r3kt.twitchDBConn.getUser(channel)
    if (streamersR3ktUser) {
        const teams = streamersR3ktUser.teams
        if (teams)
            teams.forEach(async t => {
                const teamMembers = await global.r3kt.twitchDBConn.getTeamMembers(t)
                teamMembers.forEach(async teamMember => {
                    // Check for global preferences
                    if (teamMember && !unban) {
                        const r3ktUser = await global.r3kt.twitchDBConn.getUserById(teamMember)
                        let preferences = false
                        if (r3ktUser) preferences = await global.r3kt.twitchDBConn.getPreferences(teamMember)
                        if (preferences && preferences.teams.sync) {
                            if (r3ktUser.linkedAccounts && r3ktUser.linkedAccounts.twitch) {
                                const c = r3ktUser.linkedAccounts.twitch.display_name.toLowerCase()
                                const shouldBan = await global.r3kt.twitchDBConn.isBannedInXStreams(
                                    user, 
                                    await global.r3kt.twitchDBConn.getTeamChannelNames(t),
                                    parseInt(preferences.teams.banThreshold) || preferences.banThreshold
                                )
                                if (shouldBan) chatClient.rateLimitedRequest(async () => {
                                    const isBanned = await global.r3kt.twitchDBConn.isBanned(user, c)
                                    console.log(chalk.gray(`TEAM BAN: ${user} on ${c}`))
                                    if (!isBanned)
                                        chatClient.ban(c, user, `${config.USERNAME} ${language.TEAMSYNC} ${channel.replace('#', '@')}`)
                                            .catch(_ => {
                                                if (config.LOG)
                                                    console.log(chalk.gray(`${user} already banned from ${c}`))
                                            })
                                })
                            }
                        }
                    } else if (unban) {
                        chatClient.rateLimitedRequest(() => {
                            chatClient.say(c, `/unban ${user}`)
                            console.log(chalk.gray(`UNBAN: ${user} on #${c}`))
                        })
                        global.r3kt.twitchDBConn.newEvent(
                            c,
                            'System',
                            user,
                            'UNBAN',
                            'Generic Twitch unban.'
                        )
                    }
                })
            })
    }
}

module.exports = checkTeamSync