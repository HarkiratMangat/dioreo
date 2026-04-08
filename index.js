const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const xlsx = require('xlsx');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DATA ENGINE ---
function getSpreadsheetData() {
    try {
        const workbook = xlsx.readFile('./builds.xlsx');
        const sheetName = workbook.SheetNames[0];
        return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } catch (err) {
        console.error("Spreadsheet Error: Ensure builds.xlsx is in the root folder.");
        return [];
    }
}

// --- SEARCH ENGINE (Intuitive/Fuzzy) ---
function fuzzyMatch(input, target) {
    if (!input) return true;
    const clean = (str) => str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(target).includes(clean(input));
}

// --- DYNAMIC COMMAND REGISTRATION ---
async function registerCommands() {
    const data = getSpreadsheetData();
    const categories = [...new Set(data.map(item => item.Category?.toLowerCase()).filter(Boolean))];
    
    const commands = [
        new SlashCommandBuilder()
            .setName('all')
            .setDescription('Show all weapon builds')
            .addStringOption(opt => opt.setName('weapon').setDescription('Search weapon').setAutocomplete(true))
    ];

    categories.forEach(cat => {
        commands.push(
            new SlashCommandBuilder()
                .setName(cat)
                .setDescription(`${cat.toUpperCase()} builds`)
                .addStringOption(opt => opt.setName('weapon').setDescription('Search weapon').setAutocomplete(true))
        );
    });

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        console.log('Syncing Slash Commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Commands Synced Successfully.');
    } catch (error) {
        console.error('Sync Error:', error);
    }
}

// --- EMBED BUILDER ENGINE ---
function createBuildEmbed(build, currentIndex, totalCount) {
    const attachments = [build.Att1, build.Att2, build.Att3, build.Att4, build.Att5]
        .filter(a => a && a !== 'N/A')
        .map(a => `• ${a}`)
        .join('\n');

    return new EmbedBuilder()
        .setTitle(`${build.Name.toUpperCase()}`)
        .setDescription(build.Description || "Optimized loadout.")
        .setColor(build.HexColor || '#2f3136')
        .addFields(
            { name: '🛠️ Attachments', value: attachments || 'No attachments listed', inline: false },
            { name: '🔑 Share Code', value: `\`${build.Code}\``, inline: true },
            { name: '📂 Category', value: build.Category, inline: true }
        )
        .setImage(build.ImageURL)
        .setFooter({ text: `Build ${currentIndex + 1} of ${totalCount} | Updated: ${build.LastEdited || 'Recent'}` });
}

client.once('ready', () => {
    registerCommands();
    console.log(`Dior's Builds Online: ${client.user.tag}`);
});

// --- AUTOCOMPLETE (Context-Aware) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isAutocomplete()) return;
    const data = getSpreadsheetData();
    const focusedValue = interaction.options.getFocused();
    const commandName = interaction.commandName;

    let filtered = data;
    if (commandName !== 'all') {
        filtered = data.filter(item => item.Category?.toLowerCase() === commandName);
    }

    const choices = [...new Set(filtered.map(item => item.Name))];
    const results = choices
        .filter(choice => fuzzyMatch(focusedValue, choice))
        .slice(0, 25);

    await interaction.respond(results.map(c => ({ name: c, value: c })));
});

// --- MAIN INTERACTION HANDLER ---
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

    if (results.length === 0) return interaction.reply({ content: "No builds found!", ephemeral: true });

    let index = 0;
    
    const getRow = (idx) => {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(results.length === 1),
            new ButtonBuilder().setCustomId('next').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(results.length === 1),
            new ButtonBuilder().setCustomId('copy').setLabel('Copy Code').setStyle(ButtonStyle.Secondary)
        );
        return row;
    };

    const response = await interaction.reply({
        embeds: [createBuildEmbed(results[index], index, results.length)],
        components: [getRow(index)]
    });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

    collector.on('collect', async i => {
        if (i.customId === 'copy') {
            await i.reply({ content: `\`${results[index].Code}\``, ephemeral: true });
            return;
        }

        if (i.customId === 'prev') {
            index = index === 0 ? results.length - 1 : index - 1;
        } else if (i.customId === 'next') {
            index = index === results.length - 1 ? 0 : index + 1;
        }

        await i.update({
            embeds: [createBuildEmbed(results[index], index, results.length)],
            components: [getRow(index)]
        });
    });
});

client.login(process.env.BOT_TOKEN);