const { config, language } = require('../../../resources')

async function amIModded(channel, chatClient) {
    // Check to see if the bot has proper perms on all the channels it's bound to
    const mods = await chatClient.getMods(channel)
        .catch(e => {
            console.log(chalk.yellow(`Failed to fetch mods for channel ${channel}: ${e}`))
        })

    // If we're not modded, let the streamer know
    return mods.indexOf(config.USERNAME) > -1
}

module.exports = amIModded