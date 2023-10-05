
import dotenv from "dotenv";
dotenv.config({ path: 'src/.env' });
/* setting up __dirname for ES6 module */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Client, GatewayIntentBits, EmbedBuilder, Events, Collection } from "discord.js";
import schedule from "node-schedule";
// import { Configuration, OpenAIApi } from "openai";
import { keepAlive } from "./server.js"
import mongoose from "mongoose";
import Updaters from "./../models/updaters-schema.js"
let dailyUpdaters = [];
let shoutoutRule = new schedule.RecurrenceRule();
shoutoutRule.tz = "Asia/Kolkata";
shoutoutRule.hour = 23;
shoutoutRule.minute = 58;
shoutoutRule.second = 0;

let chatState = '';


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
/* --- Command Handling --- */
client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {

    const filePath = path.join(commandsPath, file);
    import(filePath)
      .then((module) => {
        const command = module.default || module;

        // Check if the imported module has 'data' and 'execute' properties
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      })
      .catch((error) => {
        console.error(`Error importing ${filePath}: ${error}`);
      });
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  // console.log(interaction);

  const command = interaction.client.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// //--- For a connection with openai api ----
// const configuration = new Configuration({
//   organisation: process.env["OPENAI_ORG"],
//   apiKey: process.env.OPENAI_API,
// });

// const openai = new OpenAIApi(configuration);

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
      client.channels.cache.get("1092854457760497794").send({
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
      client.channels.cache.get("1092854457760497794").send({
        content: `No commits today :(`,
      });
    }

    dailyUpdaters = [];
  });


});

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return; //bot dont get in loop



    let cmtLnk = /https:\/\/github\.com\/.*\/.*\/commit\/[0-9a-f]{40}/;

    if (msg.content.match(cmtLnk) !== null) {
      msg.react("🔥");
      const thread = await msg.startThread({
        name: `${msg.author.username}'s AppreciationThread`,
        // autoArchiveDuration: 60,
      });

      const threadId = thread.id;
      const webhooks = await msg.channel.fetchWebhooks(
        "1092854760136245289",
        "HlAT6CkbSIZFT1COaAbkJOWyq_IXrBpneCew68NaPnrxxDjurc8GqDVTpDNFzNM0L9TB"
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
