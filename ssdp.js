var log         = require('./log.js')('ssdp');
var SSDP        = require('node-ssdp').Client;

module.exports.init=init;
function init(master) {
  var client = new SSDP({
  
    //    unicastHost: '192.168.11.63'
  });

  client.on('notify', function () {
    log('Got a notification.')
  });

  client.on('response', function inResponse(headers, code, rinfo) {
    //console.log('Got a response to an m-search:\n%d\n%s\n%s', code, JSON.stringify(headers, null, '  '), JSON.stringify(rinfo, null, '  '))
    log('Got a response with location : '+headers.LOCATION);
    master.addMaster(headers.LOCATION);
  });

  var search = function() {
    client.search('urn:homenode:device:Master:1');
    log("Searching for master ...");
    //client.search('ssdp:all');
  }
  setInterval(search, 10000);

  search();

  return {
    stop : function() {
      client.stop();
    }
  }

}
