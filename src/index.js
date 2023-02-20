//for a connection with discord
const { Client, GatewayIntentBits, EmbedBuilder, MessageAttachment } = require("discord.js");
const dotenv = require("dotenv");
const schedule = require('node-schedule');
let dailyUpdaters = ['immemor'];
let shoutoutRule = new schedule.RecurrenceRule()
shoutoutRule.tz = 'Asia/Kolkata'
shoutoutRule.hour = 23;
shoutoutRule.minute = 58;
shoutoutRule.second = 0;
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

  schedule.scheduleJob('*/7 * * * * *', async() => {

    // console.log('ran cron job')
    // Send a dail-updaters shoutout
    dailyUpdaters =  [... new Set(dailyUpdaters)]
    console.log(dailyUpdaters)
    if(dailyUpdaters.length > 0){
      console.log('test')
      client.channels.cache.get('1072021844758106195').send({ 
        // content: `Today's commiters ${dailyUpdaters}`,
        embeds: [
                new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle("Today's Updaters")
                    .setDescription(`${dailyUpdaters}`)
                    // .setDescription(`<@!888691453096787980>`)
                    .setAuthor({ name: 'Baburao', iconURL: 'https://pbs.twimg.com/profile_images/1251244594966040576/v-b1F6AM_400x400.jpg' })
                    .setThumbnail('https://www.mirchiplay.com/wp-content/uploads/2020/06/akshay-kumar-scheme-pose.jpg')
             ]     
      });
    } else{
      client.channels.cache.get('1072021844758106195').send({
        content: `No commits today :(`
      });
    }

    //emptying the database
    // mongoose.connection.db.dropCollection('updaters');
    // dailyUpdaters = [];
  })
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

      //scheduled archive
      schedule.scheduleJob(shoutoutRule, async () => {
        thread.setArchived(true);
      });
      
    }

      (await Updaters.find()).forEach((dailyUpdater)=>{
        
        // console.log(dailyUpdater.name);
        dailyUpdaters.push(' ' + dailyUpdater.name);
      })
      

    
      // console.log(dailyUpdaters);

  } catch(err) {
    console.log(err) 
  }
})

keepAlive()
client.login(process.env.TOKEN);
