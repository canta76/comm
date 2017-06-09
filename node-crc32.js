function calc_word(crc, data)
{
  crc = crc ^ data;
  for (var i = 0; i < 32; i++)
  {
    if ((crc & 0x80000000) != 0)
    {
      crc = (crc << 1) ^ 0x04C11DB7;
    }
    else
    {
      crc = (crc << 1);
    }
  }
  return crc;
} 
function get_u32(b, pos)
{
  var n = 0;
  n += (b[pos + 0] <<  0);
  n += (b[pos + 1] <<  8);
  n += (b[pos + 2] << 16);
  n += (b[pos + 3] << 24);
  n = n >>> 0;
  return n;
}
function calc_crc32(b, len)
{
  var initial_value = 0xffffffff;
  var i = 0;
  while (i < len)
  {
    var n = get_u32(b, i);
    initial_value = calc_word(initial_value, n);
    i += 4;
  }
  initial_value = initial_value >>> 0;
  return initial_value;
}
// calcola il crc sui dati nel buffer
// len deve essere un multiplo di 4
exports.calc = function(b, len) 
{    
  return calc_crc32(b, len);
};
// verifica se il crc nel buffer è coerente con i dati
// len: lunghezza del buffer da controllare, comprende anche il crc32 in fondo
exports.check = function(b, len)
{
  var n0 = calc_crc32(b, len - 4);
  var n = get_u32(b, len - 4);
  return (n == n0);
}
// aggiunge il crc in fondo al buffer
// len: lunghezza del buffer da controllare, comprende anche il crc32 in fondo
exports.add = function(b, len)
{
  var n = calc_crc32(b, len);
  var b0 = new Buffer(len+4);
  b.copy(b0);
  b0[len + 0] = (n >>>  0) & 0xff;
  b0[len + 1] = (n >>>  8) & 0xff;
  b0[len + 2] = (n >>> 16) & 0xff;
  b0[len + 3] = (n >>> 24) & 0xff;
  return b0;
}
