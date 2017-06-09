const cp = require('child_process');
const comm = cp.fork(__dirname + '/../comm.js');

comm.on('message', function(m) {
  if (m.msg_type == "version") { 
    console.log('comm message: ' + m.msg_counter + ' ' + m.msg_data);
  }
});

//comm.send({ cmd: 'start' });
 


 




 


/*
var MadSound = require('./node-madplay.js');
//new MadSound().play('/IoT/examples/sound/ReadBetweenTheLines.mp3');
var music = new MadSound();
music.play('/IoT/examples/sound/ReadBetweenTheLines.mp3');
setTimeout(function () {
  music.stop(); 
  console.log('Music stopped!');
}, 5000);
music.on('complete', function () {
  console.log('Done with playback!');
}); 
*/
 



/*
var Sound = require('./node-aplay.js');
//new Sound().play('/IoT/examples/demo1.wav');
  

var music = new Sound();
//music.play('/IoT/examples/demo3.wav');
music.play('/Media/USB-A1/demo2.wav');

setTimeout(function () {
	music.pause(); // pause the music after five seconds
}, 5000);

setTimeout(function () {
  music.resume(); // and resume it two seconds after pausing
}, 7000);

// you can also listen for various callbacks:
music.on('complete', function () {
  console.log('Done with playback!');
});
*/

/*
var http = require("http");
http.createServer(function (request, response) {
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   response.writeHead(200, {'Content-Type': 'text/plain'});
   
   // Send the response body as "Hello World"
   response.end('Hello World\n');
}).listen(8081);




buf = new Buffer(256);
len = buf.write("Simply Easy Learning");
console.log("Octets written : "+  len);
console.log(buf);



var h_counter = 0;
function printHello(){
   console.log( "Hello x! " + h_counter);
   h_counter++;
   //setTimeout(printHello, 500);
}
// Now call above function after 2 seconds
setInterval(printHello, 2000);
*/


/*
var fs = require("fs");

// sync
var data = fs.readFileSync('prova.txt');
console.log(data.toString());
console.log("Read file done");

// async
fs.readFile('prova.txt', function (err, data) {
   if (err) return console.error(err);
   console.log(data.toString());
});
console.log("Read2 done");
*/








var net = require('net');

var clients = []; // Keep track of the chat clients

var my_server = net.createServer(function(socket) {
  //socket.name = socket.remoteAddress + ":" + socket.remotePort; // identify this client
  console.log("socket name: " + socket.remoteAddress + "\n");  
  //clients.push(socket); // put this new client in the list
	socket.write("Welcome!"); // send a message to the client
  
  // Handle incoming messages from clients.
  socket.on('data', function (data) {
    //broadcast(socket.name + "> " + data, socket);
    console.log(data);
  }); 

	//socket.pipe(socket);
}).listen(8090);

// my_server.listen(8090, '127.0.0.1');
console.log("Chat server running at port 8090\n");
