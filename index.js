// ==========================================
// PHASE 1: WEB SERVER ARCHITECTURE (KEEP-ALIVE)
// ==========================================
// Express setup acts as a lightweight web server endpoint. This prevents modern hosting 
// environments (like Render or Railway) from spinning down or idling the bot container 
// during periods of inactivity on free/hobby tiers.
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("Dior's Build Bot is running successfully!");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`📡 Keep-alive web infrastructure listening on port ${port}`);
});

// ==========================================
// PHASE 2: CORE MODULES & DEPENDENCY IMPORTS
// ==========================================
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
require('dotenv').config(); // Secure injection of environment variables from local or cloud environment

// Destructuring modern discord.js elements with structural lifecycle elements (Events binding)
const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    Collection, 
    Events 
} = require('discord.js');

// ==========================================
// PHASE 3: CORE UTILITIES & SPREADSHEET ENGINE
// ==========================================

// Global lookup table mapping standard IANA timezones to descriptive user-facing labels
const tzLabels = {
    'America/Toronto': 'Eastern (Toronto/NY)',
    'America/Winnipeg': 'Central (Winnipeg/Chicago)',
    'America/Edmonton': 'Mountain (Edmonton/Denver)',
    'America/Vancouver': 'Pacific (Vancouver/LA)',
    'Pacific/Honolulu': 'Hawaii Standard Time',
    'UTC': 'Coordinated Universal Time (UTC 0)',
    'Europe/London': 'United Kingdom (London)',
    'Europe/Paris': 'Central Europe (Paris/Berlin)',
    'Europe/Stockholm': 'Sweden (Stockholm)',
    'Asia/Kolkata': 'India Standard Time (Delhi)',
    'Asia/Singapore': 'Singapore Standard Time',
    'Asia/Hong_Kong': 'Hong Kong Time',
    'Asia/Shanghai': 'Mainland China (Beijing)',
    'Asia/Tokyo': 'Japan Standard Time (Tokyo)',
    'Australia/Sydney': 'Eastern Australia (Sydney)'
};

function getTimezoneLabel(tz, baseName) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
        const parts = formatter.formatToParts(now);
        const tzPart = parts.find(part => part.type === 'timeZoneName');
        const zoneAbbr = tzPart ? tzPart.value : '';
        
        const tzString = now.toLocaleString('en-US', { timeZone: tz });
        const utcString = now.toLocaleString('en-US', { timeZone: 'UTC' });
        const tzNow = new Date(tzString);
        const utcNow = new Date(utcString);
        
        const offsetMin = Math.round((tzNow - utcNow) / 60000);
        const hours = Math.floor(Math.abs(offsetMin) / 60);
        const mins = Math.abs(offsetMin) % 60;
        const sign = offsetMin >= 0 ? '+' : '-';
        const offsetStr = `UTC${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        const fullLabel = `(${offsetStr}) ${baseName} (${zoneAbbr})`;
        return fullLabel.substring(0, 100); 
    } catch (e) {
        return baseName.substring(0, 100); 
    }
}

/**
 * Parses and maps local Excel spreadsheets into active structural application memory.
 * Handles attachment list compression and sanitizes legacy Excel date values.
 */
function loadBuildsFromExcel() {
    const workbook = xlsx.readFile('./builds.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const builds = {};
    
    data.forEach(row => {
        // Normalize unique key strings to avoid spaces/casing lookup faults during lookups
        const searchName = row.Name.toLowerCase().replace(/\s+/g, '');
        
        // Strip out inactive slots or N/A values to keep layout renders completely clean
        const attachmentList = [row.Att1, row.Att2, row.Att3, row.Att4, row.Att5]
            .filter(att => att && att !== 'N/A')
            .map(att => `• ${att}`)
            .join('\n');
            
        if (!builds[searchName]) builds[searchName] = [];
        
        // EXCEL DATE CONVERSION ENGINE:
        // Excel stores dates as serial numbers counting days since Jan 1, 1900.
        // 25569 represents the number of days between Excel's epoch and the Unix Epoch (Jan 1, 1970).
        // 86400 * 1000 converts those floating fractional days directly into active Javascript Milliseconds.
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

/**
 * Clean fuzzy search comparator for input strings against spreadsheet dataset strings.
 */
function fuzzyMatch(input, target) {
    if (!input) return true;
    const clean = (str) => str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(target).includes(clean(input));
}

// Instantiate internal client data models
let builds = loadBuildsFromExcel();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Initialize command collections and staging cache array
client.commands = new Collection();
const commands = [];

// ==========================================
// PHASE 4: APPLICATION COMMAND REGISTRATION
// ==========================================

// Register primary comprehensive fallback lookup module
commands.push(
    new SlashCommandBuilder()
        .setName('all')
        .setDescription('Search through all available gunsmiths')
        .addStringOption(opt => opt.setName('weapon').setDescription('Type weapon name').setAutocomplete(true).setRequired(true))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]) // User-install app permissions enabled
);

// DYNAMIC COMMAND EXTENSION MODULE LOADER:
// Scans internal subdirectory directories to dynamically extract and merge independent slash files
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data);
        }
    }
}

// SPREADSHEET CATEGORY COMMAND COMPILER:
// Extracts unique spreadsheet class titles to auto-compile isolated secondary filtration commands
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

/**
 * Coordinates secure synchronization of compiled structures directly over to active Discord cloud endpoints.
 */
async function handleBotReady() {
    console.log(`✅ Dior's Builds instance fully authenticated!`);
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        const payload = commands.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
        await rest.put(Routes.applicationCommands(client.user.id), { body: payload });
        console.log(`🚀 Application routing links successfully integrated into Discord Gateway system!`);
    } catch (error) { 
        console.error('--- DISCORD SYSTEM REGISTRATION FAULT LOG ---');
        if (error.rawError && error.rawError.errors) {
            console.error(JSON.stringify(error.rawError.errors, null, 2));
        } else {
            console.error(error);
        }
    }
}

