//for a connection with discord
const { Client, GatewayIntentBits, messageLink } = require("discord.js");
const dotenv = require("dotenv");
const axios = require("axios"); 
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
  organisation: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API,
})
// console.log(process.env.OPENAI_API)
// console.log(process.env.OPENAI_ORG)


const openai = new OpenAIApi(configuration);


// const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

//bot redy test
client.on("ready", () => {
  console.log("Bot is ready!");
});

client.on('messageCreate', async (msg)=>{
  try{
    if(msg.author.bot) return

    if(msg.content === "!gpt"){
      msg.reply("I'm Up");  
    }
    if(msg.content.startsWith("!chat ")){
      let text = msg.content.split("!chat ")[1];
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
  }catch(err){
    console.log(err) 
  }
})
keepAlive()
client.login(process.env.TOKEN);
