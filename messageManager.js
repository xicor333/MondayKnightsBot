const HeartBeatChannel_ID = process.env.HEARTBEAT_CHANNEL_ID;
const AnnouncementsChannel_ID=process.env.ANNOUNCEMENTS_CHANNEL_ID;
const Guild_ID = process.env.GUILD_ID;

const Prefix = '?';
const daysOfWeek=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const baseCommands=['help','register','interested','uninterested',"post","tag","addannouncement"];
const commands=baseCommands.map(function(command){return Prefix.concat(command)});

function checkArg(msg,argToCheck)
{
  let argsList=msg.content.split(" ");
  if(argToCheck>=argsList.length)
  {
    msg.channel.send('Invalid command. '+argToCheck+' arguments expected');
    return false;
  }
  return true;
}
function getArg(msg, argIndex)
{
  let argsList=msg.content.split(" ");
  if(argIndex>=argsList.length)
    return undefined;
  return argsList[argIndex];
}
//returns msg content without text up to argIndex
function stripArg(msg,argIndex)
{
  let argsList=msg.content.split(" ");
  if(argIndex>=argsList.length)
    return undefined;
  let argStr=argsList[argIndex];
  return msg.content.substring(msg.content.indexOf(argStr)+argStr.length+1)
}

class MessageManager{
  constructor(dbManager){
    this.dbManager=dbManager;

    this.commandMap=[
      this.command_help.bind(this),
      this.command_register.bind(this),
      this.command_interested.bind(this),
      this.command_uninterested.bind(this),
      this.command_post.bind(this),
      this.command_tag.bind(this),
      this.command_addAnnouncement.bind(this)
    ]
  }
  initialize(discordClient){
    if(!Guild_ID)
      return console.log("No GUILD_ID found");

    this.guild = discordClient.guilds.get(Guild_ID);

    this.announcementChannel=discordClient.channels.get(AnnouncementsChannel_ID)

    if(!this.guild)
      return console.log("Guild not found for id");
    console.log("Message Manager Initialized");

    this.prospect_role=this.guild.roles.find(r => r.name == "Prospects");
  }
  processMessage(msg)
  {
    if(!this.guild)
      return;
    if(!msg.content.startsWith(Prefix))
      return;
    let cmdArg= getArg(msg,0);
    if(!cmdArg)
      return;
    let commandIndex=commands.indexOf(cmdArg.toLowerCase());
    if(commandIndex<0) return;


    if(!this.guild.members.find(m => m.id === msg.author.id))
      return msg.channel.send("You are not a guild member, Please join mk server");

    return this.commandMap[commandIndex].call(this,msg,msg.author);
  }
  command_help(msg,author){
    msg.channel.send("The following commands are available: "+commands.join(","));
  }
  command_register(msg,author){
    this.dbManager.getPlayerById(author.id,(err,row)=>{
      if(err)
        return;
      let dbUser=row;
      if(dbUser)
      {
        return msg.channel.send("You are already registered as "+dbUser.player_name);
      }
      if(!checkArg(msg,1))
        return;
      let player_name=getArg(msg,1);
      this.dbManager.addPlayer(author.id,player_name);
      return msg.channel.send("You have successfully been registered as "+player_name)
    });

  }
  command_interested(msg,author){
    let member=this.guild.members.get(author.id);

    member.addRole(this.prospect_role).then(()=>{
      msg.channel.send('You now have the prospect role')
    }).catch(console.error);

  }
  command_uninterested(msg,author){
    let member=this.guild.members.get(author.id);

    member.removeRole(this.prospect_role).then(()=>{
      msg.channel.send('You no longer have the prospect role')
    }).catch(console.error);
  }
  command_post(msg,author){
    let member=this.guild.members.get(author.id);
    let isOfficer = member.roles.find(r => r.name.includes("Officer"));

    if(!(isOfficer)) return;
    if(!checkArg(msg,1)) return;

    let dayOfWeek=daysOfWeek.indexOf(getArg(msg,1).toLowerCase());
    if(dayOfWeek<0)
    {
      msg.channel.send("invalid day of the week. Options are ["+daysOfWeek.join(',')+"]");
      return;
    }
    this.dbManager.getAnnouncement((err,row)=>{
      if(err || !row)
      {
        return msg.channel.send("Failed to get an announcement message, please add one with ?addAnnouncement");
      }
      this.announcementChannel.send("@everyone "+row.text.replace(/%day%/gi,daysOfWeek[dayOfWeek].toUpperCase())+" https://forms.gle/iBrpCWBNsdmm3PNK7");
    })

  }
  command_tag(msg,author){
    let member=this.guild.members.get(author.id);
    let isOfficer = member.roles.find(r => r.name.includes("Officer"));

    if(!(isOfficer)) return;

    let message=stripArg(msg,0);
    if(message.length==0)
      return msg.channel.send("Message to tag must not be empty.");

    this.dbManager.getAllPlayers((err,rows)=>{
      if(err)
        return;
      rows.forEach((row)=>{
        let user=this.guild.members.get(row.player_id);
        let regex=new RegExp("\\b"+row.player_name+"\\b","gi");
        message=message.replace(regex,user.toString());
      })
      msg.channel.send(message);
      msg.delete().then().catch(console.error);
    });


  }
  command_addAnnouncement(msg,author){
    let member=this.guild.members.get(author.id);
    let isOfficer = member.roles.find(r => r.name.includes("Officer"));

    if(!(isOfficer)) return;
    if(!msg.content.match(/%day%/gi))
      return msg.channel.send("Message must contain '%day%' somewhere");
    let announcement=stripArg(msg,0);
    console.log(announcement)
    this.dbManager.addAnnouncement(announcement,(err)=>{
      if(err)
      {
        return msg.channel.send("Failed to add announcement");
      }
      return msg.channel.send("Announcement added");
    })
  }
}
module.exports=MessageManager;
