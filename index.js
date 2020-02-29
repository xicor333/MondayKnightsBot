const Token = process.env.MKBOT_TOKEN;

const DBManager = require('./database/dbManager.js');
const MessageManager = require('./messageManager.js');
const SettingsManager = require('./settingsManager.js');
const Discord = require('discord.js');
const Bot = new Discord.Client();

//var schedule = require('node-schedule');



var dbManager = new DBManager("./database/mk.db");
dbManager.initializeDB();
var messageManager = new MessageManager(dbManager);
var settingsManager = new SettingsManager();


Bot.on('ready', () => {
    console.log("Bot online");



    messageManager.initialize(Bot);
    messageManager.botAnnouncement(settingsManager.announcementMessage())
});

Bot.on('disconnect',()=>{
  console.log("Bot Offline");
  dbManager.closeDB();
})

Bot.on('message', msg =>{
  return messageManager.processMessage(msg);
})

Bot.on('error',error =>{
  console.log("Error: "+error.name+" "+error.message);
})

Bot.login(Token).catch(console.error)
