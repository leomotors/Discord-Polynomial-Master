/**
 * * bot.js
 * * This is Main Program for bot, run this with nodejs
 * * Made by @Leomotors
 */

const auth = require("./auth.json")
const logconsole = require("./utils/logconsole")
const { exec } = require("child_process")

const Discord = require("discord.js")

const client = new Discord.Client()
client.on("ready", () => {
    console.log(`[LOGIN SUCCESS] Successfully logged in as ${client.user.tag}.`)
})

client.login(auth.token)

client.on("message", eval_msg)

class Gaym {
    constructor() {
        this.questions_dict = undefined
        this.questions = undefined
        this.count = -1
        this.index = 0
        this.ready = false
    }

    init(channel) {
        exec(`./polygen 20 3 2 10 noice __JSON_MODE__`, (error, stdout, stderr) => {
            this.questions_dict = JSON.parse(stdout)
            this.questions = Object.keys(this.questions_dict.questions)
            this.count = this.questions.length
            this.ready = true
            this.ask(channel)
        })
    }

    ask(channel) {
        channel.send(this.questions[this.index])
        this.index++
    }
}

let current_gaym = undefined
function eval_msg(msg) {
    if (msg.author.id == client.user.id) {
        // * It's your own message!
        return
    }

    logconsole(`Recieve message from ${msg.author.tag} : ${msg.content}`)

    if (msg.content.startsWith("!challenge")) {
        msg.channel.send(`<@!${msg.author.id}> you dare challenge me?`)
        current_gaym = new Gaym()
        current_gaym.init(msg.channel)
        return
    }

    if (current_gaym)
    {
        current_gaym.ask(msg.channel)
    }
}


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