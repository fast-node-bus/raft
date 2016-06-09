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
        var message = new Message(socket);
        self.available = true;

        self._socketDefer.resolve(socket);
        self._messageDefer.resolve(message);
    });

    socket.on('error', function (err) {
        self.available = false;
    });

    socket.on('close', function () {
        self.available = false;
    });
};

RaftRequest.prototype.send = function (method, msg, callback) {
    var self = this;
    self._message = self._message.then(function (message) {
        console.log('Send msg: ' + method);
        message.send(method, msg, function (err, data) {
            console.log(data);
            if (err) {
                return callback(err);
            }

            clearTimeout(timer);
            callback(null, data);
        });

        var timer = setTimeout(function () {
            self.close();
            console.log('Request timeout.');
            callback(new Error('Request timeout.'));
        }, self._timeout);

        return message;
    });
};

RaftRequest.prototype.close = function () {
    var self = this;
    self._socketDefer.promise.then(function (socket) {
        console.log('Close connection.');
        socket.end();
        self._socketDefer = Q.defer();
        self._messageDefer = Q.defer();
        self._message = self._messageDefer.promise;
    });
};

module.exports = RaftRequest;