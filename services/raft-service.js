var Message = require('../lib/message2');

function RaftService(nodeAddress, raft) {
    this._nodeAddress = nodeAddress;
    this._raft = raft;
}

RaftService.prototype.start = function (host, port, callback) {
    var server = net.createServer(function (socket) {
        var self = this;
        var message = new Message(socket);

        message.listen('client-cmd', function (cmd, res) {
            self._raft.exec(cmd, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('append-entries', function (msg, res) {
            self._raft.appendEntries(msg, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('request-vote', function (msg, res) {
            var result = self._raft.vote(msg);
            res.send(null, result);
        });
    });

    server.on('error', function (err) {
        callback(err);
    });

    server.listen(this._nodeAddress.port, this._nodeAddress.host, function () {
        callback(null);
    });
};

module.exports = RaftService;