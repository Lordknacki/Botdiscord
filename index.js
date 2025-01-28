const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs'); // Module pour lire/écrire des fichiers
const moment = require('moment'); // Gestion des dates
require('moment/locale/fr'); // Importer la locale française pour les dates
require('dotenv').config(); // Charger les variables d'environnement

moment.locale('fr'); // Configurer Moment en français

// Configuration du bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Variables globales
const TASKS_FILE = './tasks.json';
const ROLE_ID_MONEY = '987654321012345678'; // Remplace par l'ID de ton rôle "Money"
let tasks = [];

// Fonction pour charger les tâches depuis le fichier JSON
const loadTasks = () => {
    try {
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
    } catch (error) {
        console.error('❌ Erreur lors du chargement des tâches :', error);
    }
};

// Fonction pour sauvegarder les tâches dans le fichier JSON
const saveTasks = () => {
    try {
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
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des tâches :', error);
    }
};

// Charger les tâches au démarrage
loadTasks();

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Gestion des commandes
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignorer les messages des bots

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    // Commande pour planifier une tâche
    if (command === '!planifier') {
        const dateInput = args.shift(); // Récupère la date et l'heure
        const taskDescription = args.join(' '); // Le reste du message est la description

        if (!dateInput || !taskDescription) {
            return message.channel.send(
                '❌ Usage : `!planifier jj/mm/aaaa hh:mm Description de la tâche`'
            );
        }

        // Vérifier et parser la date
        const taskTime = moment(dateInput, 'DD/MM/YYYY HH:mm', true); // Parsing strict
        if (!taskTime.isValid()) {
            return message.channel.send('❌ Format de date/heure invalide. Exemple : `28/01/2025 15:00`');
        }

        // Ajouter la tâche si valide
        tasks.push({
            id: Date.now(), // Identifiant unique pour la tâche
            time: taskTime,
            description: taskDescription,
            channelId: message.channel.id,
        });

        saveTasks(); // Sauvegarder les tâches après ajout

        return message.channel.send(
            `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'dddd DD MMMM YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant au rôle @Money !`
        );
    }

    // Commande pour voir les tâches planifiées avec des boutons
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

// Gérer les interactions avec les boutons
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const [action, taskId] = interaction.customId.split('_');

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

        return interaction.reply(`🗑️ Tâche **${removedTask[0].description}** annulée.`);
    }
});

// Vérification des tâches toutes les minutes
setInterval(() => {
    const now = moment(); // Heure actuelle

    tasks.forEach((task, index) => {
        const timeDiff = task.time.diff(now, 'minutes'); // Différence en minutes

        if (timeDiff === 60) {
            // Envoyer un rappel 1h avant
            const channel = client.channels.cache.get(task.channelId);
            if (channel) {
                channel.send(`🔔 <@&${ROLE_ID_MONEY}> Rappel : **${task.description}** dans 1h !`);
                console.log(`Rappel envoyé pour la tâche : "${task.description}"`);
            }
        } else if (timeDiff <= 0) {
            // Supprimer la tâche une fois dépassée
            tasks.splice(index, 1); // Retirer de la liste
            saveTasks(); // Sauvegarder les tâches après suppression
            console.log(`Tâche supprimée : "${task.description}"`);
        }
    });
}, 60000); // Vérifie toutes les 60 secondes

// Connecter le bot
client.login(process.env.TOKEN);
