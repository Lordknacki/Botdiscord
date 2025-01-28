const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment'); // Gestion des dates et heures
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const tasks = []; // Liste des tâches planifiées

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Commande pour ajouter une tâche
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!planifier') {
        const time = args.shift(); // Récupère l'heure (ex: "2025-01-28 15:00")
        const taskDescription = args.join(' '); // La description de la tâche

        if (!time || !taskDescription) {
            return message.channel.send(
                'Usage : `!planifier yyyy-mm-dd hh:mm Tâche à faire`'
            );
        }

        const taskTime = moment(time, 'YYYY-MM-DD HH:mm');

        if (!taskTime.isValid()) {
            return message.channel.send('Format de date/heure invalide. Exemple : `2025-01-28 15:00`');
        }

        // Ajouter la tâche
        tasks.push({
            time: taskTime,
            description: taskDescription,
            channelId: message.channel.id,
        });

        message.channel.send(
            `Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'DD/MM/YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant !`
        );
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
                channel.send(`:bell: @everyone Rappel : **${task.description}** dans 1h !`);
            }
        } else if (timeDiff <= 0) {
            // Supprimer la tâche une fois dépassée
            tasks.splice(index, 1);
        }
    });
}, 60000); // Vérifie toutes les 60 secondes

// Connecter le bot
client.login(process.env.TOKEN);
