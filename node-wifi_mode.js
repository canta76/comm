
var spawn = require('child_process').spawn
var events = require('events')
var util = require('util')

function WifiMode() {
  events.EventEmitter.call(this)
}

util.inherits(WifiMode, events.EventEmitter)

WifiMode.prototype.Restart = function() {
  if (typeof this.process !== 'undefined') this.process.kill('SIGTERM') // avoid multiple play for the same istance
  const args = [        
    ];
  this.process = spawn('wifi', args)
  var self = this 
  this.process.on('exit', function (code, sig) {
    if (code !== null && sig === null) {
      self.emit('complete')
    }
  })
}
WifiMode.prototype.StartAP = function() {  
  if (typeof this.process !== 'undefined') this.process.kill('SIGTERM') // avoid multiple play for the same istance
  const args = [
        "ap"        
    ];
  this.process = spawn('wifi_mode', args)
  var self = this 
  this.process.on('exit', function (code, sig) {
    if (code !== null && sig === null) {
      //self.emit('complete') 
      this.Restart();
    }
  })
}

/*
WifiMode.prototype.stop = function() {
  if (this.process) {
    this.stopped = true
    this.process.kill('SIGTERM')
    this.emit('stop')
  }
}
WifiMode.prototype.pause = function() {
  if (this.process) {
    if (this.stopped) return true
    this.process.kill('SIGSTOP')
    this.emit('pause')
  }
}
WifiMode.prototype.resume = function() {
  if (this.process) {
    if (this.stopped) return this.play()
    this.process.kill('SIGCONT')
    this.emit('resume')
  }
}
*/

module.exports = WifiMode

// autonomous execution: node node-aplay.js my-song.wav
if (!module.parent) {
  var m = new WifiMode();
  m.StartAP();
}
