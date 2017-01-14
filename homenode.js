var express     = require('express');
var api		      = require('node-express-yourself');
var http        = require('http');
var log         = require('./log.js')('homenode');
var master      = require('./master.js');
var app         = express();
var ssdp        = require('./ssdp.js');
var server      = http.Server(app);

var devices = [];

function getDeviceIndex(id) {
  var idx=-1;
  devices.forEach(function(dev,i) {
    if( dev.id==id ) {
        idx=i;
    }
  });
  return idx;
}

function getDeviceAction(device,actionname) {
  var action;
  device.actions.forEach(function(a) {
    if( a.name == actionname ) {
      action=a;
    }
  });
  return action;
}

function addDevice(device) {
  if( !device.id ) {
    throw "Device ID must be set."
  }
  device.fireEvent = function(eventName,payload) {
    master.notify(
      {
        type : 'event',
        event : eventName,
        device : device.id,
        state : device.state,
        payload : payload
      }
    );
  }

  devices.push(device);

  master.notify( {
    type: 'newdevice',
    device : device.id
  });
  log('New device "'+device.name+'" registered.');
  return device;
}

var getDevice = function(req,res) {
  var idx = getDeviceIndex(req.params.deviceid);
  if( idx==-1 ) {
    res.sendStatus(404);
  } else {
    res.send(devices[idx]);
  }
}

var executeDeviceAction = function(req,res) {
  var device = getDeviceById(req.params.deviceid);
  if( device ) {
    var action = getDeviceAction(device, req.params.actionname);
    if( action ) {
      action.use(device,action);
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(404);
  }
}

function getDeviceById(id) {
  var idx = getDeviceIndex(id);
  return (idx==-1 ? null : devices[idx]);
}

function removeDevice(id) {
  var idx=getDeviceIndex(id);
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
      device: {
        path : "devices/:deviceid",
        description : "Gets a device by id",
        parameter : {
          deviceid : { description : "Device ID", path : true }
        },
        use : getDevice
      },
      deviceAction: {
        path : "devices/:deviceid/:actionname",
        description : "Executes a device action",
        parameter : {
          deviceid : { description : "Device ID", path : true },
          actionname : { description : "Action name", path : true }
        },
        use : executeDeviceAction
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
  log('Http node listener for "'+name+'" started on port '+port);

  master.init(port, id, name);
  ssdp.init(master);

  return {
    addDevice : addDevice,
    getDevice : getDeviceById,
    removeDevice : removeDevice
  }
}
