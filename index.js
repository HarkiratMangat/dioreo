const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const xlsx = require('xlsx');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DATA HELPER ---
function getSpreadsheetData() {
    try {
        const workbook = xlsx.readFile('./builds.xlsx'); 
        const sheetName = workbook.SheetNames[0];
        return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } catch (err) {
        console.error("Error reading spreadsheet. Check if builds.xlsx exists.");
        return [];
    }
}

// --- FUZZY MATCH HELPER (Intuitive search: so14 matches so-14) ---
function fuzzyMatch(input, target) {
    if (!input) return true;
    const clean = (str) => str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(target).includes(clean(input));
}

// --- COMMAND REGISTRATION ---
async function registerCommands() {
    const data = getSpreadsheetData();
    const categories = [...new Set(data.map(item => item.Category?.toLowerCase()).filter(Boolean))];
    
    const commands = [
        new SlashCommandBuilder()
            .setName('all')
            .setDescription('Show all weapon builds')
            .addStringOption(opt => opt.setName('weapon').setDescription('Search specific weapon').setAutocomplete(true))
    ];

    categories.forEach(cat => {
        commands.push(
            new SlashCommandBuilder()
                .setName(cat)
                .setDescription(`Show ${cat.toUpperCase()} builds`)
                .addStringOption(opt => opt.setName('weapon').setDescription('Search specific weapon').setAutocomplete(true))
        );
    });

    // UPDATED: Using BOT_TOKEN
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        console.log('Starting slash command refresh...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Successfully synced commands.');
    } catch (error) {
        console.error('Registration Error:', error);
    }
}

client.once('ready', () => {
    registerCommands();
    console.log(`Logged in as ${client.user.tag}`);
});

// --- AUTOCOMPLETE LOGIC ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isAutocomplete()) return;

    const data = getSpreadsheetData();
    const focusedValue = interaction.options.getFocused();
    const commandName = interaction.commandName;

    let filteredData = data;
    if (commandName !== 'all') {
        filteredData = data.filter(item => item.Category?.toLowerCase() === commandName);
    }

    const choices = [...new Set(filteredData.map(item => item.Name))];
    const filteredChoices = choices
        .filter(choice => fuzzyMatch(focusedValue, choice))
        .slice(0, 25); 

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

    let results = data;
    if (commandName !== 'all') {
        results = data.filter(item => item.Category?.toLowerCase() === commandName);
    }

    if (weaponName) {
        results = results.filter(item => item.Name === weaponName);
    }

    if (results.length === 0) {
        return interaction.reply({ content: "No builds found!", ephemeral: true });
    }

    // Insert your pagination/embed logic here
    await interaction.reply(`Found ${results.length} builds for ${weaponName || 'this category'}.`);
});

// UPDATED: Using BOT_TOKEN
client.login(process.env.BOT_TOKEN);