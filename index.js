const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment'); // Pour gérer les dates
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const tasks = []; // Liste des tâches planifiées

client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!planifier') {
        const time = args.shift(); // Format: "2025-01-28 15:00"
        const taskDescription = args.join(' ');

        if (!time || !taskDescription) {
            return message.channel.send(
                '❌ Usage : `!planifier yyyy-mm-dd hh:mm Tâche à faire`'
            );
        }

        const taskTime = moment(time, 'YYYY-MM-DD HH:mm');
        if (!taskTime.isValid()) {
            return message.channel.send('❌ Format de date/heure invalide. Exemple : `2025-01-28 15:00`');
        }

        tasks.push({
            time: taskTime,
            description: taskDescription,
            channelId: message.channel.id,
        });

        message.channel.send(
            `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'DD/MM/YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant !`
        );
    }
});

setInterval(() => {
    const now = moment();

    tasks.forEach((task, index) => {
        const timeDiff = task.time.diff(now, 'minutes');

        if (timeDiff === 60) {
            const channel = client.channels.cache.get(task.channelId);
            if (channel) {
                channel.send(`🔔 @everyone Rappel : **${task.description}** dans 1h !`);
            }
        } else if (timeDiff <= 0) {
            tasks.splice(index, 1); // Supprimer la tâche
        }
    });
}, 60000);

client.login(process.env.TOKEN);
