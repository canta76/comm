const cp = require('child_process');
const ip_addr     = cp.fork(__dirname + '/ip_addr.js');
const ping_google = cp.fork(__dirname + '/ping_google.js');
const uploader    = cp.fork(__dirname + '/uploader.js');

// ************************************************************

var _ip_addr_buffer = new Buffer(12).fill(0);
var _internet_available = 0;
var _uploader_status = {
  EditMode: 0,
  PlayingMusic: 0,
  PlayingMode: 0,
  PlayingCode: 0,
  PlayCounter: 0
};

ip_addr.on('message', function(data) {
  _ip_addr_buffer = new Buffer(data); /* 12 byte */
  // console.log('ip addrs: ' + _ip_addr_buffer.toString('hex'));  
});
ping_google.on('message', function(data) {
  _internet_available = !isNaN(data) ? 1 : 0;
  // console.log('internet available: ' + _internet_available);  
});
uploader.on('message', function(m) {
  if (m.cmd == "status") {
    _uploader_status = m.status;
    //console.log('uploader status updated');
    //console.log(_uploader_status);
  }
});

var cleanExit = function(v) { 
  console.log('bye');
  ip_addr.kill();
  ping_google.kill();
  uploader.kill();
  process.exit();
};
process.on('SIGINT',  cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

// ************************************************************

try
{
  var m = require('mraa'); //require mraa
}
catch (e) 
{
  console.log(e);
  return;
}
console.log('MRAA Version: ' + m.getVersion());

// ************************************************************

var b0 = new Buffer(2048); // buffer di ricezione
var bytes_to_read = 0;
var pos = 0;
var crc = require('./node-crc32.js');
var rx_counter = 0;
var tx_counter = 0;

setInterval(function() {
  //console.log("*** rx counter = " + rx_counter);
  //console.log("*** pos = " + pos);
}, 1000);

function sleep(delay) {
  delay += new Date().getTime();
  while (new Date() < delay) { }
}
function U32toBytes(num) {
    var b = new Buffer(4);
    b[0] = (num >>>  0) & 0xff;
    b[1] = (num >>>  8) & 0xff;
    b[2] = (num >>> 16) & 0xff;
    b[3] = (num >>> 24) & 0xff;         
    return b;
}
function reset_pos() {
  pos = 0;
}

var RE = new m.Gpio(13); // rec en
RE.dir(m.DIR_OUT);
RE.write(0);

var LED = new m.Gpio(12); // led
LED.dir(m.DIR_OUT);
LED.write(1);

var _CMD_AP__READ_STATUS  = 0x60;
var _CMD_AP__STOP         = 0x61;
var _CMD_AP__PLAY_CODE    = 0x62;
var _CMD_AP__START_AP     = 0x63;

var WifiMode = require("./node-wifi_mode.js");
var _wifi_mode = new WifiMode();

var SerialPort = require("serialport");
var port = new SerialPort("/dev/ttyS1", { baudRate: 115200 });
port.on('open', function() { console.log('port open'); });
port.on('data', function(data) {
  //console.log('data: ' + data.toString("hex"));
  setTimeout(reset_pos, 100);
  for (var i = 0; i < data.length; i++)
  {
    b0[pos++] = data[i];
    if (pos == 1)
    {      
    }
    else if (pos == 2)
    {
      var payload = b0[0] + b0[1] * 256;
      if (payload > 2048-8)
        pos = 0;
      else
        bytes_to_read = payload+8;       
    } 
    else if (pos >= bytes_to_read)
    {      
      if (crc.check(b0, bytes_to_read))
      {        
        var addr = b0[2];
        var code = b0[3];

        if (addr == 1) 
        {
          // il messaggio non era destinato a questa scheda
          // console.log("mag addr");
        }
        else if (addr == 2)
        {
          rx_counter++;
          /* var data = b0.slice(4, bytes_to_read-4)
          var obj = { 
            msg_counter: msg_counter,
            msg_addr: addr,
            msg_code: code,
            msg_data: data  
          }; */
          var b1 = new Buffer([0x00, 0x00, addr, code]);
          switch (code)
          {
            case _CMD_AP__READ_STATUS:
              b1 = new Buffer(4 + 24);
              b1[0]  = 24;
              b1[1]  = 0;
              b1[2]  = addr;
              b1[3]  = code;
              b1[4]  = b0[4]; // MsgCounter
              b1[5]  = _internet_available + 
                       (_uploader_status.PlayingMusic << 1) +
                       (_uploader_status.EditMode << 2);
              b1[6]  = _uploader_status.PlayingMode;
              b1[7]  = _uploader_status.PlayingCode;
              b1[8]  = (_uploader_status.PlayCounter >>> 0) & 0xff;
              b1[9]  = (_uploader_status.PlayCounter >>> 8) & 0xff;
              b1[10] = 0;
              b1[11] = 0;
              _ip_addr_buffer.copy(b1, 12, 0);
              var d = new Date();
              var seconds = Math.round(d.getTime() / 1000);
              var b_date = U32toBytes(seconds);
              b_date.copy(b1, 24, 0);
              break;
            case _CMD_AP__STOP:
              uploader.send({ cmd: 'stop' }); 
              break;
            case _CMD_AP__PLAY_CODE:
              uploader.send({ 
                cmd:    'play_code',
                mode:   b0[4],
                code:   b0[5],
                repeat: b0[6]
              });
              break;
            case _CMD_AP__START_AP:
              console.log("starting ap");
              _wifi_mode.StartAP();
              break;
            default:
              break;
          }
          b1 = crc.add(b1, b1.length);
          //console.log(b1);
          //console.log("rx ok"); 
          // invio la risposta
          RE.write(1);
          //sleep(5);
          port.write(b1, function(err) {
            sleep(5);
            RE.write(0);
            tx_counter++
            console.log("tx done #" + tx_counter); 
          });
          // blink del led
          LED.write(1);
          setTimeout(function () {
            LED.write(0);
          }, 250);
        }
      }
      pos = 0;
    }
  }
});
port.on('error', function(err) {
  // open errors will be emitted as an error event 
  console.log('port error: ', err.message);
});
