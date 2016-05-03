var net = require('net');

var Server = require('./server')
var Client = require('./client');

var SEED_DELAY = 1000;
var FIND_LEADER_ATTEMPT = 3;

function NodeService(clusterConfig) {
    this._clusterConfig = clusterConfig;
}


NodeService.prototype.start = function (callback) {
    var raftService=new RaftService(this._clusterConfig);
    raftService.start(function(err){
        if(err){
            return callback(err);
        }


    });
};

NodeService.prototype.listen = function (callback) {
    var nodeAddress=this._clusterConfig.nodeAddress;

    var server = net.createServer(function (socket) {
        var self = this;
        var message = new Message(socket);

        message.listen('add-node', function (nodeAddress, res) {
            if (self._clusterConfig.isLeader) {
                var nodeInfo = self._clusterConfig.createNodeInfo(nodeAddress);
                self._raft.set(nodeInfo, function (err) {
                    if (err) {
                        return res.send(err);
                    }

                    res.send(null);
                });
            } else {
                var leaderAddress = self._clusterConfig.getLeaderAddress();
                res.send(null, leaderAddress);
            }
        });

        message.listen('append-entries', function(type, msg, res){

        });
    });

    server.on('error', function (err) {
        callback(err);
    });

    server.listen(nodeAddress.port, nodeAddress.host, function () {
        callback(null);
    });
};

NodeService.prototype.addNode = function (seeds, callback) {
    var seedCounter = 0;
    var attempt = FIND_LEADER_ATTEMPT;
    var nodeAddress = this._clusterConfig.nodeAddress;

    function addNode(host, port) {
        var client = new Client(host, port);
        seedCounter++;
        client.addNode(nodeAddress, function (err, result) {
            if (err) {
                return callback(err);
            }

            if (seedCounter == seeds.length) {
                return callback(new Error('Seeds failed.'));
            }

            if (attempt === 0) {
                return callback(new Error('Find leader failed.'));
            }

            if (result.timeout) {
                var seed = seeds[seedCounter];
                return addNode(seed.host, seed.port, nodeAddress);
            }

            if (result.fail) {
                return setTimeout(function () {
                    var seed = seeds[seedCounter];
                    addNode(seed.host, seed.port, nodeAddress);
                }, SEED_DELAY);
            }

            if (result.notLeader) {
                attempt--;
                return addNode(result.host, result.port, nodeAddress);
            }

            callback(null);
        });
    }

    var seed = seeds[seedCounter];
    addNode(seed.host, seed.port, nodeAddress);
};

function addConnect(nodeAddress, callback) {
    var self = this;
    var nodeSocket = net.createConnection(nodeAddress.port, nodeAddress.host, function () {
        var node = new Message(nodeSocket);
        addNewNode.call(self, node);
        callback(null);
    });

    nodeSocket.on('error', function (err) {
        // TODO: mark node as unhealthy
        callback(err);
    });
}

module.exports = NodeService;