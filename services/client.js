var net = require('net');
var Q = require('q');

var Message = require('../lib/message2');

var RESPONSE_TIMEOUT = 1000;

function Client(host, port) {
    this._host = host;
    this._port = port;
}

Client.prototype.addNode = function (nodeAddress, callback) {
    var deferred = Q.defer();

    var socket = net.createConnection(this._port, this._host, function () {
        var message = new Message(socket);
        var cmd = {
            name: 'add-node',
            value: nodeAddress
        };

        message.send('client-cmd', cmd, function (err, leaderAddress) {
            if (err) {
                return deferred.reject(err);
            }

            if (leaderAddress) {
                var result = {
                    notLeader: true,
                    host: leaderAddress.host,
                    port: leaderAddress.port
                };

                return deferred.resolve(result);
            }

            deferred.resolve({ok: true});
        });

        setTimeout(function () {
            deferred.resolve({timeout: true});
        }, RESPONSE_TIMEOUT)
    });

    socket.on('error', function (err) {
        deferred.resolve(null, {fail: true});
    });

    deferred.promise.then(function (reslut) {
        callback(reslut);
    }).catch(function (err) {
        callback(err);
    }).finally(function () {
        socket.end();
    });
};

module.exports = Client;