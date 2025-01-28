const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const moment = require('moment');
require('moment/locale/fr'); // Activer le français
require('dotenv').config();

moment.locale('fr'); // Configurer Moment en français

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const tasks = []; // Liste des tâches planifiées

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Commande pour ouvrir un calendrier avec des boutons
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!planifier') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('set_date')
                .setLabel('Choisir une date')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: 'Clique sur le bouton ci-dessous pour planifier une tâche.',
            components: [row],
        });
    }

    if (command === '!voir') {
        if (tasks.length === 0) {
            return message.channel.send('📋 Aucune tâche planifiée.');
        }

        const taskList = tasks
            .map(
                (task, index) =>
                    `${index + 1}. **${task.description}** - ${task.time.format('dddd DD MMMM YYYY à HH:mm')}`
            )
            .join('\n');

        message.channel.send(`📋 Liste des tâches planifiées :\n${taskList}`);
    }
});

// Gérer les interactions avec les boutons et modals
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    // Quand l'utilisateur clique sur le bouton "Choisir une date"
    if (interaction.customId === 'set_date') {
        const modal = new ModalBuilder()
            .setCustomId('planify_modal')
            .setTitle('Planifier une tâche');

        const dateInput = new TextInputBuilder()
            .setCustomId('date_input')
            .setLabel('Date et heure (jj/mm/aaaa hh:mm)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Exemple : 28/01/2025 15:00')
            .setRequired(true);

        const taskInput = new TextInputBuilder()
            .setCustomId('task_input')
            .setLabel('Description de la tâche')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Décris la tâche à accomplir')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(dateInput);
        const secondActionRow = new ActionRowBuilder().addComponents(taskInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    }

    // Quand l'utilisateur soumet le modal
    if (interaction.customId === 'planify_modal') {
        const dateInput = interaction.fields.getTextInputValue('date_input');
        const taskDescription = interaction.fields.getTextInputValue('task_input');

        const taskTime = moment(dateInput, 'DD/MM/YYYY HH:mm', true); // Parsing strict
        if (!taskTime.isValid()) {
            return interaction.reply({
                content: '❌ Format de date/heure invalide. Exemple : `28/01/2025 15:00`',
                ephemeral: true, // Message visible uniquement par l'utilisateur
            });
        }

        tasks.push({
            time: taskTime,
            description: taskDescription,
            channelId: interaction.channel.id,
        });

        await interaction.reply({
            content: `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'dddd DD MMMM YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant !`,
        });
    }
});

// Vérifier les tâches toutes les minutes
setInterval(() => {
    const now = moment(); // Heure actuelle

    tasks.forEach((task, index) => {
        const timeDiff = task.time.diff(now, 'minutes'); // Différence en minutes

        if (timeDiff === 60) {
            // Envoyer un rappel 1h avant
            const channel = client.channels.cache.get(task.channelId);
            if (channel) {
                channel.send(`🔔 @everyone Rappel : **${task.description}** dans 1h !`);
            }
        } else if (timeDiff <= 0) {
            // Supprimer la tâche une fois dépassée
            tasks.splice(index, 1); // Retirer la tâche de la liste
        }
    });
}, 60000); // Vérifie toutes les 60 secondes

// Connecter le bot
client.login(process.env.TOKEN);
