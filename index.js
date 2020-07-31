const chalk = require('chalk')

const Database = require('./database/database')
const { language } = require("../../resources")

const TwitchCommands = require("./classes/TwitchCommands")
const TMIAggregator = require("./classes/TMIAggregator")

global.r3kt = {
    twitchDBConn: new Database()
}

// We want to wait for the database connection before attempting
// so that we can properly get channels and log events
const start = async () => {
    // Whatever is here will be executed as soon as the script is loaded.
    if (global.r3kt.twitchDBConn.isConnected()) {
        new TwitchCommands().start()
        return
    }
    console.log(chalk.yellow(language.DB_PENDING))
    setTimeout(start, 500)
}
start()