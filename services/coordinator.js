var Message = require('../lib/message2');

function Coordinator(raftService) {
    this._raftService = raftService;
}

Coordinator.prototype.start = function (host, port, callback) {
    var server = net.createServer(function (socket) {
        var self = this;
        var message = new Message(socket);

        message.listen('add-node', function (nodeAddress, res) {
            if (self._raftService.isLeader) {
                self._raftService.addNode(nodeAddress, function (err) {
                    if (err) {
                        return res.send(err);
                    }

                    res.send(null);
                });
            } else {
                var leaderAddress = self._raftService.getLeaderAddress();
                res.send(null, leaderAddress);
            }
        });
    });

    server.on('error', function (err) {
        callback(err);
    });

    server.listen(port, host, function () {
        callback(null);
    });
};