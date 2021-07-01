/**
 * * bot.js
 * * This is Main Program for bot, run this with nodejs
 * * Made by @Leomotors
 */

const auth = require("./auth.json")
const logconsole = require("./utils/logconsole")

const Discord = require("discord.js")

const client = new Discord.Client()
client.on("ready", () => {
    console.log(`[LOGIN SUCCESS] Successfully logged in as ${client.user.tag}.`)
})

client.login(auth.token)

// * DEBUG ZONE

const readline = require("readline") // * Module for debug only

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.on('line', (input) => {
    debug(input)
})

function debug(commandstr) {
    let command = commandstr.split(" ")
    switch (command[0]) {
        case "logout":
            client.destroy()
            logconsole("Successfully safely logged out", "LOGOUT")
            process.exit(0)
        default:
            logconsole(`Unknown Command "${command[0]}"`, "DEBUG-ERROR")
    }
}