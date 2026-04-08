const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const xlsx = require('xlsx');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DATA HELPER ---
function getSpreadsheetData() {
    const workbook = xlsx.readFile('./builds.xlsx'); // Ensure filename matches
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return data;
}

// --- FUZZY MATCH HELPER ---
// Cleans strings (removes hyphens, spaces, etc.) for more intuitive matching
function fuzzyMatch(input, target) {
    const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(target).includes(clean(input));
}

// --- COMMAND REGISTRATION ---
async function registerCommands() {
    const data = getSpreadsheetData();
    // Dynamically get unique categories from your spreadsheet
    const categories = [...new Set(data.map(item => item.Category.toLowerCase()))];
    
    const commands = [
        // The catch-all command
        new SlashCommandBuilder()
            .setName('all')
            .setDescription('Show all weapon builds')
            .addStringOption(opt => opt.setName('weapon').setDescription('Search specific weapon').setAutocomplete(true))
    ];

    // Create a command for every category found in Excel (ar, smg, sniper, etc.)
    categories.forEach(cat => {
        commands.push(
            new SlashCommandBuilder()
                .setName(cat)
                .setDescription(`Show ${cat.toUpperCase()} builds`)
                .addStringOption(opt => opt.setName('weapon').setDescription('Search specific weapon').setAutocomplete(true))
        );
    });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('Refreshing slash commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Successfully synced category commands!');
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', () => {
    registerCommands();
    console.log(`Bot logged in as ${client.user.tag}`);
});

// --- AUTOCOMPLETE LOGIC ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isAutocomplete()) return;

    const data = getSpreadsheetData();
    const focusedValue = interaction.options.getFocused();
    const commandName = interaction.commandName;

    // Filter by category first if they are in a specific command (e.g., /ar)
    let filteredData = data;
    if (commandName !== 'all') {
        filteredData = data.filter(item => item.Category.toLowerCase() === commandName);
    }

    // Apply the "Fuzzy" filter (so14 matches so-14)
    const choices = [...new Set(filteredData.map(item => item.Name))];
    const filteredChoices = choices
        .filter(choice => fuzzyMatch(focusedValue, choice))
        .slice(0, 25); // Discord limit is 25

    await interaction.respond(
        filteredChoices.map(choice => ({ name: choice, value: choice }))
    );
});

// --- COMMAND HANDLING ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const data = getSpreadsheetData();
    const weaponName = interaction.options.getString('weapon');
    const commandName = interaction.commandName;

    // Filter logic: if /all, show all. If /ar, filter by AR.
    let results = data;
    if (commandName !== 'all') {
        results = data.filter(item => item.Category.toLowerCase() === commandName);
    }

    // If a specific weapon was picked via autocomplete
    if (weaponName) {
        results = results.filter(item => item.Name === weaponName);
    }

    if (results.length === 0) {
        return interaction.reply({ content: "No builds found for that selection!", ephemeral: true });
    }

    // --- PAGINATION / EMBED LOGIC ---
    // (Paste your existing Embed/Button pagination code here to handle the 'results' array)
    // Example: sendEmbed(interaction, results, 0);
});

client.login(process.env.TOKEN);