client.once(Events.ClientReady, handleBotReady);

// ==========================================
// PHASE 5: INTERACTIVE ELEMENT GENERATORS
// ==========================================

/**
 * Builds standard visual layout components for loadout panels based on index targets.
 */
function createBuildEmbed(gunKey, pageIndex) {
    const pages = builds[gunKey];
    const gun = pages[pageIndex];

    const embed = new EmbedBuilder()
        .setTitle(gun.Name.toUpperCase())
        .setDescription(gun.Description || " ")
        .setColor(gun.HexColor || "#FFFFFF")
        .setAuthor({ name: gun.Category })
        .addFields(
            { name: "Attachments", value: gun.formattedAttachments || "None", inline: true },
            { name: "Gunsmith Code", value: `\`${gun.Code}\``, inline: true }
        )
        .setImage(gun.ImageURL)
        .setFooter({ text: `Build ${pageIndex + 1} of ${pages.length} | Last updated` })
        .setTimestamp(gun.processedDate);

    const row = new ActionRowBuilder();
    const components = [
        new ButtonBuilder().setCustomId(`prev_${gunKey}_${pageIndex}`).setLabel('Back').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('slideshow').setLabel('Shared Slideshow').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`next_${gunKey}_${pageIndex}`).setLabel('Next').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`copy_${gunKey}_${pageIndex}`).setLabel('Copy Code').setStyle(ButtonStyle.Success)
    ];
    
    const navButtons = pages.length > 1 ? [components[0], components[2], components[3]] : [components[3]];
    row.addComponents(navButtons);
    
    return { embeds: [embed], components: [row] };
}

