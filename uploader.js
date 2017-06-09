const cp          = require('child_process');
var express       = require("express");
const fileUpload  = require('express-fileupload');
var multer        = require('multer');
var app           = express();
var path          = require('path');
var storage       = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});
var upload        = multer({ storage : storage }).single('userFile');
var bodyParser    = require('body-parser');
var MadSound      = require('./node-madplay.js');
const fs          = require('fs');

// ************************************************************

var MaxSounds     = require("./node-MaxSounds.js");
var _max_sounds   = new MaxSounds();

// ************************************************************

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

/************************************************************** 
 mode   := 0 -> "run""
 code   := 0 -> le fa tutte in loop infinito
 code   := 1 <= x <= 10 -> fa solo quella indicata
 repeat := [ignorato]
***************************************************************
 mode   := 1 -> "stations"
 code   := 0 -> non valido
 code   := 1 <= x <= 100 -> fa solo quella indicata
 repeat := 0 -> loop infinito
 repeat := 1 <= x <= 50 -> ripete per il numero indicato
***************************************************************
 mode   := 2 -> "actions"
 code   := 0 -> non valido
 code   := 1 (al momento ho solo una canzaone)
 repeat := 0 -> loop infinito
 repeat := 1 <= x <= 50 -> ripete per il numero indicato
**************************************************************/
var _play_cmd = {
  mode: 0xff,
  code: 0,
  repeat: 0
};

var _status = {
  EditMode: 0,
  PlayingMusic: 0,
  PlayingMode: 0,
  PlayingCode: 0,
  PlayCounter: 0
};

_status_send = function() {
  try {
    process.send({ 
      cmd: "status", 
      status: _status
    });
  } catch (err) {
    console.log(err)
  }
}

var _music = new MadSound();
_music_play = function(id, mode) {
  _music.stop();
  var song = { name: "", amp: 0 };
  if (_max_sounds.GetSong(id, mode, song)) {
    console.log("playing: " + song.name);
    try {
      _music.play(song.name, song.amp);      
    } catch (err) {
      console.log(err)
      return _music_stop();
    }
    _status.PlayingMusic = 1;
    if (mode == _max_sounds.MODE_RUN) {
      _status.PlayingMode = 0;
    } else if (mode == _max_sounds.MODE_STATIONS) {
      _status.PlayingMode = 1;
    } else if (mode == _max_sounds.MODE_ACTIONS) {
      _status.PlayingMode = 2;
    }
    _status.PlayingCode = id;
    if (++_status.PlayCounter >= 0xffff) _status.PlayCounter = 0;
    _status_send();
    return true;
  }
  return _music_stop();  
}
_music_stop = function() {
  console.log("stop playing");
  _music.stop();  
  _status.PlayingMusic = 0;
  _status.PlayingMode = 0;
  _status.PlayingCode = 0;  
  _status_send();
  return false;
}

// ************************************************************

check_play_cmd = function() {
  _music_stop();
  switch (_play_cmd.mode) {
    case 0: /* RUN */
      var id = _play_cmd.code;
      if (id == 0) {
        // devo passare alla successiva
        if (_max_sounds.HasRun()) {
          id = _max_sounds.GetNextRun();
          _music_play(id, _max_sounds.MODE_RUN);
        } 
      } else if ((id < 1) || (id > _max_sounds.NUM_SND_RUN)) {
        // id non valido        
      } else {
        // riproduco quella indicata, potrebbe anche non esistere        
        _music_play(id, _max_sounds.MODE_RUN);          
      }
      break;

    case 1: /* STATIONS */ 
      var id = _play_cmd.code;
      if ((id < 1) || (id > _max_sounds.NUM_SND_STATIONS)) {
        // id non valido        
      } else {
        // riproduco quella indicata, potrebbe anche non esistere
        _music_play(id, _max_sounds.MODE_STATIONS);          
        // check repeat
        if (_play_cmd.repeat == 0) {
          // loop infinito          
        } else if (_play_cmd.repeat == 1) {
          // al prossimo music complete vado in stop
          _play_cmd.mode = 0xff;
        } else {
          _play_cmd.repeat--;
        }
      }
      break;

    case 2: /* ACTIONS */ 
      var id = _play_cmd.code;
      if ((id < 1) || (id > _max_sounds.NUM_SND_ACTIONS)) {
        // id non valido        
      } else {
        // riproduco quella indicata, potrebbe anche non esistere
        _music_play(id, _max_sounds.MODE_ACTIONS);          
        // check repeat
        if (_play_cmd.repeat == 0) {
          // loop infinito          
        } else if (_play_cmd.repeat == 1) {
          // al prossimo music complete vado in stop
          _play_cmd.mode = 0xff;
        } else {
          _play_cmd.repeat--;
        }
      }
      break;

    default:
      // non faccio niente
      // comando di stop mandato all'inizio della func
  } 
}

