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
  getDBVersion(){
    return new Promise((resolve,reject)=>{
      this.database.get('PRAGMA user_version',(err,version)=>{
        if(err)
          return reject("Error getting version number: "+err);
        return resolve(version);
      });
    });
  }
  updateToVersion1(version){
    return new Promise((resolve,reject)=>{
      //dont need to do anything here
      if(version.user_version >=1)
        return resolve(version);
      this.database.run('CREATE TABLE players (player_id TEXT PRIMARY KEY,player_name TEXT)',(err)=>{
        if(err)
          return reject("Failed to create players table: "+err);
        version.user_version=1;
        return resolve(version);
      });
    });
  }
  updateToVersion2(version){
    return new Promise((resolve,reject)=>{
      if(version.user_version >=2)
        return resolve(version);
      this.database.run("CREATE TABLE announcements (id INT PRIMARY KEY, text TEXT)",(err)=>{
        if(err)
          return reject("Failed to create announcements table: "+err);
        version.user_version=2;
        this.addAnnouncement("COME ONE COME ALL COME ON DOWN FOR A %DAY% RAID!");
        return resolve(version);
      });
    });
  }
  setPragmaVersion(version){
    return new Promise((resolve,reject)=>{
      this.database.run("PRAGMA user_version = "+version.user_version,(err)=>{
        if(err)
          return reject("Failed to set user_version: "+err);
        console.log(version);
        return resolve(version);
      });
    });
  }

  updateVersions()
  {
    this.getDBVersion().then(version=>{
      return this.updateToVersion1(version);
    }).then(version =>{
      return this.updateToVersion2(version);
    }).then(version =>{
      return this.setPragmaVersion(version);
    }).catch(err =>{
      console.log(err);
    });
  }
  addPlayer(id,name)
  {
    return new Promise((resolve,reject)=>{
      this.database.run('INSERT INTO players (player_id,player_name) VALUES(?,?)',[id,name],(err)=>{
        if(err){
          console.log("Failed to add player: "+err);
          return reject(err);
        }
        resolve(name);
      });
    });
  }
  getPlayerById(id)
  {
    return new Promise((resolve,reject)=>{
      this.database.get('SELECT player_id,player_name FROM players WHERE player_id = ?',id, (err,row)=>{
        if(err){
          console.log("Failed to get player: "+err);
          return reject(err);
        }
        resolve(row);
      });
    });
  }
  getPlayerByName(name)
  {
    return new Promise((resolve,reject)=>{
      this.database.get('SELECT player_id,player_name FROM players WHERE player_name = ?',name, (err,row)=>{
        if(err){
          console.log("Failed to get player: "+err);
          return reject(err);
        }
        resolve(row);
      });
    });

  }
  getPlayersByName(nameList)
  {

    return new Promise((resolve,reject)=>{
      let nameListStr="("+nameList.map((name)=>{
        return "'"+name+"'";
      }).join(",")+")";
      this.database.all('SELECT player_id,player_name FROM players WHERE player_name IN '+nameListStr, (err,rows)=>{
        if(err){
          console.log("Failed to get players: "+err);
          return reject(err);
        }
          resolve(rows);
      });
    });
  }
  getAllPlayers(){
    return new Promise((resolve,reject)=>{
      this.database.all('SELECT player_id,player_name FROM players',(err,rows)=>{
        if(err){
          console.log("Failed to get players: "+err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
  addAnnouncement(text){
    return new Promise((resolve,reject)=>{
      this.database.run('INSERT INTO announcements (text) VALUES(?)',[text],(err)=>{
        if(err){
          console.log("Failed to add announcement: "+err);
          return reject(err);
        }
        resolve(text);
      });
    });
  }
  getAnnouncement(callback){
    return new Promise((resolve,reject)=>{
      this.database.get("SELECT text FROM announcements ORDER BY RANDOM() LIMIT 1",(err,row)=>{
        if(err)
        {
          console.log("failed to get announcement: "+err);
          return reject(err);
        }
        resolve(row);
      });
    });
  }
  clearAnnouncements(){
    return new Promise((resolve,reject)=>{
      this.database.run('DELETE FROM announcements',(err)=>{
        if(err)
        {
          console.log("Failed to clear announcements:"+err);
          return reject(err);
        }
        resolve();
      });
    });
  }
}
module.exports=DBManager;
