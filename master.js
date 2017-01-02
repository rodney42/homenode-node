/**
 * Handles the master connections
 */
var http        = require('http');
var log         = require('./log.js')('master');
var urlHelper   = require('url');
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
      log("Master data "+data);
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


function obj(input) {
  for( var p in input ) {
    if( ! (typeof input[p] === 'function' ) ) {
      console.log( p+':'+input[p]);
    }
  }
}

/**
 * Send a notify
 */
module.exports.notify = function(data) {
  var payload = {
    type : data.type,
    nodeid : local.id,
    device : data.device,
    event : data.event,
    payload : data.payload,
  }

  var postData = JSON.stringify(payload);

  masterNodes.forEach( function(masternode) {
    if(masternode.registered) {
      var notifyUrl = url(masternode, '/keeper/notify');
      log("Notify url : "+notifyUrl);
      var connectionData = urlHelper.parse(notifyUrl,true);
      obj(connectionData);
      var options = {
        hostname: connectionData.hostname,
        port: connectionData.port,
        path: connectionData.path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
      };
      var req = http.request(options, function(res) {
        log('STATUS: ' + res.statusCode);
        log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
          log('PARTIAL BODY: ' + chunk);
          data += chunk;
        });
        res.on('end', function() {
           log('COMPLETE BODY: ' + data);
        });
        req.on('error', function(e) {
           log('problem with request: ' + e.message);
        });
      });
      // write data to request body
      req.write(postData);
      log('Postdata:'+postData);
      req.end();
    }
  });
}
