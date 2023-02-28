//for a connection with discord
const { Client, GatewayIntentBits, EmbedBuilder, MessageAttachment } = require("discord.js");
const dotenv = require("dotenv");
const schedule = require('node-schedule');

let dailyUpdaters = [];
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

const openai = new OpenAIApi(configuration);


// const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

//bot redy test
client.on("ready", () => {
  let uri = 'mongodb+srv://davinci:'+process.env.MONGO_PASS+'@cluster0.zux3pbq.mongodb.net/?retryWrites=true&w=majority'
  mongoose.connect(uri, {
    keepAlive:true
  })

  console.log("Bot is ready!");

  schedule.scheduleJob('*/6 * * * * *', async() => {


    // Send a daily-updater shoutout
    dailyUpdaters =  [... new Set(dailyUpdaters)]
    // dailyUpdaters = dailyUpdaters.map()
    // console.log(dailyUpdaters)
    if(dailyUpdaters.length > 0){
      client.channels.cache.get('1072021844758106195').send({ 
        // content: `Today's commiters ${dailyUpdaters}`,
        embeds: [
                new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle("Today's Updaters")
                    .setDescription(`${dailyUpdaters}`)
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
    // dailyUpdaters = [];
    // mongoose.connection.db.dropCollection('updaters');

    
  })
});

client.on('messageCreate', async (msg)=>{
  try{
    
    if(msg.author.bot) return //bot dont get in loop

    if(msg.content.startsWith("!chat ")){               //GPT
      let text = msg.content.split("!chat ")[1];
      // console.log(text)
      const gptResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      max_tokens: 512,
      temperature:0.5, 
      stop: ['ChatGPT:', 'achillies:', 'stopPlease:']
    })

    msg.reply(`${gptResponse.data.choices[0].text}`);
    return;
    }

    let cmtLnk = /https:\/\/github\.com\/.*\/.*\/commit\/[0-9a-f]{40}/;
  
    if(msg.content.match(cmtLnk) !== null){
      
      msg.react('🔥');
      // const thread = await msg.startThread({
      //   name: `${msg.author.username}'s AppreciationThread`,
      //   // autoArchiveDuration: 60, 
      // });

      // const threadId = thread.id;
      // const webhooks = await msg.channel.fetchWebhooks('1074013533576110170', 'C9tyxYO6j8PC6q-ImS6fVZNMO_fUedrS1UhPYuK-UtnrziIbY2BGg9BUcT8M7twggXES');
      // const webhook = webhooks.first();

      // //theAppreciator webhook url
      // await webhook.send({
      //   content: 'Are Baas yaar kitna kaam karoge',
      //   threadId: threadId,
      //   files: ['https://i.pinimg.com/564x/7f/52/fb/7f52fb4660263684b4ffd130620736d2.jpg'],
      // });

      // await new Updaters({
      //   uid: msg.author.id,
      //   name: msg.author.username
      // }).save()
      
      // await Updaters.findOneAndUpdate(
      //   {uid: msg.author.id},
      //   {
      //     // streakCount: {
      //     //         $cond: {
      //     //               if: {done: {$eq: true}},
      //     //               then: {$inc: {count: 1}},
      //     //               else: {$set: {count: 0}}
      //     //               }
      //     //             },
      //     // streakCount: {},
      //     streakCount: {$set: {done: true}},
      //     $inc: {noOfCommits: 1}
      //   }
      // ), (err,docs) => {
      //   if(docs.length>0){
      //     console.log("Already Exists")
      //     console.log(docs)
      //   } else {
      //     console.log(err)
      //     console.log("here")
      //      new Updaters({
      //       uid: msg.author.id,
      //       name: msg.author.username,
      //       // streakCount: {
      //       //   count: 1,
      //       //   done: true,
      //       // },
      //       streakCount: [{done: true}],
      //       noOfCommits: 1
      //     }).save()
      //   }
      // })

      //trying it with promise (delete this)

      await Updaters.findOneAndUpdate(
        {uid: msg.author.id},
        {
          $inc: {noOfCommits: 1}
        }
        ).then(
          (doc) => {
            if(doc){
              // console.log(doc) //Document just before updation
              console.log("Done")
            } else {
              console.log("Not found")
              new Updaters({
                uid: msg.author.id,
                name: msg.author.username,
                streakCount: { done: true, count: true},
                noOfCommits: 1
              }).save()
            }
          }
        )
      

      //scheduled archive
      schedule.scheduleJob(shoutoutRule, async () => {
        thread.setArchived(true);
      });

    }

      (await Updaters.find()).forEach((dailyUpdater)=>{
    
        dailyUpdaters.push('<@!'+dailyUpdater.uid+'>');
        // console.log(dailyUpdater.uid)
      })
      // console.log(dailyUpdaters)
      



  } catch(err) {
    console.log(err) 
  }
})

keepAlive()
client.login(process.env.TOKEN);
