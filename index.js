var moment = require('moment');
var debug = require('./helper/debug');
var Message = require('./lib/message2');
var ClusterConfig = require('./service/cluster-config');

var host = 'localhost';
var port = process.argv[2];

var seedHost = 'localhost';
var seedPort = process.argv[3];

var nodeInfo = {
    host: host,
    port: port
};

require('./services/listener')(host, port, function (socket) {
    if(seedPort){
        var client = new Client(seedHost, seedPort);
        client.addNode(nodeInfo, function(err){
            if (err) {
                throw err;
            }
        });
    }else{
        nodeInfo.id = moment().format('x');
        nodeInfo.leader = true;
    }

    var clusterConfig = new ClusterConfig(nodeInfo);

    var raftMessage = new Message(socket);
    var coordinatorMessage = new Message(socket);

    var raftNode = new RaftNode(clusterConfig, raftMessage);
    var coordinator = new Coordinator(clusterConfig, coordinatorMessage);

    clusterService(clusterConfig, raftNode, coordinator);
});