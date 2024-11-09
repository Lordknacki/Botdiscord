import os
import random
import discord
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.command()
async def bonjour(ctx):
  await ctx.send(f"Bonjour {ctx.author} !")


@bot.command()
async def ping(ctx):
  await ctx.send(f"Pong !")


@bot.command()
async def pileouface(ctx):
  await ctx.send(random.choice(["Pile", "Face"]))


@bot.command(
    help="Lance un dé cubique",
    description="Lance un dé et renvoie le résultat entre 1 et 6 compris")
async def roll(ctx):
  await ctx.send(random.randint(1, 6))


token = os.environ['TOKEN_BOT_DISCORD']
bot.run(token)
