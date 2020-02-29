let sqlite3= require('sqlite3').verbose();

class DBManager{
  constructor(dbName){
    this.dbName=dbName
  }
  initializeDB()
  {
    this.database= new sqlite3.Database(this.dbName);
    this.updateVersions();
  }
  closeDB()
  {
    this.database.close();
  }
  updateVersions()
  {
    this.database.get('PRAGMA user_version',(err,version)=>{
      if(err)
      {
        return console.log("Error getting version number");
      }

      if(version.user_version <1)
      {
        this.database.run('CREATE TABLE players (player_id TEXT PRIMARY KEY,player_name TEXT)',()=>{
          this.database.run('PRAGMA user_version = 1', ()=>{
            this.updateVersions();
          });
        });
        return;
      }
      if(version.user_version <2){
        this.database.run("CREATE TABLE announcements (id INT PRIMARY KEY, text TEXT)",(err)=>{
          if(err)
          {
            return console.log("Failed to create table: "+err);
          }
          this.addAnnouncement("COME ONE COME ALL COME ON DOWN FOR A %DAY% RAID!",()=>{
            this.database.run("PRAGMA user_version = 2",()=>{
              this.updateVersions();
            });
          });
        });
        return;
      }
      console.log(version);

    });

  }
  addPlayer(id,name)
  {
      this.database.run('INSERT INTO players (player_id,player_name) VALUES(?,?)',[id,name],(err)=>{
        if(err){
          return console.log("Failed to add player: "+err);
        }
      })
  }
  getPlayerById(id,callback)
  {
    this.database.get('SELECT player_id,player_name FROM players WHERE player_id = ?',id, (err,row)=>{
      if(err){
        console.log("Failed to get player: "+err);
      }
      if(callback)
        callback(err,row);
    });
  }
  getPlayerByName(name,callback)
  {
    this.database.get('SELECT player_id,player_name FROM players WHERE player_name = ?',name, (err,row)=>{
      if(err){
        console.log("Failed to get player: "+err);
      }
      if(callback)
        callback(err,row);
    });
  }
  getPlayersByName(nameList,callback)
  {
    let nameListStr="("+nameList.map((name)=>{
      return "'"+name+"'";
    }).join(",")+")";
    this.database.all('SELECT player_id,player_name FROM players WHERE player_name IN '+nameListStr, (err,rows)=>{
      if(err){
        console.log("Failed to get players: "+err);
      }
      if(callback)
        callback(err,rows)
    });
  }
  getAllPlayers(callback){
    this.database.all('SELECT player_id,player_name FROM players',(err,rows)=>{
      if(err){
        console.log("Failed to get players: "+err);
      }
      if(callback)
        callback(err,rows)
    })
  }
  addAnnouncement(text,callback){
    this.database.run('INSERT INTO announcements (text) VALUES(?)',[text],(err)=>{
      if(err){
        console.log("Failed to add announcement: "+err);
      }
      if(callback)
        callback(err);
    })
  }
  getAnnouncement(callback){
    this.database.get("SELECT text FROM announcements ORDER BY RANDOM() LIMIT 1",(err,row)=>{
      if(err)
      {
        console.log("failed to get announcement: "+err);
      }
      if(callback)
        callback(err,row);
    })
  }
  clearAnnouncements(callback){
    this.database.run('DELETE FROM announcements',(err)=>{
      if(err)
      {
        console.log("Failed to clear announcements:"+err);
      }
      if(callback)
      callback(err);
    })
  }
}
module.exports=DBManager;
