var moment = require('moment');
var debug = require('./helper/debug');

var ClientService = require('./services/client-service');
var NodeCmdHandler = require('./services/node-cmd-handler');
var ClusterConfig = require('./services/cluster-config');
var RaftState=require('./services/raft/states/raft-state');
var initializer = require('./services/initializer');

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

initializer(raftState, clusterConfig, cmdHandler, function (err) {
    if (err) {
        throw err;
    }

    if (seedPort) {
        clientService.addNode([{host: seedHost, port: seedPort}], function (err) {
            if (err) {
                throw err;
            }
        });
    }
});