_music.on("complete", function() {
  console.log("music complete");
  if (!_status.EditMode) 
    check_play_cmd();  
  else
    _music_stop();
});

process.on("message", function(m) {
  if (!_status.EditMode) {
    switch (m.cmd) {
      case "play_code":
        _play_cmd.mode = m.mode; 
        _play_cmd.code = m.code;
        _play_cmd.repeat = m.repeat;
        check_play_cmd();
        break;
      case "stop": 
        _music_stop();
        break;    
    }
  }
});

// ************************************************************

app.get('/',function(req,res) {
  res.sendFile(path.join(__dirname, 'views/index.html'));
  /* res.render('index', {
    sound_run:        _sounds.run,
    sound_stations:   _sounds.stations,
    sound_actions:    _sounds.actions,
    title: "List of sound"    
  }); */
});
app.get('/sounds', function(req,res) {
  _max_sounds.UpdateSounds();
  res.send({
    run:        _max_sounds.SRun, 
    stations:   _max_sounds.SStations,
    actions:    _max_sounds.SActions,
    edit_mode:  _status.EditMode    
  });
});
app.post('/edit_mode', function(req, res) {
  var value = parseInt(req.body.value, 10);
  _status.EditMode = (value == 0) ? 0 : 1;    
  console.log("edit mode = " + _status.EditMode);  
  _music_stop();
  res.sendStatus(200);
});
app.post('/amplify', function(req, res) {  
  if (!_status.EditMode) {
    return res.status(400).send('edit mode not enabled');
  }
  if (!_max_sounds.SetAmp(req.body.id, req.body.mode, req.body.amp)) {
    return res.status(400).send('set amp error');
  }
  res.sendStatus(200);
});
app.post('/play', function(req, res) {
  if (!_status.EditMode) {
    return res.status(400).send('edit mode not enabled');
  }  
  if (!_music_play(req.body.id, req.body.mode)) {
    return res.status(400).send('get song error');
  }
  res.sendStatus(200);
}); 
app.post('/stop', function(req, res) {
  if (!_status.EditMode) {
    return res.status(400).send('edit mode not enabled');
  }
  _music_stop();
  res.sendStatus(200);
});
app.post('/delete', function(req, res) {
  if (!_status.EditMode) {
    return res.status(400).send('edit mode not enabled');
  }
  if (!_max_sounds.DeleteSong(req.body.id, req.body.mode)) {
    return res.status(400).send('delete song error');
  }  
  return res.sendStatus(200);   
});
app.post('/api/file', function(req, res) {
  if (!_status.EditMode) {
    return res.status(400).send('edit mode not enabled');
  }
  if (!_max_sounds.SetSong(req.body.id, req.body.mode, req.files, function(err) {
         if (err) {
           console.log(err);
           return res.status(500).send(err);  
         }
         res.send({});
      })) {
    return res.status(400).send('set song error');
  }  
});
app.listen(3000, function() {
  console.log("Working on port 3000");
});
