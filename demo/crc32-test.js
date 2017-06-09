var buf = new Buffer([
  10, 20, 30, 40,
  10, 20, 30, 40,
  10, 20, 30, 40,
  10, 20, 30, 150,
]);

var crc = require('../node-crc32.js');
var crc_value = crc.calc(buf, 16);
var buf2 = crc.add(buf, 16);
if (crc.check(buf2, 20))
{
  console.log("buf2 ok");
}
console.log(crc_value.toString(16));
