var inspect = require('eyespect').inspector()
var interfaceAddresses = require('interface-addresses')
var ip = require('ip');

setInterval(function() {
  // console.log("checking interfaces...");
  var addr = interfaceAddresses();
  // inspect(addr, 'network interface IPv4 addresses (non-internal only)');
  var buf = new Buffer(12).fill(0);
  var offset = 0;
  for (var prop_name in addr) {
    // console.log(prop_name); // questo visualizza il nome delle interfacce
    var ip_str = addr[prop_name];
    ip.toBuffer(ip_str, buf, offset);
    offset += 4;
    if (offset >= buf.length)
      break;
  }
  // console.log(buf);
  process.send(buf); // invio il buffer al chiamante
}, 10000);
