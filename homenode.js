var express     = require('express');
var api		      = require('node-express-yourself');
var http        = require('http');
var log         = require('./log.js')('homenode');
var master      = require('./master.js');
var app         = express();
var ssdp        = require('./ssdp.js');
var server      = http.Server(app);

var devices = [];

function addDevice(device) {
  devices.push(device);
  master.notifyDeviceChange();
  log('New device "'+device.name+'" registered.');
}

function removeDevice(id) {
  var idx=-1;
  devices.forEach(function(dev,i) {
    if( dev.id==id ) {
        idx=i;
    }
  });
  if( idx!=-1 ) {
    devices.splice(idx,1);
    master.notifyDeviceChange();
    log('Device "'+id+'" removed.');
    return true;
  } else {
    log('Device with "'+id+'" not found.');
    return false;
  }
}

var listDevices = function(req,res) {
  log('List devices call');
  res.send(devices);
}

var listMasters = function(req,res) {
  log('List masters call');
  res.send(master.masterNodes);
}

var heartbeat = function(req,res) {
  log('Heartbeat call');
  if( master.handleHeartbeat(req.query.id) ) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
}

var def = {
  node : {
    endpoints : {
      devices : {
        description : 'List devices',
        use : listDevices
      },
      heartbeat : {
        description : 'Heartbeat endpoint service',
        use : heartbeat
      },
      master : {
        description : 'List of master nodes this node is registered with',
        use : listMasters
      }
    }
  }
}
api.use(app,def);

module.exports = init;

function init(options) {
  var opt = options;
  if(!opt) {
    opt = {}
  }

  var port = opt.port || 9801;
  var name = opt.name || 'Unnamed node';
  var id = opt.id || 'FF';

  server.listen(port);
  log('Http node listener for ""'+name+'"" started on port '+port);

  master.init(port, id, name);
  ssdp.init(master);

  return {
    addDevice : addDevice,
    removeDevice : removeDevice,
    addApi : function(def) {
      api.use(app,def);
    }
  }
}
