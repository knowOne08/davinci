import { SlashCommandBuilder } from "discord.js";

const pingCommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Just to test if the bot is live'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};

export default pingCommand