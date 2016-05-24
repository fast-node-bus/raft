var Request = require('./raft-request');
var IndexArray = require('../../../lib/index-array');

var HEART_BEAT_DELAY = 100;
var REQUEST_TIMEOUT = 200;

function RequestService() {
    this._connections = new IndexArray('id');
}

RequestService.prototype.add = function (nodeInfo, onHeartBeat) {
    var self = this;
    var request = new Request(nodeInfo, REQUEST_TIMEOUT);
    var timer = new Timer(HEART_BEAT_DELAY);
    timer.start(function () {
        onHeartBeat(nodeInfo.id);
    });

    self._connections.addIndex({id: nodeInfo.id, timer: timer, request: request, nodeInfo: nodeInfo});
};

RequestService.prototype.send = function (id, msg, callback) {
    var self = this;
    var connection = self._connections.getIndex(id);
    connection.timer.reset();
    if (!connection.request.available) {
        connection.request = new Request(connection.nodeInfo, REQUEST_TIMEOUT);
    }
    connection.request.send('append-entries', msg, function (err, result) {
        callback(err, result);
    });
};

RequestService.prototype.closeAll = function () {
    this._connections.forEach(function (connection) {
        connection.timer.stop();
        connection.request.close();
    });
};

module.exports = RequestService;