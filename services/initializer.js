var Q = require('q');
var Message = require('../lib/message2');

module.exports = function (host, port) {
    var deferred = Q.defer();
    var socket = new net.Socket();

    socket.connect(port, host, function () {
        var message = new Message(socket);
        deferred.resolve(message);
    });

    socket.on('error', function (err) {
        deferred.reject(err);
    });

    return {
        addNode: function (nodeInfo, callback) {
            deferred.promise
                .then(function (message) {
                    message.send('add-node', nodeInfo, function (err) {
                        callback(err);
                    });
                })
                .catch(function (err) {
                    callback(err);
                })
        }
    }
};