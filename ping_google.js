var tcpp = require('tcp-ping');

setInterval(function() {
  // console.log("checking internet: ");
  tcpp.ping({ 
    address: 'www.google.com',
    port: 80,
    timeout: 2000,
    attempts: 3 
  }, function(err, data) {
    /* if (isNaN(data.avg)) {
      console.log("no internet!");
      _internet_available = 0;
    } else {
      _internet_available = 1;
    } */
    process.send(data.avg);
  }); 
}, 5000);
