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
        this.lastchannel = undefined
    }

    init(msg, strike = 0) {
        // * Default = 201210 -> 20|1|2|10
        let num = 20 // * [2,99]
        let denom = 1 // * [1,9]
        let degree = 2 // * [2,9]
        let nquestions = 10 // * [2,99]

        if (msg.content.split(" ").length > 1) {
            let holynumber = msg.content.split(" ")[1]
            num = Math.floor(holynumber / 10000)
            denom = Math.floor((holynumber % 10000) / 1000)
            degree = Math.floor((holynumber % 1000) / 100)
            nquestions = Math.floor(holynumber % 100)

            if (num < 2 || denom < 1 || degree < 2 || nquestions < 2 || holynumber > 999999 || isNaN(holynumber)) {
                msg.channel.send("BRUH! That code does not exists")
                logconsole(`Given Invalid Code from ${msg.author.tag}`, "DECLINE")
                current_gaym = undefined
                return
            }
        }

        exec(`./polygen ${num} ${denom} ${degree} ${nquestions} noice __JSON_MODE__`, (error, stdout, stderr) => {
            let parsed_stdout = JSON.parse(stdout)
            this.questions_dict = parsed_stdout.questions
            this.difficulty = parsed_stdout.difficulty
            this.questions = Object.keys(this.questions_dict)
            this.player = msg.author
            this.count = this.questions.length
            this.ready = true
            this.start = Date.now()
            this.lastchannel = msg.channel

            if (this.count != nquestions) {
                logconsole(`Got ${this.count} questions instead of ${nquestions}! blame Polynomial Problems Generator`, "ERROR")
                if (strike >= 2) {
                    msg.channel.send(`ERROR GENERATING QUESTIONS`)
                    logconsole(`Game Initialization Failed!`, "FATAL ERROR")
                    current_gaym = undefined
                    return
                }
                this.init(msg, strike + 1)
                return
            }

            msg.channel.send(`Beginning a gaym! ${nquestions} questions at difficulty of ${this.difficulty}`)
            logconsole(`Starting a gaym with ${msg.author.tag}, ${nquestions} questions at difficulty of ${this.difficulty}`, "GAYM START")

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
        let timeused = Date.now() - this.start // * ms

        msg.channel.send(`**Challenge Completed!**\nWith difficulty of ${this.difficulty}, **You scored ${this.score}/${this.count}** and used ${timeused / 1000} seconds`)

        let user_pp = this.pp(timeused)

        msg.channel.send(`Your PP is ${user_pp > 0 ? user_pp.toFixed(3) : "*too smol to be displayed*"}`)

        logconsole(`Challenge with ${this.player.tag} ended, scored ${this.score}/${this.count}, consumed ${timeused} ms, pp is ${user_pp}`, "GAYM")

        let scoretoquestions = this.score / this.count
        if (scoretoquestions < 0.5) {
            msg.channel.send(randomfrom(words.end_game.noob_msg))
            msg.channel.send(randomfrom(words.end_game.noob_pic))
        }
        else if (scoretoquestions < 0.8) {
            msg.channel.send(randomfrom(words.end_game.intermediate_msg))
            msg.channel.send(randomfrom(words.end_game.intermediate_pic))
        }
        else {
            msg.channel.send(randomfrom(words.end_game.god_msg))
            msg.channel.send(randomfrom(words.end_game.god_pic))
        }
    }

    pp(timeused) // * Calculate Performance Point
    {
        /**
         * * PP = (diff/ sqrt(timeused) ) * (correct:all ratio)^2 * (diff ^ 0.5) * (questions ^ 0.5) * 1000
         */

        let user_pp = (Math.pow(this.difficulty, 1.5) / Math.pow(timeused, 0.5)) * Math.pow(this.score / this.count, 2) * Math.pow(this.count, 0.5)

        return user_pp * 1000
    }

    igiveup(msg) {
        let elapsed = Date.now() - this.start

        msg.channel.send(`Challenge Aborted! **You scored ${this.score}**, elapsed ${elapsed / 1000} seconds.`)
        msg.channel.send(`Even though you give up, but *I will never gonna give you up*`)
        msg.channel.send("https://tenor.com/view/dance-moves-dancing-singer-groovy-gif-17029825")

        logconsole(`Challenge with ${this.player.tag} is aborted, elapsed ${elapsed} ms`)
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
const { type } = require("os")

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
        case "stopgaym":
            current_gaym.lastchannel.send(`This gaym with <@!${current_gaym.player.id}> has been forced to abort by the owner`)
            logconsole(`Aborted Current Gaym with ${current_gaym.player.tag}`, "DEBUG")
            current_gaym = undefined
            break
        case "logout":
            client.destroy()
            logconsole("Successfully safely logged out", "LOGOUT")
            process.exit(0)

        default:
            logconsole(`Unknown Command "${command[0]}"`, "DEBUG-ERROR")
    }
}

console.log("[SETUP COMPLETE] All imports events functions and classes have been set!")
