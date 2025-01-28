const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const moment = require('moment');
require('moment/locale/fr'); // Activer le français pour les dates
require('dotenv').config();

moment.locale('fr'); // Appliquer le format français

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const tasks = []; // Liste des tâches planifiées

// Définitions des commandes slash
const commands = [
    new SlashCommandBuilder()
        .setName('planifier')
        .setDescription('Planifier une tâche avec un rappel 1h avant.')
        .addStringOption((option) =>
            option
                .setName('date')
                .setDescription("La date et l'heure au format : jj/mm/aaaa hh:mm")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('tache')
                .setDescription("La tâche à accomplir")
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('voir')
        .setDescription('Voir toutes les tâches planifiées.'),
];

// Enregistrer les commandes sur Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Enregistrement des commandes slash...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands.map((command) => command.toJSON()) }
        );
        console.log('✅ Commandes slash enregistrées.');
    } catch (error) {
        console.error('❌ Erreur lors de l’enregistrement des commandes :', error);
    }
})();

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Gestion des commandes slash
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'planifier') {
        const dateString = options.getString('date');
        const taskDescription = options.getString('tache');

        // Convertir la date en moment
        const taskTime = moment(dateString, 'DD/MM/YYYY HH:mm');
        if (!taskTime.isValid()) {
            return interaction.reply({
                content: '❌ La date est invalide. Utilise le format : `jj/mm/aaaa hh:mm`',
                ephemeral: true, // Message visible uniquement par l'utilisateur
            });
        }

        // Ajouter la tâche
        tasks.push({
            time: taskTime,
            description: taskDescription,
            channelId: interaction.channel.id,
        });

        await interaction.reply(
            `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'dddd DD MMMM YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant !`
        );
    }

    if (commandName === 'voir') {
        if (tasks.length === 0) {
            return interaction.reply('📋 Aucune tâche planifiée.');
        }

        const taskList = tasks
            .map(
                (task, index) =>
                    `${index + 1}. **${task.description}** - ${task.time.format('dddd DD MMMM YYYY à HH:mm')}`
            )
            .join('\n');

        await interaction.reply(`📋 Liste des tâches planifiées :\n${taskList}`);
    }
});

// Vérifier les tâches toutes les minutes
setInterval(() => {
    const now = moment();

    tasks.forEach((task, index) => {
        const timeDiff = task.time.diff(now, 'minutes');

        if (timeDiff === 60) {
            // Envoyer un rappel 1h avant
            const channel = client.channels.cache.get(task.channelId);
            if (channel) {
                channel.send(`🔔 @everyone Rappel : **${task.description}** dans 1h !`);
            }
        } else if (timeDiff <= 0) {
            // Supprimer la tâche une fois dépassée
            tasks.splice(index, 1);
        }
    });
}, 60000);

// Connecter le bot
client.login(process.env.TOKEN);
