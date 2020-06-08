const FS = require('fs');
const Touch = require('touch');
const INI = require('ini');
const currentVersion=3;
class SettingsManager{
  constructor(){
    Touch.sync('./config.ini');
    this.config = INI.parse(FS.readFileSync('./config.ini','utf-8'));
    if(!this.config.version)
      this.config.version=0;
  }
  announcementMessage()
  {
    if(this.config.version>=currentVersion)
      return undefined;
    var announcement = "The MK Bot has been updated to version "+currentVersion+".\n";
    announcement +="Major changes include:\n";
    while(this.config.version<currentVersion)
    {
      announcement+=this.getChanges(++this.config.version)
    }
    FS.writeFile('./config.ini',INI.stringify(this.config),(err)=>{
      if(err) console.log("error");
      console.log("Sucessfully updated version number to "+currentVersion);
    })
    return announcement;
  }
  getChanges(versionNo)
  {
    if(versionNo == 1)
    {
      return "* Added 'clearAnnouncements' command\n";
    }
    if(versionNo == 2)
    {
      return "* 'addAnnouncement' command no longer requires %day% tag\n"+
              "* 'help' now gives explanations of the specific commands"
    }
    if(versionNo ==3)
    {
      return "* 'post' command no longer requires a day to be specified and will just use today's day"
    }
  }
}
module.exports=SettingsManager;
