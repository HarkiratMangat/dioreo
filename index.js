require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const xlsx = require('xlsx');

function loadBuildsFromExcel() {
    const workbook = xlsx.readFile('./builds.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const builds = {};
    
    data.forEach(row => {
        const searchName = row.Name.toLowerCase().replace(/\s+/g, '');
        const attachmentList = [row.Att1, row.Att2, row.Att3, row.Att4, row.Att5]
            .filter(att => att && att !== 'N/A').map(att => `• ${att}`).join('\n');
            
        if (!builds[searchName]) builds[searchName] = [];
        
        let finalDate = row.LastEdited;
        if (typeof row.LastEdited === 'number') {
            finalDate = new Date((row.LastEdited - 25569) * 86400 * 1000);
        } else {
            finalDate = new Date(row.LastEdited);
        }

        builds[searchName].push({ 
            ...row, 
            formattedAttachments: attachmentList, 
            processedDate: finalDate 
        });
    });
    return builds;
}

function fuzzyMatch(input, target) {
    if (!input) return true;
    const clean = (str) => str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(target).includes(clean(input));
}

let builds = loadBuildsFromExcel();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [];
commands.push(
    new SlashCommandBuilder()
        .setName('all')
        .setDescription('Search through all available gunsmiths')
        .addStringOption(opt => opt.setName('weapon').setDescription('Type weapon name').setAutocomplete(true).setRequired(true))
        .setIntegrationTypes([1]).setContexts([0, 1, 2])
);

const categories = [...new Set(Object.values(builds).map(p => p[0].Category))];
categories.forEach(cat => {
    const cmdName = cat.toLowerCase().replace(/\s+/g, '');
    commands.push(
        new SlashCommandBuilder()
            .setName(cmdName)
            .setDescription(`Search through ${cat} gunsmiths only`)
            .addStringOption(opt => opt.setName('weapon').setDescription(`Select a ${cat}`).setAutocomplete(true).setRequired(true))
            .setIntegrationTypes([1]).setContexts([0, 1, 2])
    );
});

client.once('ready', async () => {
    console.log(`✅ Dior's Builds is online!`);
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(c => c.toJSON()) });
    } catch (error) { console.error(error); }
});

function createBuildEmbed(gunKey, pageIndex) {
    const pages = builds[gunKey];
    const gun = pages[pageIndex];

    const embed = new EmbedBuilder()
        .setTitle(gun.Name.toUpperCase()) // All Caps Name
        .setDescription(gun.Description || " ")
        .setColor(gun.HexColor || "#FFFFFF")
        .setAuthor({ name: gun.Category }) // Sentence case Category
        .addFields(
            { name: "Attachments", value: gun.formattedAttachments || "None", inline: true },
            { name: "Gunsmith Code", value: `\`${gun.Code}\``, inline: true } // Backticks in embed
        )
        .setImage(gun.ImageURL)
        .setFooter({ text: `Build ${pageIndex + 1} of ${pages.length} | Last updated` })
        .setTimestamp(gun.processedDate);

    const row = new ActionRowBuilder();
    const components = [
        new ButtonBuilder().setCustomId(`prev_${gunKey}_${pageIndex}`).setLabel('Back').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('slideshow').setLabel('Shared Slideshow').setStyle(ButtonStyle.Secondary).setDisabled(true), // Placeholder label
        new ButtonBuilder().setCustomId(`next_${gunKey}_${pageIndex}`).setLabel('Next').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`copy_${gunKey}_${pageIndex}`).setLabel('Copy Code').setStyle(ButtonStyle.Success) // Aesthetic Green
    ];
    
    // Remove the placeholder slideshow button if you want standard nav, 
    // but here it is to keep that "Shared Slideshow" feel
    const navButtons = pages.length > 1 ? [components[0], components[2], components[3]] : [components[3]];
    row.addComponents(navButtons);
    
    return { embeds: [embed], components: [row] };
}

client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused();
        const commandName = interaction.commandName;
        let choices = Object.values(builds).map(p => p[0]);
        if (commandName !== 'all') {
            choices = choices.filter(g => g.Category.toLowerCase().replace(/\s+/g, '') === commandName);
        }
        const filtered = choices.filter(gun => fuzzyMatch(focusedValue, gun.Name)).slice(0, 25);
        await interaction.respond(filtered.map(gun => ({ 
            name: commandName === 'all' ? `[${gun.Category}] ${gun.Name}` : gun.Name, 
            value: gun.Name.toLowerCase().replace(/\s+/g, '') 
        })));
    }

    if (interaction.isChatInputCommand()) {
        const weaponKey = interaction.options.getString('weapon');
        if (!builds[weaponKey]) return interaction.reply({ content: "Weapon not found!", ephemeral: true });
        // Standard reply allows others to see the "slideshow"
        return interaction.reply(createBuildEmbed(weaponKey, 0));
    }

    if (interaction.isButton()) {
        const [action, gunKey, currentIndex] = interaction.customId.split('_');
        const pages = builds[gunKey];
        let newIndex = parseInt(currentIndex);

        if (action === 'next') newIndex = (newIndex + 1) % pages.length;
        if (action === 'prev') newIndex = (newIndex - 1 + pages.length) % pages.length;
        if (action === 'copy') {
            // Raw code message - no backticks
            return interaction.reply({ content: pages[newIndex].Code, ephemeral: true });
        }
        
        await interaction.update(createBuildEmbed(gunKey, newIndex));
    }
});

client.login(process.env.BOT_TOKEN);