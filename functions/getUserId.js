const { Client, GatewayIntentBits  } = require("discord.js");
const client = require('../src/index')
function getUserFromMention(mention) {
	// The id is the first and only match found by the RegEx.
	const matches = mention.match(/^<@!?(\d+)>$/);

	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) return;

	// However, the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	const id = matches[1];
    // console.log(client.users.cache.get(id))
	return client.users.cache.get('888691453096787980');
	// return client.users.cache.get(id);
}

module.exports = getUserFromMention