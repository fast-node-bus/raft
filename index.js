var moment = require('moment');
var debug = require('./helper/debug');
var Message = require('./lib/message2');

var NodeService = require('./service/node-service');
var RaftService = require('./services/raft-service');
var Coordinator = require('./services/coordinator');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPort = process.argv[3];

var nodeAddress = {
    host: host,
    port: port
};

var nodeService = new NodeService(nodeAddress);

var raftService = new RaftService(nodeAddress);
var coordinator = new Coordinator(raftService);

coordinator.start(host, port, function (err) {
    if (err) {
        throw err;
    }

    if (seedPort) {
        nodeService.addNode([{host: seedHost, port: seedPort}], function (err) {
            if (err) {
                throw err;
            }
        });
    } else {
        raftService.setAsLeader(nodeAddress);
    }
});