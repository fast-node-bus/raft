var Request = require('./raft-request');
var IndexArray = require('../../../lib/index-array');

var IDLE_PERIOD = 100;
var REQUEST_TIMEOUT = 200;

function RequestService() {
    this._connections = new IndexArray('id');
}

RequestService.prototype.add = function (nodeInfo, onIdlePeriod) {
    var self = this;
    var request = new Request(nodeInfo, REQUEST_TIMEOUT);
    var timer = new Timer(IDLE_PERIOD);
    timer.start(function () {
        onIdlePeriod(nodeInfo.id);
    });

    self._connections.add({id: nodeInfo.id, timer: timer, request: request, nodeInfo: nodeInfo});
};

RequestService.prototype.send = function (method, id, msg, callback) {
    var self = this;
    var connection = self._connections.getIndex(id);
    // TODO: resent only if append-entry not heart-beat
    connection.timer.reset();
    if (!connection.request.available) {
        connection.request = new Request(connection.nodeInfo, REQUEST_TIMEOUT);
    }
    connection.request.send(method, msg, function (err, result) {
        callback(err, result);
    });
};

RequestService.prototype.close = function (id) {
    var connection = this._connections.getIndex(id);
    this._connections.remove(id);

    connection.timer.stop();
    connection.request.close();
};

RequestService.prototype.closeAll = function () {
    this._connections.forEach(function (connection) {
        connection.timer.stop();
        connection.request.close();
    });
    this._connections.clear();
};

module.exports = RequestService;