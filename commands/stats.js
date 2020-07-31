/**
 * Get statistics about R3KT bans & timeouts
 * on this channel and globally.
 * @param {String} channel channel requesting stats
 * @param {Object} chatClient reference to the chatClient
 */
async function stats(channel, chatClient) {
    const stats = await global.r3kt.twitchDBConn.getStats(channel)
    chatClient.rateLimitedRequest(() => {
        chatClient.say(
            channel,
            `Global: ${stats.globalBans}/${stats.globalTimeouts}/${stats.globalDeleted} BTD | Channel: ${stats.channelBans}/${stats.channelTimeouts}/${stats.globalDeleted} BTD`
        )
    })
}

module.exports = stats