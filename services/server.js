var Message = require('../lib/message2');

function Server(clusterConfig) {
    this._clusterConfig=clusterConfig;
}

Server.prototype.listen = function (callback) {
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