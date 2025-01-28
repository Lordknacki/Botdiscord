const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs'); // Module pour lire/écrire des fichiers
const moment = require('moment'); // Gestion des dates
require('moment/locale/fr'); // Importer la locale française pour les dates
require('dotenv').config(); // Charger les variables d'environnement

moment.locale('fr'); // Configurer Moment en français

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
            time: taskTime,
            description: taskDescription,
            channelId: message.channel.id,
        });

        saveTasks(); // Sauvegarder les tâches

        return message.channel.send(
            `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'dddd DD MMMM YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant au rôle @Money !`
        );
    }

    // Commande pour voir les tâches planifiées
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

        return message.channel.send(`📋 Liste des tâches planifiées :\n${taskList}`);
    }

    // Commande pour annuler une tâche
    if (command === '!annuler') {
        const taskNumber = parseInt(args[0], 10); // Numéro de la tâche

        if (isNaN(taskNumber) || taskNumber < 1 || taskNumber > tasks.length) {
            return message.channel.send('❌ Indique le numéro de la tâche à annuler. Usage : `!annuler [numéro]`');
        }

        const removedTask = tasks.splice(taskNumber - 1, 1); // Supprime la tâche
        saveTasks(); // Sauvegarder les tâches après suppression
        return message.channel.send(`🗑️ Tâche **${removedTask[0].description}** annulée.`);
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
