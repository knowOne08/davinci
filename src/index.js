const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const schedule = require("node-schedule");

let dailyUpdaters = [];
let shoutoutRule = new schedule.RecurrenceRule();
shoutoutRule.tz = "Asia/Kolkata";
shoutoutRule.hour = 23;
shoutoutRule.minute = 58;
shoutoutRule.second = 0;
const mongoose = require("mongoose");
const Updaters = require("../models/updaters-schema");

// const axios = require("axios");
dotenv.config();
const keepAlive = require("./server");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//for a connection with openai api
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organisation: process.env["OPENAI_ORG"],
  apiKey: process.env.OPENAI_API,
});

const openai = new OpenAIApi(configuration);

//bot redy test
client.on("ready", () => {
  let uri =
    "mongodb+srv://davinci:" +
    process.env.MONGO_PASS +
    "@cluster0.zux3pbq.mongodb.net/?retryWrites=true&w=majority";
  mongoose.connect(uri, {
    keepAlive: true,
  });

  console.log("Bot is ready!");

  schedule.scheduleJob(shoutoutRule, async () => {
    
    //setting the temporary array to dailyUpdaters
    (await Updaters.find()).forEach((dailyUpdater) => {
      dailyUpdaters.push(
        "<@!" +
          dailyUpdater.uid +
          ">\n" +
          "Streak Count: " +
          dailyUpdater.dates.length +
          "\n"
      );
    });
    // dailyUpdaters = [...new Set(dailyUpdaters)];
    // Send a daily-updater shoutout
    if (dailyUpdaters.length > 0) {
      client.channels.cache.get("1072021844758106195").send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Today's Updaters")
            .setDescription(`${dailyUpdaters}`)
            .setAuthor({
              name: "Baburao",
              iconURL:
                "https://pbs.twimg.com/profile_images/1251244594966040576/v-b1F6AM_400x400.jpg",
            })
            .setThumbnail(
              "https://www.mirchiplay.com/wp-content/uploads/2020/06/akshay-kumar-scheme-pose.jpg"
            ),
        ],
      });
    } else {
      client.channels.cache.get("1072021844758106195").send({
        content: `No commits today :(`,
      });
    }

    dailyUpdaters = [];
  });
});

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return; //bot dont get in loop

    if (msg.content.startsWith("!chat ")) {
      //GPT
      let text = msg.content.split("!chat ")[1];
      // console.log(text)
      const gptResponse = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: text,
        max_tokens: 512,
        temperature: 0.5,
        stop: ["ChatGPT:", "achillies:", "stopPlease:"],
      });

      msg.reply(`${gptResponse.data.choices[0].text}`);
      return;
    }

    let cmtLnk = /https:\/\/github\.com\/.*\/.*\/commit\/[0-9a-f]{40}/;

    if (msg.content.match(cmtLnk) !== null) {
      msg.react("🔥");
      const thread = await msg.startThread({
        name: `${msg.author.username}'s AppreciationThread`,
        // autoArchiveDuration: 60,
      });

      const threadId = thread.id;
      const webhooks = await msg.channel.fetchWebhooks(
        "1074013533576110170",
        "C9tyxYO6j8PC6q-ImS6fVZNMO_fUedrS1UhPYuK-UtnrziIbY2BGg9BUcT8M7twggXES"
      );
      const webhook = webhooks.first();

      await webhook.send({
        content: "Are Baas yaar kitna kaam karoge",
        threadId: threadId,
        files: [
          "https://i.pinimg.com/564x/7f/52/fb/7f52fb4660263684b4ffd130620736d2.jpg",
        ],
      });

      await Updaters.findOneAndUpdate({ uid: msg.author.id }, [
        {
          $set: {
            dates: {
              $cond: [
                { $eq: [new Date().getDate(), { $first: "$dates" }] },
                "$dates",
                {
                  $cond: [
                    { $eq: [new Date().getDate() - 1, { $first: "$dates" }] },
                    { $concatArrays: [[new Date().getDate()], "$dates"] },
                    [new Date().getDate()],
                  ],
                },
              ],
            },
          },
        },
      ]).then((doc) => {
        if (doc) {
          console.log(doc); //Document just before updation
          console.log("Done");
        } else {
          new Updaters({
            uid: msg.author.id,
            name: msg.author.username,
            dates: [new Date().getDate()],
            noOfCommits: 1,
          }).save();
          console.log(doc);
          console.log("Made new user");
        }
      });

      //scheduled archive
      schedule.scheduleJob(shoutoutRule, async () => {
        thread.setArchived(true);
      });
    }

  } catch (err) {
    console.log(err);
  }
});

keepAlive();
client.login(process.env.TOKEN);
