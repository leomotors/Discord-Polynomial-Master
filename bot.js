/**
 * * bot.js
 * * This is Main Program for bot, run this with nodejs
 * * Made by @Leomotors
 */

// * Importing important stuff
const auth = require("./auth.json")
const logconsole = require("./utils/logconsole.js")
const words = require("./assets/json/words.json")
const activity = require("./assets/json/activity.json")
const randomfrom = require("./utils/randomfrom.js")

const { exec } = require("child_process")

// * Discord Setup
const Discord = require("discord.js")

const client = new Discord.Client()
client.on("ready", () => {
    console.log(`[LOGIN SUCCESS] Successfully logged in as ${client.user.tag}.`)
    client.user.setActivity(`${activity.activity.name}`, { type: activity.activity.type })
    console.log("==========> BOT READY <==========")
})

client.login(auth.token)

client.on("message", eval_msg)

// * Class for handling a game
class Gaym {
    constructor() {
        this.index = -1
        this.score = 0
        this.ready = false
    }

    init(msg) {
        exec(`./polygen 20 1 2 10 noice __JSON_MODE__`, (error, stdout, stderr) => {
            let parsed_stdout = JSON.parse(stdout)
            this.questions_dict = parsed_stdout.questions
            this.difficulty = parsed_stdout.difficulty
            this.questions = Object.keys(this.questions_dict)
            this.player = msg.author
            this.count = this.questions.length
            this.ready = true
            //this.start = Date.now()

            msg.channel.send(`Beginning a gaym! with difficulty of ${this.difficulty}`)
            logconsole(`Starting a gaym with ${msg.author.tag} and difficulty of ${this.difficulty}`, "GAYM START")

            this.ask(msg.channel)
        })
    }

    ask(channel) // * Move to next question and ask
    {
        this.index++
        let questionmsg = (this.index + 1).toString() + ") Plz solve "
            + this.questions[this.index] + " = 0"
        channel.send(questionmsg)
        logconsole(`Gave ${this.player.tag} question #${this.index + 1}`, "GAYM")
    }

    is_correct(ans_str) {
        let ans_array = ans_str.split(" ")
        let key_array = this.questions_dict[this.questions[this.index]]

        let correct = true
        if (ans_array.length != key_array.length) {
            correct = false
        }
        else {
            for (let ans of ans_array) {
                if (!key_array.includes(ans)) {
                    correct = false;
                }
            }
        }

        return correct
    }

    checkanswer(msg) // * Check answer of current question
    {
        if (this.is_correct(msg.content)) {
            msg.channel.send("OOH YEAH CORRECT!")
            logconsole(`${this.player.tag} get this right!`, "GAYM")
            this.score += 1
        }
        else {
            let key_array = this.questions_dict[this.questions[this.index]]
            msg.channel.send(`You SUCC, correct is ${key_array}`)
            logconsole(`${this.player.tag} get this WRONG!`, "GAYM")
        }
    }

    finalize(msg) {
        msg.channel.send(`Challenge Completed! With difficulty of ${this.difficulty}, **You scored ${this.score}/${this.count}**`)
        logconsole(`Challenge with ${this.player.tag} ended, scored ${this.score}/${this.count}`, "GAYM")

        if (this.score < 5) {
            msg.channel.send(randomfrom(words.end_game.noob_msg))
            msg.channel.send(randomfrom(words.end_game.noob_pic))
        }
        else if (this.score < 8) {
            msg.channel.send(randomfrom(words.end_game.intermediate_msg))
            msg.channel.send(randomfrom(words.end_game.intermediate_pic))
        }
        else {
            msg.channel.send(randomfrom(words.end_game.god_msg))
            msg.channel.send(randomfrom(words.end_game.god_pic))
        }
    }

    igiveup(msg) {
        msg.channel.send(`Challenge Aborted! **You scored ${this.score}**`)
        msg.channel.send(`Even though you give up, but *I will never gonna give you up*`)
        msg.channel.send("https://tenor.com/view/dance-moves-dancing-singer-groovy-gif-17029825")
    }
}

let current_gaym = undefined

// * Main Event which handle incoming messages, heart of the program!
function eval_msg(msg) {
    if (msg.author.id == client.user.id) {
        // * It's your own message!
        return
    }

    logconsole(`Recieve message from ${msg.author.tag} : ${msg.content}`)

    if (msg.content.startsWith("!howtoplay")) {
        msg.channel.send("<https://github.com/Leomotors/Discord-Polynomial-Master/blob/main/docs/howtoplay.md>")
        logconsole(`Guided ${msg.author.tag} how to play`, "GUIDE")
        return
    }

    if (msg.content.startsWith("!challenge")) {
        if (current_gaym) {
            logconsole(`${msg.author.tag} challenged me but a game is already running!`, "DECLINE")
            msg.channel.send(`BRUH, the game is already running`)
            return
        }

        msg.channel.send(`<@!${msg.author.id}> you dare challenge me?`)

        current_gaym = new Gaym()
        current_gaym.init(msg)
        return
    }

    if (msg.content.startsWith("!giveup")) {
        if (current_gaym) {
            if (msg.author == current_gaym.player) {
                logconsole(`${msg.author.tag} decided to give up`, "GAYM END")
                current_gaym.igiveup(msg)
                current_gaym = undefined
                return
            }
            else {
                logconsole(`${msg.author.tag} would like to give up on the game they are not playing!`, "DECLINE")
                msg.channel.send(`Not your game! BRUH`)
                return
            }
        }
        else {
            logconsole(`${msg.author.tag} would like to give up on the game they are not playing!`, "DECLINE")
            msg.channel.send(`You give up since game still not start yet? You such a loser <@!${msg.author.id}>`)
            return
        }
    }

    if (current_gaym) {
        if (msg.author != current_gaym.player) {
            // * Probably other guys
            if (current_gaym.is_correct(msg.content)) {
                msg.channel.send(`NO TELLING ANSWER BRO! <@!${msg.author.id}>`)
                logconsole(`${msg.author.tag} is telling the answer!`, "CHEAT DETECTED")

                if (current_gaym.index + 1 >= current_gaym.count) {
                    current_gaym.finalize(msg)
                    current_gaym = undefined
                }
                else {
                    msg.channel.send(`Moving forward to next question`)
                    current_gaym.ask(msg.channel)
                }
            }
            return
        }

        current_gaym.checkanswer(msg)

        if (current_gaym.index + 1 >= current_gaym.count) {
            current_gaym.finalize(msg)
            current_gaym = undefined
            return
        }

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

console.log("[SETUP COMPLETE] All imports events functions and classes have been set!")
