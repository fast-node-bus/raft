var moment = require('moment');
var debug = require('./helper/debug');

var ClientService = require('./services/client-service');
var NodeCmdHandler = require('./services/node-cmd-handler');
var ClusterConfig = require('./services/cluster-config');
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
var clientService = new ClientService(nodeAddress);

initializer(clusterConfig, cmdHandler, function (err) {
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