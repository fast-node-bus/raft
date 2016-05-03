var moment = require('moment');
var debug = require('./helper/debug');
var Message = require('./lib/message2');

var ClusterConfig = require('./service/cluster-config');
var NodeService = require('./service/node-service');
var Client = require('./service/client');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPort = process.argv[3];

var nodeAddress = {
    host: host,
    port: port
};

var clusterConfig = new ClusterConfig(nodeAddress);
var nodeService = new NodeService(clusterConfig);

var raftService=new RaftService(clusterConfig);
raftService.start(function(err){
    if(err){
        throw err;
    }


});

nodeService.listen(host, port, function (err) {
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
        var nodeInfo = {
            id: 1,
            host: host,
            port: port,
            leader: true
        };

        clusterConfig.set(nodeInfo);
    }
});