// ==========================================
// COMMAND: ADVANCED DATABASE MANAGER
// ==========================================
// Handles targeted CRUD operations (Create, Update, Delete) for individual
// Draws and Loadouts using live MongoDB autocomplete lookups and Modals.

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const Loadout = require('../models/Loadout');

const ALLOWED_ADMIN_ID = '1139845545754632283'; // Your exact Discord ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('👑 Advanced Database Manager for individual Draws and Loadouts')
        .setDefaultMemberPermissions(0)
        // --- DRAWS MANAGEMENT ---
        .addSubcommandGroup(group => group
            .setName('draws')
            .setDescription('Manage individual lucky draws')
            .addSubcommand(subcmd => subcmd
                .setName('add')
                .setDescription('Add a brand new lucky draw')
                .addStringOption(option => option.setName('type').setDescription('Category').setRequired(true).addChoices({ name: 'New Draw', value: 'new' }, { name: 'Returning Draw', value: 'returning' })))
            .addSubcommand(subcmd => subcmd
                .setName('edit')
                .setDescription('Edit an existing draw')
                .addStringOption(option => option.setName('search').setDescription('Search for the draw to edit').setRequired(true).setAutocomplete(true)))
            .addSubcommand(subcmd => subcmd
                .setName('delete')
                .setDescription('Remove a draw completely')
                .addStringOption(option => option.setName('search').setDescription('Search for the draw to delete').setRequired(true).setAutocomplete(true)))
        )
        // --- LOADOUTS MANAGEMENT ---
        .addSubcommandGroup(group => group
            .setName('loadouts')
            .setDescription('Manage individual weapon loadouts')
            .addSubcommand(subcmd => subcmd
                .setName('add')
                .setDescription('Add a brand new weapon loadout'))
            .addSubcommand(subcmd => subcmd
                .setName('edit')
                .setDescription('Edit an existing loadout')
                .addStringOption(option => option.setName('search').setDescription('Search for the loadout to edit').setRequired(true).setAutocomplete(true)))
            .addSubcommand(subcmd => subcmd
                .setName('delete')
                .setDescription('Remove a loadout completely')
                .addStringOption(option => option.setName('search').setDescription('Search for the loadout to delete').setRequired(true).setAutocomplete(true)))
        )
        // --- SEASON TITLES MANAGEMENT ---
        // NOTE (added during review): the execute() function below already had a fully-built
        // handler for `group === 'season' && action === 'titles'` (opens the edit_season_titles
        // modal that index.js processes), but this subcommand group was never registered here —
        // meaning Discord had no way to let you actually invoke it. This was dead code.
        .addSubcommandGroup(group => group
            .setName('season')
            .setDescription('Manage season titles')
            .addSubcommand(subcmd => subcmd
                .setName('titles')
                .setDescription('Edit the main season title plus Battle Pass, Ranked, and DMZ titles'))
        ),

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: '❌ Access Denied. You lack administrative database privileges.', ephemeral: true });
        }

        const group = interaction.options.getSubcommandGroup();
        const action = interaction.options.getSubcommand();

        // ==========================================
        // DRAWS: ADD, EDIT, DELETE
        // ==========================================
        if (group === 'draws') {
            if (action === 'add') {
                const drawType = interaction.options.getString('type');
                const modal = new ModalBuilder()
                    .setCustomId(`add_draw_${drawType}`)
                    .setTitle(`Add ${drawType === 'new' ? 'New' : 'Returning'} Draw`);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Draw Title').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('items').setLabel('Items (Shorthand)').setStyle(TextInputStyle.Paragraph).setPlaceholder("m Character Name\nl Gun Name\ne Emote Name").setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder("e.g. July 15").setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('url').setLabel('Thumbnail Image URL').setStyle(TextInputStyle.Short).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            const targetId = interaction.options.getString('search');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            if (!seasonalDoc) return interaction.reply({ content: '❌ Global database not initialized.', ephemeral: true });

            const isNew = seasonalDoc.newDraws.find(d => d._id.toString() === targetId);
            const isReturning = seasonalDoc.returningDraws.find(d => d._id.toString() === targetId);
            const targetDraw = isNew || isReturning;
            const drawType = isNew ? 'new' : 'returning';

            if (!targetDraw) return interaction.reply({ content: '❌ Draw not found in database.', ephemeral: true });

            if (action === 'delete') {
                if (isNew) seasonalDoc.newDraws = seasonalDoc.newDraws.filter(d => d._id.toString() !== targetId);
                if (isReturning) seasonalDoc.returningDraws = seasonalDoc.returningDraws.filter(d => d._id.toString() !== targetId);
                await seasonalDoc.save();
                return interaction.reply({ content: `🗑️ Successfully deleted **${targetDraw.title}**!`, ephemeral: true });
            }

            if (action === 'edit') {
                const itemsText = targetDraw.items.map(i => `${i.tier.charAt(0).toLowerCase()} ${i.name}`).join('\n');
                const modal = new ModalBuilder().setCustomId(`edit_draw_${targetId}_${drawType}`).setTitle('Edit Lucky Draw');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Draw Title').setStyle(TextInputStyle.Short).setValue(targetDraw.title)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('items').setLabel('Items (Shorthand)').setStyle(TextInputStyle.Paragraph).setValue(itemsText)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel('Release Date').setStyle(TextInputStyle.Short).setValue(new Date(targetDraw.date).toISOString().split('T')[0])),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('url').setLabel('Thumbnail URL').setStyle(TextInputStyle.Short).setValue(targetDraw.thumbnailUrl))
                );
                return await interaction.showModal(modal);
            }
        }

        // ==========================================
        // LOADOUTS: ADD, EDIT, DELETE
        // ==========================================
        if (group === 'loadouts') {
            if (action === 'add') {
                const modal = new ModalBuilder()
                    .setCustomId(`add_loadout`)
                    .setTitle('Create New Loadout');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setPlaceholder('e.g. BP50').setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('build').setLabel('Build Name / Share Code').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Aggressive Flex').setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key').setStyle(TextInputStyle.Short).setPlaceholder('e.g. bp50_flex_v1').setRequired(true)),
                    // NOTE (extended during review): Discord modals cap at 5 fields, and this one
                    // already used all 5 -- so the new Meta/Best/Top-3 "badges" ride along as a 3rd
                    // pipe-delimited segment here rather than getting their own field. See
                    // adminParser.js's parseLoadoutBadges() for how this text gets parsed.
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Mode | Badges').setStyle(TextInputStyle.Short).setPlaceholder('AR | MP | meta,best,toxic  (or top3/top5/etc.)').setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            const targetId = interaction.options.getString('search');
            const targetLoadout = await Loadout.findById(targetId);
            if (!targetLoadout) return interaction.reply({ content: '❌ Loadout not found in database.', ephemeral: true });

            if (action === 'delete') {
                await Loadout.findByIdAndDelete(targetId);
                return interaction.reply({ content: `🗑️ Successfully deleted **${targetLoadout.weaponName} (${targetLoadout.buildName})**!`, ephemeral: true });
            }

            if (action === 'edit') {
                const modal = new ModalBuilder().setCustomId(`edit_loadout_${targetId}`).setTitle('Edit Loadout');

                // Reconstruct the badges token list from what's currently saved, so re-opening
                // this modal to tweak something else doesn't silently clear existing badges.
                const existingBadges = [
                    targetLoadout.isMeta ? 'meta' : null,
                    targetLoadout.categoryRank,
                    targetLoadout.isToxic ? 'toxic' : null
                ].filter(Boolean).join(',');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setValue(targetLoadout.weaponName)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('build').setLabel('Build Name / Code').setStyle(TextInputStyle.Short).setValue(targetLoadout.buildName)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setValue(targetLoadout.attachments.join('\n'))),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key').setStyle(TextInputStyle.Short).setValue(targetLoadout.imageKey)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Mode | Badges').setStyle(TextInputStyle.Short).setValue(`${targetLoadout.category} | ${targetLoadout.mode} | ${existingBadges}`))
                );
                return await interaction.showModal(modal);
            }
        }

        // --- ROUTE: EDIT SEASON TITLES ---
        if (group === 'season' && action === 'titles') {
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            
            // Build the dynamic popup modal overlay
            const modal = new ModalBuilder().setCustomId('edit_season_titles').setTitle('Edit Season Titles');

            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('main_title').setLabel('Main Season Title').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.currentSeasonTitle || '')),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bp_title').setLabel('Battle Pass Title').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.bpTitle || 'Battle Pass')),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rank_title').setLabel('Ranked Series Title').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.rankTitle || 'Ranked Series')),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dmz_title').setLabel('DMZ Season Title').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.dmzTitle || 'DMZ Season'))
            );
            return await interaction.showModal(modal);
        }
    }
};