var moment = require('moment');
var debug = require('./helper/debug');

var ClientService = require('./services/client-service');
var NodeCmdHandler = require('./services/node-cmd-handler');
var ClusterConfig = require('./services/cluster-config');
var RaftState = require('./services/raft/states/raft-state');
var RequestService = require('./services/raft/lib/request-service');
var Initializer = require('./services/initializer');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPorts = process.argv[3].split(',');
var seeds = seedPorts.map(function (port) {
    return {
        host: seedHost,
        port: port
    };
});

var nodeAddress = {
    host: host,
    port: port
};

console.log(seeds);
var clusterConfig = new ClusterConfig(nodeAddress, seeds);
var cmdHandler = new NodeCmdHandler(clusterConfig);

var nodes = clusterConfig.getNodes();
console.log(nodes);

var raftState = new RaftState(clusterConfig.getNodeId(), nodes, cmdHandler);
var requestService = new RequestService(nodes);

var clientService = new ClientService(nodeAddress);
var initializer = new Initializer(raftState, requestService, clusterConfig);

initializer.start(function (err) {
    if (err) {
        console.log(err);
        return initializer.stop();
    }

    //if (seedPort) {
    //    clientService.addNode([{host: seedHost, port: seedPort}], function (err) {
    //        if (err) {
    //            console.log(err);
    //            return initializer.stop();
    //        }
    //    });
    //}
});