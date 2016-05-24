var net = require('net');
var Q = require('q');

var Message = require('../../../lib/message2');

function RaftRequest(nodeInfo, timeout) {
    var self = this;
    var deferred = Q.defer();

    self._timeout = timeout;
    self.available = false;

    self._socket = net.createConnection(nodeInfo.port, nodeInfo.host, function () {
        var message = new Message(self._socket);
        self.available = true;
        deferred.resolve(message);
    });

    self._socket.on('error', function (err) {
        self.available = false;
    });

    self._socket.on('close', function () {
        self.available = false;
    });


    this._message = deferred.promise;
}

RaftRequest.prototype.send = function (method, msg, callback) {
    var self = this;
    self._message = self._message.then(function (message) {
        message.send(method, msg, function (err, data) {
            if (err) {
                return callback(err);
            }

            clearTimeout(timerId);
            callback(null, data);
        });

        var timerId = setTimeout(function () {
            self.close();
            callback(new Error('Request timeout.'));
        }, self._timeout);

        return message;
    });
};

RaftRequest.prototype.close = function () {
    self._socket.end();
};

module.exports = RaftRequest;