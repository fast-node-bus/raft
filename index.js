var moment = require('moment');
var debug = require('./helper/debug');

var ClientService = require('./services/client-service');
var NodeCmdHandler = require('./services/node-cmd-handler');
var RaftConfig = require('./services/raft-config');
var initializer = require('./services/initializer');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPort = process.argv[3];

var nodeAddress = {
    host: host,
    port: port
};

var raftConfig = new RaftConfig(nodeAddress);
var cmdHandler = new NodeCmdHandler(raftConfig);
var clientService = new ClientService(nodeAddress);

initializer(raftConfig, cmdHandler, function (err) {
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