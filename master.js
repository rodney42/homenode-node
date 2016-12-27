/**
 * Handles the master connections
 */
var http        = require('http');
var log         = require('./log.js')('master');

var masterNodes = [];

module.exports.masterNodes = masterNodes;

var checkMasters = function () {
  log('Checking masters ...');
  var now = new Date();
  masterNodes.forEach(function(master) {
    if( (now-master.lastHeartbeat)>30000 ) {
      log('Removed stale master '+master.id);
      masterNodes.pop(master);
    }
  });
}
setInterval(checkMasters,10000);

var local = {};

var url = function(masternode, path) {
  return masternode.location+path;
}

var MasterIdEqual = function(master,id) {return master.id===id;}
var MasterLocationEqual = function(master,location) { return master.location===location;}
var findMaster = function(func, value) {
  for( var m=0; m<masterNodes.length; m++ ) {
    if (func(masterNodes[m],value)) {
      return masterNodes[m];
    }
  }
  return null;
}

var registerWithMaster=function(masternode) {
  var fullurl = url(masternode, '/keeper/register')+'?port='+local.port+'&id='+local.id+'&name='+local.name;
  log("Registration url : "+fullurl)
  http.get(fullurl, function(res) {
    log("Registering with master at " + masternode.host+':'+masternode.port);
    res.setEncoding('utf8');
    var data = '';

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function() {
      var masterInfo = JSON.parse(data);
      masternode.registered = new Date();
      masternode.lastHeartbeat = new Date();
      masternode.id = masterInfo.id;
      masternode.name = masterInfo.name;
      log("Registered with master id "+masternode.id+" with name "+masternode.name);
    });

    res.resume();

  })
  .on('error', function(e) {
    log("Registration error "+e);
    delete masternode.registered;
  });
}

module.exports.init = function(port,id,name) {
  local = {
    port : port,
    id : id,
    name : name
  }
  masterNodes.forEach( registerWithMaster );
}

/**
 * Add a new master
 */
module.exports.addMaster = function(location) {
  var existingMaster = findMaster(MasterLocationEqual,location);
  if( !existingMaster ) {
    var newmaster = {
      location : location
    }
    masterNodes.push(newmaster);
    registerWithMaster(newmaster);
    log('Added new master with location : '+location);
  } else {
    log('Master with location '+location+' already added.');
  }
}

/**
 * Handle a heartbeat from master
 */
module.exports.handleHeartbeat=function(masterid) {
  var master = findMaster(MasterIdEqual, masterid);
  if ( master == null ) {
    throw new Error("Master with id "+masterid+" not found.");
  }
  master.lastHeartbeat = new Date();
  return true;
}

/**
 * Notify a device change
 */
module.exports.notifyDeviceChange = function() {
  masterNodes.forEach( function(masternode) {
    if(masternode.registered) {
      var fullurl = url(masternode, '/keeper/notify?type=device');
      log("Device change url : "+fullurl)
      http.get(fullurl, function(res) {
        log("Device change notify done");
        res.resume();
      })
      .on('error', function(e) {
        log("Device change notify error "+e);
      });
    }
  });
}
