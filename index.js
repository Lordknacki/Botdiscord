const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment'); // Gestion des dates
require('moment/locale/fr'); // Importer le français pour les dates
require('dotenv').config(); // Charger les variables d'environnement

moment.locale('fr'); // Configurer moment en français

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
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Gestion des commandes
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    // Commande pour planifier une tâche
    if (command === '!planifier') {
        const dateInput = args.shift(); // Récupère la date et l'heure (premier argument)
        const taskDescription = args.join(' '); // Le reste du message = description

        if (!dateInput || !taskDescription) {
            return message.channel.send(
                '❌ Usage : `!planifier jj/mm/aaaa hh:mm Description de la tâche`'
            );
        }

        // Forcer le parsing strict avec moment
        const taskTime = moment(dateInput, 'DD/MM/YYYY HH:mm', true); // Format strict
        if (!taskTime.isValid()) {
            return message.channel.send('❌ Format de date/heure invalide. Exemple : `28/01/2025 15:00`');
        }

        // Ajouter la tâche si tout est valide
        tasks.push({
            time: taskTime,
            description: taskDescription,
            channelId: message.channel.id,
        });

        message.channel.send(
            `✅ Tâche planifiée : **${taskDescription}** pour le **${taskTime.format(
                'dddd DD MMMM YYYY à HH:mm'
            )}**. Un rappel sera envoyé 1h avant au rôle @money !`
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

        message.channel.send(`📋 Liste des tâches planifiées :\n${taskList}`);
    }

    // Commande pour annuler une tâche
    if (command === '!annuler') {
        const taskNumber = parseInt(args[0], 10); // Récupérer le numéro de la tâche

        if (isNaN(taskNumber) || taskNumber < 1 || taskNumber > tasks.length) {
            return message.channel.send('❌ Indique le numéro de la tâche à annuler. Usage : `!annuler [numéro]`');
        }

        const removedTask = tasks.splice(taskNumber - 1, 1); // Supprime la tâche
        message.channel.send(`🗑️ Tâche **${removedTask[0].description}** annulée.`);
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
                channel.send(`🔔 <@&ROLE_ID_MONEY> Rappel : **${task.description}** dans 1h !`);
                console.log(`Rappel envoyé pour la tâche : "${task.description}"`);
            }
        } else if (timeDiff <= 0) {
            // Supprimer la tâche une fois dépassée
            tasks.splice(index, 1); // Retirer la tâche de la liste
            console.log(`Tâche supprimée : "${task.description}"`);
        }
    });
}, 60000); // Vérifie toutes les 60 secondes

// Connecter le bot
client.login(process.env.TOKEN);
