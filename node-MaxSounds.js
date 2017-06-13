module.exports = function() {

  const fs = require('fs');
  const endWith = require('end-with');
  const lowerCase = require('lower-case');
 
  this.FOLDER_SND_RUN       = '/root/_sound_run';
  this.FOLDER_SND_STATIONS  = '/root/_sound_stations';
  this.FOLDER_SND_ACTIONS   = '/root/_actions';
  this.FOLDER_SND_STATUS    = '/root/comm/audio';
  
  this.NUM_SND_RUN          = 10;
  this.NUM_SND_STATIONS     = 100;
  this.NUM_SND_ACTIONS      = 4;

  this.MODE_RUN             = 'run';
  this.MODE_STATIONS        = 'stations';
  this.MODE_ACTIONS         = 'actions';
  this.MODE_STATUS          = 'status';
  
  this.ID_STATUS__STARTUP   = 'startup';

  remove_files = function(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0)
      for (var i = 0; i < files.length; i++) {
        var filePath = dirPath + '/' + files[i];
        if (fs.statSync(filePath).isFile())
          fs.unlinkSync(filePath);      
      }  
  };
  read_folder_ids = function(dir, num) {
    var arr = [];
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    for (var i = 1; i <= num; i++) {
      var item = { 
        "id": i, 
        "name": "", 
        "amp": 0 };
      if (!fs.existsSync(dir + "/" + i)) {
        fs.mkdirSync(dir + "/" + i);          
      } else {
        var items = fs.readdirSync(dir + "/" + i);
        if (items.length > 0)
          item.name = items[0];
      }
      arr.push(item);
    } 
    return arr;
  }
  read_amp = function(file_path, num, sounds) {
    var amp_data = [];
    if (fs.existsSync(file_path)) {
      var data = fs.readFileSync(file_path, 'utf8');
      amp_data = JSON.parse(data); 
      for (var i = amp_data.length; i < num; i++) {
        amp_data.push(0);    
      }
      amp_data.slice(0, num-1); // tolgo eventuali elementi in eccesso    
    } else {
      for (var i = 0; i < num; i++) {
        amp_data.push(0);
      }
      fs.writeFileSync(file_path, JSON.stringify(amp_data), 'utf8');
    }
    for (var i = 0; i < amp_data.length; i++) {
      if (typeof amp_data[i] != "number") {
        sounds[i].amp = 0;
      } else {
        sounds[i].amp = amp_data[i];
      }
    }
  }
  write_amp = function(file_path, sounds) {
    var amp_data = [];
    for (var i = 0; i < sounds.length; i++) {
      amp_data.push(sounds[i].amp);
    }
    fs.writeFileSync(file_path, JSON.stringify(amp_data), 'utf8');  
  }
  
  this.UpdateSounds = function() {
    this.SRun      = read_folder_ids(this.FOLDER_SND_RUN,       this.NUM_SND_RUN);
    this.SStations = read_folder_ids(this.FOLDER_SND_STATIONS,  this.NUM_SND_STATIONS);
    this.SActions  = read_folder_ids(this.FOLDER_SND_ACTIONS,   this.NUM_SND_ACTIONS);
    read_amp(this.FOLDER_SND_RUN        + '/amp.json', this.NUM_SND_RUN,        this.SRun);
    read_amp(this.FOLDER_SND_STATIONS   + '/amp.json', this.NUM_SND_STATIONS,   this.SStations);    
    read_amp(this.FOLDER_SND_ACTIONS    + '/amp.json', this.NUM_SND_ACTIONS,    this.SActions);    
  }
  
  this.last_run_id = 0;
  this.GetNextRun = function() {
    for (var i = 0; i < this.NUM_SND_RUN; i++) {
      this.last_run_id++;
      if (this.last_run_id > this.NUM_SND_RUN)
        this.last_run_id = 1;      
      id = this.last_run_id;
      if (this.SRun[id-1].name != "") {
        return id;
      }
    }
    return 0;
  }
  this.HasRun = function() {
    for (var i = 0; i < this.NUM_SND_RUN; i++)
      if (this.SRun[i].name != "")
        return true;
    return false;
  }
  
  this.SetAmp = function(body_id, body_mode, body_amp) {
    var id    = parseInt(body_id, 10);
    var mode  = body_mode;
    var amp   = parseInt(body_amp, 10);
    var max_id;
    var amp_file;  
    if (mode == this.MODE_RUN) 
    {
      max_id   = this.NUM_SND_RUN;
      amp_file = this.FOLDER_SND_RUN + '/amp.json';    
    } 
    else if (mode == this.MODE_STATIONS) 
    {
      max_id   = this.NUM_SND_STATIONS;
      amp_file = this.FOLDER_SND_STATIONS + '/amp.json';
    } 
    else if (mode == this.MODE_ACTIONS) 
    {
      max_id   = this.NUM_SND_ACTIONS;
      amp_file = this.FOLDER_SND_ACTIONS + '/amp.json';    
    } 
    else 
    {
      console.log("mode not valid");
      return false;
    }
    if ((id < 1) || (id > max_id)) 
    {
      console.log("id not valid");
      return false;
    }
    if (mode == this.MODE_RUN) 
    {
      this.SRun[id-1].amp = amp;
      write_amp(this.FOLDER_SND_RUN + '/amp.json', this.SRun);
    } 
    else if (mode == this.MODE_STATIONS) 
    {
      this.SStations[id-1].amp = amp;
      write_amp(this.FOLDER_SND_STATIONS + '/amp.json', this.SStations);
    } 
    else if (mode == this.MODE_ACTIONS) 
    {
      this.SActions[id-1].amp = amp;
      write_amp(this.FOLDER_SND_ACTIONS + '/amp.json', this.SActions);
    }
    return true;
  }

  this.GetSong = function(body_id, body_mode, song) {
    var id    = parseInt(body_id, 10);
    var mode  = body_mode;
    var song_name;
    var song_amp;
    var max_id;
    if (mode == this.MODE_RUN) 
    {
      if (this.SRun[id-1].name == "") 
      {
        console.log("empty name");
        return false;
      }
      song_name = this.FOLDER_SND_RUN + '/' + id + "/" + this.SRun[id-1].name;
      song_amp  = this.SRun[id-1].amp;
      max_id    = this.NUM_SND_RUN;
    } 
    else if (mode == this.MODE_STATIONS) 
    {
      if (this.SStations[id-1].name == "") 
      {
        console.log("empty name");
        return false;
      }
      song_name = this.FOLDER_SND_STATIONS + '/' + id + "/" + this.SStations[id-1].name;
      song_amp  = this.SStations[id-1].amp;
      max_id    = this.NUM_SND_STATIONS;
    } 
    else if (mode == this.MODE_ACTIONS) 
    {
      if (this.SActions[id-1].name == "") 
      {
        console.log("empty name");
        return false;
      }
      song_name = this.FOLDER_SND_ACTIONS + '/' + id + "/" + this.SActions[id-1].name;
      song_amp  = this.SActions[id-1].amp;
      max_id    = this.NUM_SND_ACTIONS;
    } 
    else if (mode == this.MODE_STATUS) 
    {
      if (id == this.ID_STATUS__STARTUP)
      {
        song.name = this.FOLDER_SND_STATUS + '/' + id + '.mp3';
        song.amp  = 0;    
        return true;
      }
      return false;
    } 
    else 
    {
      console.log("mode not valid");
      return false;
    }
    if ((id < 1) || (id > max_id)) 
    {
      console.log("id not valid");
      return false;
    }
    song.name = song_name;
    song.amp  = song_amp;    
    return true;
  }

  this.SetSong = function(body_id, body_mode, req_files, complete_cb) {
    if (!req_files) {
      console.log('no files found');
      return false;
    }
    var id = parseInt(body_id, 10);
    var mode = body_mode;    
    console.log(mode);
    // controllo gli input
    var my_folder = "";
    var max_id = 0;
    var input_control = "";    
    if (mode == this.MODE_RUN) 
    {
      my_folder = this.FOLDER_SND_RUN + "/" + id + "/";
      max_id    = this.NUM_SND_RUN;
      input_control = "input-run";      
    } 
    else if (mode == this.MODE_STATIONS) 
    {
      my_folder = this.FOLDER_SND_STATIONS + "/" + id + "/";
      max_id    = this.NUM_SND_STATIONS;
      input_control = "input-stations";      
    } 
    else if (mode == this.MODE_ACTIONS) 
    {
      my_folder = this.FOLDER_SND_ACTIONS + "/" + id + "/";
      max_id    = this.NUM_SND_ACTIONS;
      input_control = "input-actions";      
    } 
    else 
    {
      console.log("mode not valid");
      return false;
    }
    if ((id < 1) || (id > max_id)) 
    {
      console.log("id not valid");
      return false;
    }
    // cerco il nome del controllo che mi ha fatto l'upload e recupero il file
    var curr_prop_name = "";
    for (var prop_name in req_files) 
    {
      if (prop_name.indexOf(input_control) > -1) 
      {
        curr_prop_name = prop_name;
        break;
      }
    }
    if (curr_prop_name.length == 0) 
    {
      console.log('prop name not found');
      return false;
    }
    var my_file = req_files[curr_prop_name];
    if (!endWith(lowerCase(my_file.name), ".mp3")) 
    {
      console.log('wrong extension');
      return false;
    }
    // inizio upload
    console.log("uploading id: " + id);
    console.log("uploading mode: " + mode);
    console.log("uploading folder: " + my_folder);
    // cancello tutti i file nella cartella di destinazione
    remove_files(my_folder); 
    // sposto il file
    my_file.mv(my_folder + my_file.name.split(' ').join('_'), function(err) {
      complete_cb(err);      
    });
    return true;
  }

  this.DeleteSong = function(body_id, body_mode) {
    var id = parseInt(body_id, 10);
    var mode = body_mode;    
    // controllo gli input
    var my_folder = "";
    var max_id = 0;
    if (mode == this.MODE_RUN) 
    {
      my_folder = this.FOLDER_SND_RUN + "/" + id + "/";
      max_id    = this.NUM_SND_RUN;
    } 
    else if (mode == this.MODE_STATIONS) 
    {
      my_folder = this.FOLDER_SND_STATIONS + "/" + id + "/";
      max_id    = this.NUM_SND_STATIONS;
    } 
    else if (mode == this.MODE_ACTIONS) 
    {
      my_folder = this.FOLDER_SND_ACTIONS + "/" + id + "/";
      max_id    = this.NUM_SND_ACTIONS;
    } 
    else 
    {
      console.log("mode not valid");
      return false;
    }
    if ((id < 1) || (id > max_id)) 
    {
      console.log("id not valid");
      return false;
    }
    console.log("deleting id: " + id);
    console.log("deleting mode: " + mode);
    console.log("deleting folder: " + my_folder);
    remove_files(my_folder);
    return true;
  }

  // inizializzo le var 
  this.UpdateSounds();
};
