var Request = require('./raft-request');
var IndexArray = require('../../../lib/index-array');
var Timer = require('../lib/timer');

var IDLE_PERIOD = 100;
var REQUEST_TIMEOUT = 2000;

function RequestService(nodes) {
    var self = this;
    self._isStart = false;
    self._connections = new IndexArray('id');
    self._idlePeriodFunc = null;

    nodes.forEach(function (nodeInfo) {
        self.addNode(nodeInfo);
    });
}

RequestService.prototype.addNode = function (nodeInfo) {
    var self = this;
    var request = new Request(nodeInfo.host, nodeInfo.port, REQUEST_TIMEOUT);
    var timer = new Timer(IDLE_PERIOD);

    if (self._isStart) {
        request.start();
        timer.start(function () {
            console.log('Request Timer elapsed: ' + nodeInfo.id);
            self._idlePeriodFunc(nodeInfo.id);
        });
    }

    self._connections.add({id: nodeInfo.id, timer: timer, request: request, nodeInfo: nodeInfo});
};

RequestService.prototype.removeNode = function (id) {
    var self = this;
    self.close(id);
    self._connections.remove(id);
};

RequestService.prototype.start = function (idlePeriodFunc) {
    var self = this;
    self._idlePeriodFunc = idlePeriodFunc;
    self._isStart = true;
    self._connections.forEach(function (connection) {
        connection.request.start();
        connection.timer.start(function () {
            console.log('Request Timer elapsed: ' + connection.id);
            self._idlePeriodFunc(connection.id);
        });
    });
};

RequestService.prototype.stop = function () {
    var self = this;
    self._isStart = false;
    self.closeAll();
};

RequestService.prototype.send = function (method, id, msg, callback) {
    var self = this;
    var connection = self._connections.get(id);

    // TODO: resent only if append-entry not heart-beat
    connection.timer.reset();
    if (!connection.request.available) {
        connection.request = new Request(connection.nodeInfo.host, connection.nodeInfo.port, REQUEST_TIMEOUT);
    }
    connection.request.send(method, msg, function (err, result) {
        callback(err, result);
    });
};

RequestService.prototype.close = function (id) {
    var self = this;
    var connection = self._connections.get(id);

    connection.timer.stop();
    connection.request.close();
};

RequestService.prototype.closeAll = function () {
    var self = this;
    self._connections.forEach(function (connection) {
        connection.timer.stop();
        connection.request.close();
    });
};

RequestService.prototype.removeAll = function () {
    var self = this;
    self.closeAll();
    self._connections.clear();
};

module.exports = RequestService;