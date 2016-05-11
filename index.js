var moment = require('moment');
var debug = require('./helper/debug');

var ClientService = require('./services/client-service');
var NodeCmdHandler = require('./services/node-cmd-handler');
var RaftService = require('./services/raft-service');
var Raft = require('./services/raft');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPort = process.argv[3];

var nodeAddress = {
    host: host,
    port: port
};

var cmdHandler = new NodeCmdHandler();

var raft = new Raft(nodeAddress, cmdHandler);
var raftService = new RaftService(nodeAddress, raft);

var clientService = new ClientService(nodeAddress);

raftService.start(host, port, function (err) {
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