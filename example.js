var homenode = require('./homenode.js')(
  {
    id : 'node1',
    port : 9876,
    name : 'Example node'
  }
);

homenode.addDevice({
  id : '4322',
  typ : 'sensor',
  name : 'TempSensor',
  description : 'Temperator sensor outside',
  state : 35.6
});

homenode.removeDevice('4322');

homenode.addDevice({
  id : '4323',
  typ : 'sensor',
  name : 'TempSensor',
  description : 'Temperator sensor inside',
  state : 21.6
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
