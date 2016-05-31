var moment = require('moment');
var debug = require('./helper/debug');

var ClientService = require('./services/client-service');
var NodeCmdHandler = require('./services/node-cmd-handler');
var ClusterConfig = require('./services/cluster-config');
var RaftState=require('./services/raft/states/raft-state');
var Initializer = require('./services/initializer');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPort = process.argv[3];

var nodeAddress = {
    host: host,
    port: port
};

var clusterConfig = new ClusterConfig(nodeAddress);
var cmdHandler = new NodeCmdHandler(clusterConfig);
var raftState = new RaftState(clusterConfig.getNodeId(), cmdHandler);
var clientService = new ClientService(nodeAddress);
var initializer=new Initializer(raftState, clusterConfig, cmdHandler);

initializer.start(function (err) {
    if (err) {
        console.log(err);
        return initializer.stop();
    }

    if (seedPort) {
        clientService.addNode([{host: seedHost, port: seedPort}], function (err) {
            if (err) {
                console.log(err);
                return initializer.stop();
            }
        });
    }
});