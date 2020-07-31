const {
    config
} = require('../../../resources')

function customBanMessage(channel, user, chatClient) {
    const rand = Math.random();
    const message = config.CUSTOM_BAN_MESSAGES[Math.floor(Math.random() * config.CUSTOM_BAN_MESSAGES.length)];

    if (rand < 0.05)
        chatClient.rateLimitedRequest(() => {
            chatClient.say(channel, message.replace('{user}', user))
        })
}

module.exports = customBanMessage