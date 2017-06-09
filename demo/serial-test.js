var m = require('mraa'); //require mraa
 
u = new m.Uart(1);
u.setBaudRate(115200);
u.setMode(8, 0, 1);
u.setFlowcontrol(false, false);

u.flush();
sleep(200);

for (var i = 0; i < 1000; i++)
{
  var buffer = new Buffer("000AA14A", 'hex'); 
  u.write(buffer);
  var b0 = new Buffer(1000); // rx buffer
  var bytes_to_read = 16;
  var pos = 0;
  var timeout_byte = 5;
  var timeout = 100 / timeout_byte;
  while ((bytes_to_read > 0) && (timeout > 0))
  {
    if (u.dataAvailable(timeout_byte))
    {  
      var byte_read = u.read(1);
      b0[pos] = byte_read[0];
      pos++;
      bytes_to_read--;
    }
    else
    {
      timeout--;
    }
  }
  if (!timeout)
  {
    console.log("timeout");
  }
  else if (b0[1] == 10)
  {
    //console.log(b0.slice(0, 16)); 
    var len = b0[0] - 1;
    var a = b0.slice(3, 3+len);
    var v = a.toString('utf8');
    //console.log(v);
    process.send({ 
      msg_type: "version", 
      msg_counter: i,
      msg_data: v  
    });
  }
  
  sleep(200);
}