// ==========================================
// PHASE 6: INTERACTION SYSTEM OVERSEER (ROUTING)
// ==========================================
client.on('interactionCreate', async interaction => {
    
    // --- STEP 6.1: SEARCH AUTOCOMPLETE ROUTE ---
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

    // --- STEP 6.2: SLASH COMMAND ROUTE ENGINE ---
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // Query modular internal command collections first
        const command = client.commands.get(commandName);
        if (command) {
            try {
                return await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing modular slash command ${commandName}:`, error);
                if (interaction.deferred || interaction.replied) {
                    return interaction.editReply({ content: 'There was an error executing this command!' });
                } else {
                    return interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
                }
            }
        }

        // Spreadsheet Category command fallback loop execution
        const weaponKey = interaction.options.getString('weapon');
        if (!builds[weaponKey]) return interaction.reply({ content: "Weapon data block matching reference keys was not found!", ephemeral: true });
        
        return interaction.reply(createBuildEmbed(weaponKey, 0));
    }
    
    // --- STEP 6.3: STATELESS TIMESTAMP DROPDOWN SELECT ROUTER ---
    // Look for the new pipe delimiter prefix
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tsmenu|')) {
        
        // PRO FIX: Instantly defer the update to tell Discord we are processing. 
        // This permanently extends the 3-second timeout window to 15 minutes, preventing 10062 crashes.
        await interaction.deferUpdate();

        // Split out parameters safely using the pipe (|) delimiter so timezones like Asia/Hong_Kong don't fracture
        const parts = interaction.customId.split('|');
        const unix = parts[1];
        const tz = parts[2];
        const originalQueryText = parts.slice(3).join('|');
        
        const selectedStyle = interaction.values[0];
        const currentFullTzLabel = getTimezoneLabel(tz, tzLabels[tz]);

        const styleCharMap = {
            fullDateTime: 'F', longDateTime: 'f', longDate: 'D', shortDate: 'd',
            mediumTime: 'T', shortTime: 't', shortDateTimeShort: 's',
            shortDateTimeMedium: 'S', relative: 'R'
        };

        let updatedComponents = [];

        if (selectedStyle === 'all_formats') {
            const lines = [
                `\`<t:${unix}:F>\` — <t:${unix}:F>`,
                `\`<t:${unix}:f>\` — <t:${unix}:f>`,
                `\`<t:${unix}:D>\` — <t:${unix}:D>`,
                `\`<t:${unix}:d>\` — <t:${unix}:d>`,
                `\`<t:${unix}:T>\` — <t:${unix}:T>`,
                `\`<t:${unix}:t>\` — <t:${unix}:t>`,
                `\`<t:${unix}:s>\` — <t:${unix}:s>`,
                `\`<t:${unix}:S>\` — <t:${unix}:S>`,
                `\`<t:${unix}:R>\` — <t:${unix}:R>`
            ].join('\n');

            updatedComponents = [
                {
                    type: 17, // Section Container Card
                    accent_color: 16741953, // Precious Persimmon (#ff7641)
                    components: [
                        { type: 10, content: "### Time Converted to Each User’s Local Timezone" },
                        // Injected the ✦ prompt directly below the timestamps list with a double line break
                        { type: 10, content: lines + `\n\n-# ✦ Tap on any \`<t:###:F>\` text above to instantly copy it` },
                        { type: 14, spacing: 1, divider: true },
                        // Removed double line break gap between descriptor and parsed context
                        { type: 10, content: `-# Select a specific layout below to change views\n-# Parsed \`${originalQueryText}\` using timezone \`${currentFullTzLabel}\`` }
                    ]
                },
                {
                    type: 1, 
                    components: [interaction.component.toJSON()]
                }
            ];
            
            updatedComponents[1].components[0].options.forEach(opt => opt.default = opt.value === 'all_formats');
        
        } else {
            // VIEW MODE: SINGULAR TARGET LAYOUT
            const char = styleCharMap[selectedStyle];
            updatedComponents = [
                {
                    type: 17, // Section Container Card
                    accent_color: 16741953, // Precious Persimmon (#ff7641)
                    components: [
                        { type: 10, content: `### \`<t:${unix}:${char}>\` — <t:${unix}:${char}>` },
                        { type: 14, spacing: 1, divider: true },
                        // Removed double line break gap between descriptor and parsed context
                        { type: 10, content: `-# Use the dropdown below to change timestamp style\n-# Parsed \`${originalQueryText}\` using timezone \`${currentFullTzLabel}\`` }
                    ]
                },
                {
                    type: 1,
                    components: [interaction.component.toJSON()]
                }
            ];
            
            updatedComponents[1].components[0].options.forEach(opt => opt.default = opt.value === selectedStyle);
        }

        // --- INTERACTION CALLBACK SERIALIZER BYPASS (FIXED FOR DEFERRAL) ---
        // Because we deferred the update at the top of the route, we must switch from a POST to a 
        // PATCH directed at the interaction's webhook payload to seamlessly edit the active message.
        return await interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            {
                body: {
                    content: "",
                    components: updatedComponents,
                    flags: 32768 // 1 << 15 maintains Components V2 container context natively
                }
            }
        );
    }

    // --- STEP 6.4: LOADOUT EMBED PAGE PAGINATION ROUTER ---
    if (interaction.isButton()) {
        const [action, gunKey, currentIndex] = interaction.customId.split('_');
        const pages = builds[gunKey];
        let newIndex = parseInt(currentIndex);

        if (action === 'next') newIndex = (newIndex + 1) % pages.length;
        if (action === 'prev') newIndex = (newIndex - 1 + pages.length) % pages.length;
        if (action === 'copy') {
            return interaction.reply({ content: pages[newIndex].Code, ephemeral: true });
        }
        
        await interaction.update(createBuildEmbed(gunKey, newIndex));
    }
});

// Initialize system authorization
client.login(process.env.BOT_TOKEN);