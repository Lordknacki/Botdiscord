import os
import random
import discord
from discord.ext import commands
from collections import defaultdict
from datetime import datetime, timedelta

# Définit les intents nécessaires pour le bot
intents = discord.Intents.default()
intents.message_content = True  # Assure-toi que cet intent est activé sur le portail des développeurs

# Initialise le bot avec un préfixe de commande
bot = commands.Bot(command_prefix="!", intents=intents,
                   help_command=None)  # Désactive la commande help par défaut

# Structure pour suivre les messages des utilisateurs
user_messages = defaultdict(list)

# Structures pour suivre le dernier moment de chaque interaction (5 minutes de délai)
last_pixel_art_time = defaultdict(lambda: datetime.min)


@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # Enregistre le moment du message
    now = datetime.now()
    five_minutes_ago = now - timedelta(minutes=5)

    # Vérifie si le message contient "C'est giga simple" et dessine un pixel art "FDP"
    if "c'est giga simple" in message.content.lower():
        last_pixel_art = last_pixel_art_time[message.author.id]
        if last_pixel_art < five_minutes_ago:
            pixel_art_fdp = ("⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛\n"
                             "⬛🟧🟧🟧⬛🟧🟧🟧⬛⬛🟧🟧🟧⬛⬛\n"
                             "⬛🟧⬛⬛⬛🟧⬛⬛🟧⬛🟧⬛🟧⬛⬛\n"
                             "⬛🟧🟧🟧⬛🟧⬛⬛🟧⬛🟧🟧🟧⬛⬛\n"
                             "⬛🟧⬛⬛⬛🟧⬛⬛🟧⬛🟧⬛⬛⬛⬛\n"
                             "⬛🟧⬛⬛⬛🟧🟧🟧⬛⬛🟧⬛⬛⬛⬛\n"
                             "⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛")
            await message.channel.send(f"\n{pixel_art_fdp}")
            last_pixel_art_time[message.author.id] = now

    # Permet au bot de traiter d'autres commandes préfixées si nécessaire
    await bot.process_commands(message)


# Commande préfixée pour dire bonjour
@bot.command()
async def bonjour(ctx):
    await ctx.send(f"Bonjour {ctx.author}, c'est Walid")


# Commande préfixée pour demander si l'utilisateur est en phase
@bot.command()
async def phase(ctx):
    await ctx.send("Vous êtes en phase ?")


# Commande préfixée pour donner une walidation aléatoire
@bot.command()
async def walidation(ctx):
    await ctx.send(random.choice(["Walidé", "Pas walidé"]))


# Commande préfixée pour fournir un récapitulatif des commandes disponibles
@bot.command(name="commandes")
async def commandes(ctx):
    commandes_description = (
        "**Liste des commandes disponibles :**\n"
        "`!bonjour` - Le bot vous salue de façon amicale.\n"
        "`!phase` - Demande si vous êtes en phase.\n"
        "`!walidation` - Obtenez une validation aléatoire : 'Walidé' ou 'Pas walidé'.\n"
        "`!commandes` - Affiche cette liste de commandes.\n"
        "`!help` - Affiche la liste des commandes disponibles.\n"
        "`!walid` - Répond par 'C'est walidé !'.\n"
        "`!enphase` - Répond par 'Vous êtes en phase ?'.\n"
        "`!nicolas` - Répond par 'FDP'.\n"
        "`!alex6` - Répond par 'Ecoute Alex6'.\n"
        "`!radoine` - Répond par 'Mais c'est qui ça ?!'.\n"
        "`!romain` - Répond par 'Shtttt, j'écoute la cinématique'.\n"
        "`!michael` - Répond par 'Récupère les fichiers'.\n"
        "`!raie` - Répond par 'La lune se lève'.\n"
        "`!fdp` - Répond par 'On t'encule'.\n"
        "`!encule` - Répond par '1v1 fifa'.\n"
        "`!steelbook` - Répond par 'Pigeon'.\n"
        "`!chocolat` - Le bot vous offre un chocolat.\n"
        "`!parle <message>` - Fais dire au bot 'Walid' ce que vous voulez.\n"
        "\n"
        "**Interactions automatiques :**\n"
        "- **Phrase spéciale :**\n"
        "  Envoyez la phrase `C'est giga simple` pour que le bot dessine un pixel art 'FDP'.\n"
    )
    await ctx.send(commandes_description)


# Commande préfixée personnalisée pour afficher l'aide
@bot.command(name="help")
async def help_command(ctx):
    await ctx.send(
        f"Utilisez `!commandes` pour obtenir la liste complète des commandes disponibles."
    )


# Ajout des nouvelles commandes basées sur les anciennes réponses aux emojis et mots spécifiques
@bot.command()
async def walid(ctx):
    await ctx.send("C'est walidé !")


@bot.command()
async def enphase(ctx):
    await ctx.send("Vous êtes en phase ?")


@bot.command()
async def nicolas(ctx):
    await ctx.send("FDP")


@bot.command()
async def alex6(ctx):
    await ctx.send("Ecoute Alex6")


@bot.command()
async def radoine(ctx):
    await ctx.send("Mais c'est qui ça ?!")


@bot.command()
async def romain(ctx):
    await ctx.send("Shtttt, j'écoute la cinématique")


@bot.command()
async def michael(ctx):
    await ctx.send("Récupère les fichiers")


@bot.command()
async def raie(ctx):
    await ctx.send("La lune se lève")


# Commandes préfixées pour les mots spécifiques
@bot.command()
async def fdp(ctx):
    await ctx.send("On t'encule")


@bot.command()
async def encule(ctx):
    await ctx.send("1v1 fifa")


@bot.command()
async def fifa(ctx):
    await ctx.send("29 ans d'existence")


@bot.command()
async def steelbook(ctx):
    await ctx.send("Pigeon")


# Commande préfixée pour donner un chocolat
@bot.command()
async def chocolat(ctx):
    await ctx.send("Tiens un chocolat")


# Commande pour faire dire quelque chose par "Walid" tout en masquant le message original
@bot.command()
async def parle(ctx, *, message: str):
    await ctx.message.delete()  # Supprime le message de la personne
    await ctx.send(f"{message}")


# Exécute le bot avec le token stocké dans les variables d'environnement
token = os.environ['TOKEN_BOT_DISCORD']
bot.run(token)
