var Request = require('./raft-request');
var IndexArray = require('../../lib/index-array');

var HEART_BEAT_DELAY = 100;

function RequestService(timeout) {
    this._timeout = timeout;
    this._connections = new IndexArray('id');

    this._appendEntriesMsg = function () {
        // nop
    };

    this._heartBeatMsg = function () {
        // nop
    };
}

RequestService.prototype.add = function (nodeInfo) {
    var self = this;
    var request = new Request(nodeInfo, self._timeout);
    var timer = new Timer(HEART_BEAT_DELAY);
    timer.start(function () {
        self._heartBeatMsg(nodeInfo.id, function(err){
            // TODO: error handle
        });
    });

    self._connections.addIndex({id: nodeInfo.id, timer: timer, request: request});
};

RequestService.prototype.send = function (id, msg, callback) {
    var self = this;
    var connection = self._connections.getIndex(id);
    connection.timer.reset();
    connection.request.send('append-entries', msg, function (err, result) {
        // TODO: reconnect if connection fail
        self._appendEntriesMsg(result, function(err){
            callback(err);
        });
    });
};

RequestService.prototype.sendAll = function (msg, callback) {
    var self = this;

    self._connections.forEach(function (connection) {
        connection.timer.reset();
        connection.request.send('append-entries', msg, function (err, result) {
            if (err) {
                return callback(err);
            }

            self._appendEntriesMsg(result, function(err){
                callback(err);
            });

            callback(null, result);
        });
    });
};

RequestService.prototype.onAppendEntries = function (callback) {
    this._appendEntriesMsg = callback;
};

RequestService.prototype.onHeartBeat = function (callback) {
    this._heartBeatMsg = callback;
};

RequestService.prototype.closeAll = function () {
    this._connections.forEach(function(connection){
        connection.timer.stop();
        connection.request.close();
    });
};

module.exports = RequestService;