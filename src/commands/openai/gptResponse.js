import { SlashCommandBuilder } from "discord.js";
import { openai } from "../../functions/connectGPT.js";


const getGPTresponse = async (prompt) => {
    // console.log(prompt)
        const gptResponse = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 512,
            temperature: 0.5,
            stop: ["ChatGPT:", "achillies:", "stopPlease:"],
    
        });
        return `${gptResponse.data.choices[0].text}`
    }
    
const data = new SlashCommandBuilder()
	.setName('chat')
	.setDescription('chatGPT response!')
	.addStringOption(option =>
		option
            .setName('prompt')
			.setDescription('prompt')
            .setRequired(true))

            
const chat = {
    data: data,
    async execute(interaction){
        // await interaction.reply("Test")
        // console.log(interaction);
        const prompt = await interaction.options.getString('prompt');
        console.log(prompt);
        await interaction.deferReply();
        await interaction.editReply(await getGPTresponse(prompt)) ?? "Didn't work (Default)";
    } 
}

export default chat;