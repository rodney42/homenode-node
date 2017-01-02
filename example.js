var homenode = require('./homenode.js')(
  {
    id : 'node1',
    port : 9876,
    name : 'Example node'
  }
);

var temp1Device = homenode.addDevice({
  id : 'temp1',
  typ : 'sensor',
  name : 'TempSensor',
  description : 'Temperator sensor outside',
  state : 35.6,
  events : [
    { name : "TempChange",
      description : "The temparature reading changed"
    }
  ]
});

var temp2Device =homenode.addDevice({
  id : 'temp2',
  typ : 'sensor',
  name : 'TempSensor',
  description : 'Temperator sensor inside',
  state : 21.1,
  events : [
    { name : "TempChange",
      description : "The temparature reading of the inside sensor changed"
    }
  ]
});

homenode.addDevice({
  id : '1234',
  typ : 'switch',
  name : 'Example switch',
  state : 'on',
  description : 'Example switch',
  actions : [
    {
      name : 'on',
      description : 'switch on',
      use : function() {
        console.log("Switch is set to on.");
      }
    },
    {
      name : 'off',
      description : 'switch off',
      use : function() {
        console.log("Switch is set to off.");
      }
    }
  ],
  events : [
    {
      name : 'triggered',
      description : 'Switch was triggered'
    }
  ]
});

// Simulate temparture change
setInterval(function() {
  temp1Device.state+=0.1;
  temp2Device.state+=0.05;
  temp1Device.fireEvent('TempChanged',temp1Device.state);
  temp2Device.fireEvent('TempChanged',temp2Device.state);
},6000);
