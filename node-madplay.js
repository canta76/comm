
var spawn = require('child_process').spawn
var events = require('events')
var util = require('util')

function MadSound () {
  events.EventEmitter.call(this)
}

util.inherits(MadSound, events.EventEmitter)

MadSound.prototype.play = function (fileName, amp) {
  this.stopped = false
  if (typeof this.process !== 'undefined') this.process.kill('SIGTERM') // avoid multiple play for the same istance
  const args = [
        "-a " + amp,
        fileName
    ];
  this.process = spawn('madplay', args)
  var self = this 
  this.process.on('exit', function (code, sig) {
    if (code !== null && sig === null) {
      self.emit('complete') 
    }
  })
}
MadSound.prototype.stop = function () {
  if (this.process) {
    this.stopped = true
    this.process.kill('SIGTERM')
    this.emit('stop')
  }
}
MadSound.prototype.pause = function () {
  if (this.process) {
    if (this.stopped) return true
    this.process.kill('SIGSTOP')
    this.emit('pause')
  }
}
MadSound.prototype.resume = function () {
  if (this.process) {
    if (this.stopped) return this.play()
    this.process.kill('SIGCONT')
    this.emit('resume')
  }
}

module.exports = MadSound

// autonomous execution: node node-aplay.js my-song.wav
if (!module.parent) {
  var player = new MadSound()
  player.play(process.argv[2])
}
