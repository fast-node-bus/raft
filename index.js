var moment = require('moment');
var debug = require('./helper/debug');
var Message = require('./lib/message2');

var ClientService = require('./services/client-service');
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

var clientService = new ClientService(nodeAddress);

var raftService = new RaftService(nodeAddress);
var coordinator = new Coordinator(raftService);

coordinator.start(host, port, function (err) {
    if (err) {
        throw err;
    }

    if (seedPort) {
        clientService.addNode([{host: seedHost, port: seedPort}], function (err) {
            if (err) {
                throw err;
            }
        });
    } else {
        raftService.setAsLeader(nodeAddress);
    }
});