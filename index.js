const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const moment = require('moment'); // Pour gérer les dates
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const tasks = []; // Liste des tâches planifiées

// Définir les commandes slash
const commands = [
    {
        name: 'planifier',
        description: 'Planifie une tâche avec un rappel 1h avant.',
        options: [
            {
                name: 'date',
                type: 3, // Type STRING
                description: 'Date et heure (yyyy-mm-dd hh:mm)',
                required: true,
            },
            {
                name: 'tache',
                type: 3, // Type STRING
                description: 'Description de la tâche',
                required: true,
            },
        ],
    },
    {
        name: 'voir',
        description: 'Affiche toutes les tâches planifiées.',
    },
];

// Enregistrer les commandes slash
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Enregistrement des commandes slash...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
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

// Gérer les commandes slash
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'planifier') {
        const time = options.getString('date');
        const taskDescription = options.getString('tache');

        const taskTime = moment(time, 'YYYY-MM-DD HH:mm');
        if (!taskTime.isValid()) {
            return interaction.reply('❌ Format de date/heure invalide. Exemple : `2025-01-28 15:00`');
        }

        tasks.push({
            time: taskTime,
            description: taskDescription,
            channelId: interaction.channel.id,
        });

        await interaction.reply(
            `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'DD/MM/YYYY à HH:mm'
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
                    `${index + 1}. **${task.description}** - ${task.time.format('DD/MM/YYYY à HH:mm')}`
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
}, 60000); // Vérifie toutes les 60 secondes

// Connecter le bot
client.login(process.env.TOKEN);
