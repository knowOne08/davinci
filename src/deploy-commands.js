import dotenv from "dotenv";
dotenv.config({ path: 'src/.env' });
import {REST, Routes} from "discord.js"

/* setting up __dirname for ES6 module */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

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
            commands.push(command.data.toJSON()); 

            // console.log(commands.length)
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }

            // console.log(process.env.TOKEN)
            const rest = new REST().setToken(process.env.TOKEN);
            (async () => {
                try {

                    console.log(`Started refreshing ${commands.length} application (/) commands.`);

                    // The put method is used to fully refresh all commands in the guild with the current set
                    const data = await rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                        { body: commands },
                    );

                    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
                } catch (error) {
                    // And of course, make sure you catch and log any errors!
                    console.error(error);
                }
            })();

        })
        .catch((error) => {
          console.error(`Error importing ${filePath}: ${error}`);
        });
    }
}

//Rest module instance
// console.log(process.env.TOKEN)
// console.log(commands)

