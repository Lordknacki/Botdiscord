const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const moment = require('moment');
require('moment/locale/fr');
require('dotenv').config();

moment.locale('fr'); // Configurer Moment en français

// Configuration du bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const TASKS_FILE = './tasks.json';
const ROLE_ID_MONEY = '987654321012345678'; // Remplace par l'ID du rôle "Money"
let tasks = [];

// Charger les tâches depuis le fichier JSON
const loadTasks = () => {
    if (fs.existsSync(TASKS_FILE)) {
        const data = fs.readFileSync(TASKS_FILE, 'utf8');
        tasks = JSON.parse(data).map(task => ({
            ...task,
            time: moment(task.time), // Convertir les dates en objets Moment
        }));
        console.log('✅ Tâches chargées depuis le fichier.');
    } else {
        console.log('📂 Aucun fichier tasks.json trouvé. Un nouveau sera créé.');
    }
};

// Sauvegarder les tâches dans le fichier JSON
const saveTasks = () => {
    fs.writeFileSync(
        TASKS_FILE,
        JSON.stringify(
            tasks.map(task => ({
                ...task,
                time: task.time.toISOString(), // Convertir les dates Moment en chaînes
            })),
            null,
            2
        )
    );
    console.log('✅ Tâches sauvegardées dans le fichier.');
};

// Charger les tâches au démarrage
loadTasks();

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Commande pour afficher le bouton "Planifier une tâche"
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!planifier') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_modal')
                .setLabel('Planifier une tâche')
                .setStyle(ButtonStyle.Primary)
        );

        return message.channel.send({
            content: 'Clique sur le bouton ci-dessous pour planifier une tâche.',
            components: [row],
        });
    }

    if (command === '!voir') {
        if (tasks.length === 0) {
            return message.channel.send('📋 Aucune tâche planifiée.');
        }

        for (const [index, task] of tasks.entries()) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`cancel_${task.id}`)
                    .setLabel('Annuler cette tâche')
                    .setStyle(ButtonStyle.Danger)
            );

            await message.channel.send({
                content: `${index + 1}. **${task.description}** - ${task.time.format(
                    'dddd DD MMMM YYYY à HH:mm'
                )}`,
                components: [row],
            });
        }
    }
});

// Gérer les interactions avec les boutons et les modals
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        const [action, taskId] = interaction.customId.split('_');

        // Annuler une tâche
        if (action === 'cancel') {
            const taskIndex = tasks.findIndex(task => task.id.toString() === taskId);
            if (taskIndex === -1) {
                return interaction.reply({
                    content: '❌ Tâche introuvable ou déjà supprimée.',
                    ephemeral: true, // Message visible uniquement par l'utilisateur
                });
            }

            const removedTask = tasks.splice(taskIndex, 1); // Supprimer la tâche
            saveTasks(); // Sauvegarder les tâches après suppression

            return interaction.reply({
                content: `🗑️ Tâche **${removedTask[0].description}** annulée.`,
                ephemeral: true,
            });
        }

        // Ouvrir le modal pour planifier une tâche
        if (action === 'open') {
            const modal = new ModalBuilder()
                .setCustomId('planify_modal')
                .setTitle('Planifier une tâche');

            const dateInput = new TextInputBuilder()
                .setCustomId('date_input')
                .setLabel('Date et heure (jj/mm/aaaa hh:mm)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Exemple : 28/01/2025 15:00')
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('description_input')
                .setLabel('Description de la tâche')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Exemple : Réunion importante')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(dateInput);
            const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

            modal.addComponents(firstActionRow, secondActionRow);

            await interaction.showModal(modal);
        }
    }

    // Gérer les réponses du modal
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'planify_modal') {
            const dateInput = interaction.fields.getTextInputValue('date_input');
            const descriptionInput = interaction.fields.getTextInputValue('description_input');

            const taskTime = moment(dateInput, 'DD/MM/YYYY HH:mm', true);
            if (!taskTime.isValid()) {
                return interaction.reply({
                    content: '❌ Format de date/heure invalide. Exemple : `28/01/2025 15:00`',
                    ephemeral: true,
                });
            }

            // Ajouter la tâche
            const newTask = {
                id: Date.now(),
                time: taskTime,
                description: descriptionInput,
                channelId: interaction.channel.id,
            };

            tasks.push(newTask);
            saveTasks(); // Sauvegarder les tâches après ajout

            return interaction.reply({
                content: `✅ Tâche planifiée : **${newTask.description}** pour le **${newTask.time.format(
                    'dddd DD MMMM YYYY à HH:mm'
                )}**. Un rappel sera envoyé 1h avant au rôle @Money !`,
            });
        }
    }
});

// Vérification des tâches toutes les minutes
setInterval(() => {
    const now = moment();

    tasks.forEach((task, index) => {
        const timeDiff = task.time.diff(now, 'minutes');

        if (timeDiff === 60) {
            const channel = client.channels.cache.get(task.channelId);
            if (channel) {
                channel.send(`🔔 <@&${ROLE_ID_MONEY}> Rappel : **${task.description}** dans 1h !`);
                console.log(`Rappel envoyé pour la tâche : "${task.description}"`);
            }
        } else if (timeDiff <= 0) {
            tasks.splice(index, 1);
            saveTasks();
        }
    });
}, 60000);

// Connecter le bot
client.login(process.env.TOKEN);
