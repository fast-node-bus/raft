var net = require('net');
var Q = require('q');
//var debug=require('debug')('bus');
var debug=require('../../../helper/debug');

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
        debug('Create Connection!');
        var message = new Message(socket);
        self.available = true;

        self._socketDefer.resolve(socket);
        self._messageDefer.resolve(message);
    });

    // TODO: events can emit after create new request 'available=false', unsubscribe self._socketDefer - ???
    socket.on('error', function (err) {
        debug('Request Error:');
        debug(err);
        self.available = false;
    });

    socket.on('close', function () {
        debug('Request Close.');
        self.available = false;
    });
};

RaftRequest.prototype.send = function (method, msg, callback) {
    var self = this;
    self._message = self._message.then(function (message) {
        debug('Send msg: ' + method);
        message.send(method, msg, function (err, data) {
            debug('Response:');
            debug(data);
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
    self.available = false;
    console.log('----Close connection.-----');
    self._socketDefer.promise.then(function (socket) {
        // TODO: 1. unsubscribe socket.error, socket.close - ???
        // TODO: 2. very many 'Close connection'
        console.log('Close connection.');
        socket.end();

        self._socketDefer = Q.defer();
        self._messageDefer = Q.defer();
        self._message = self._messageDefer.promise;
    });
};

module.exports = RaftRequest;