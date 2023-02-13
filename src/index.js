//for a connection with discord
const { Client, GatewayIntentBits, messageLink, EmbedBuilder, MessageAttachment  } = require("discord.js");
const dotenv = require("dotenv");
const scheduleArchieve = require('node-schedule');
const mongoose = require('mongoose');
const Updaters = require('../models/updaters-schema')
// const axios = require("axios"); 
dotenv.config();
const keepAlive = require('./server')
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]});

//for a connection with openai api
const {Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  organisation: process.env['OPENAI_ORG'],
  apiKey: process.env.OPENAI_API,
})
// console.log(configuration)
// console.log(process.env.OPENAI_API)
// console.log(process.env.OPENAI_ORG)


const openai = new OpenAIApi(configuration);


// const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

//bot redy test
client.on("ready", () => {
  let uri = 'mongodb+srv://davinci:'+process.env.MONGO_PASS+'@cluster0.zux3pbq.mongodb.net/?retryWrites=true&w=majority'
  mongoose.connect(uri, {
    keepAlive:true
  })
  console.log("Bot is ready!");
});

client.on('messageCreate', async (msg)=>{
  try{
    
    if(msg.author.bot) return //bot dont get in loop

    if(msg.content.startsWith("!chat ")){               //GPT
      let text = msg.content.split("!chat ")[1];
      console.log(text)
      const gptResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      max_tokens: 512,
      temperature:0.5, 
      stop: ['ChatGPT:', 'achillies:', 'stopPlease:']
    })
      // console.log(gptResponse);
    msg.reply(`${gptResponse.data.choices[0].text}`);
    return;
    }

    let cmtLnk = /https:\/\/github\.com\/.*\/.*\/commit\/[0-9a-f]{40}/;
    let date = new Date();
    let channel = msg.channel;
  
    if(msg.content.match(cmtLnk) !== null){
      
      msg.react('🔥');
      const thread = await msg.startThread({
        name: `${msg.author.username}'s AppreciationThread`,
        // autoArchiveDuration: 60, 
      });

      const threadId = thread.id;
      const webhooks = await msg.channel.fetchWebhooks('1074013533576110170', 'C9tyxYO6j8PC6q-ImS6fVZNMO_fUedrS1UhPYuK-UtnrziIbY2BGg9BUcT8M7twggXES');
      const webhook = webhooks.first();

      //theAppreciator webhook url
      //https://discord.com/api/webhooks/1074013533576110170/C9tyxYO6j8PC6q-ImS6fVZNMO_fUedrS1UhPYuK-UtnrziIbY2BGg9BUcT8M7twggXES
      await webhook.send({
        content: 'Damnn, You Work too hard !!',
        threadId: threadId,
        files: ['https://i.pinimg.com/564x/7f/52/fb/7f52fb4660263684b4ffd130620736d2.jpg'],
      });

        await new Updaters({
          uid: msg.author.id,
          name: msg.author.username

        }).save()


      scheduleArchieve.scheduleJob('59 57 23 * * *', async () => {
        thread.setArchived(true);
      });
      
    }

    if(msg.content =='?data'){

      let dailyUpdaters = [];
      (await Updaters.find()).forEach((dailyUpdater)=>{
        
        console.log(dailyUpdater.name);
        dailyUpdaters.push('@' + dailyUpdater.name);
      })
      dailyUpdaters =  [... new Set(dailyUpdaters)]
      if(dailyUpdaters){
        msg.channel.send({
        content: `Today's commiters ${dailyUpdaters}`
        });
      } else {
        msg.channel.send({
          content: `No commits today :(`
        });
      }

    }
  } catch(err) {
    console.log(err) 
  }
})
keepAlive()
client.login(process.env.TOKEN);
