var net = require('net');
var Q = require('q');

var Message = require('../../../lib/message2');

function RaftRequest(host, port, timeout) {
    var self = this;
    self._host = host;
    self._port = port;
    self._deferred = Q.defer();

    self._timeout = timeout;
    self.available = false;

    self._socketDefer = Q.defer();
    self._messageDefer = Q.defer();
    self._message = self._messageDefer.promise;

}

RaftRequest.prototype.start = function () {
    var self = this;

    var socket = net.createConnection(self._port, self._host, function () {
        var message = new Message(self._socket);
        self.available = true;

        self._socketDefer.resolve(socket);
        self._messageDefer.resolve(message);
    });

    self._socket.on('error', function (err) {
        self.available = false;
    });

    self._socket.on('close', function () {
        self.available = false;
    });
};

RaftRequest.prototype.send = function (method, msg, callback) {
    var self = this;
    self._message = self._message.then(function (message) {
        message.send(method, msg, function (err, data) {
            if (err) {
                return callback(err);
            }

            clearTimeout(timer);
            callback(null, data);
        });

        var timer = setTimeout(function () {
            self.close();
            callback(new Error('Request timeout.'));
        }, self._timeout);

        return message;
    });
};

RaftRequest.prototype.close = function () {
    self._socketDefer.promise(function (socket) {
        socket.end();
        self._socketDefer = Q.defer();
        self._messageDefer = Q.defer();
        self._message = self._messageDefer.promise;
    });
};

module.exports = RaftRequest;