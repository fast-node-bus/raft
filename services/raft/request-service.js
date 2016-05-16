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

    function heartBeat(request) {
        var msg = createMsg(leaderId, term, prevLogTerm, prevLogIndex, commitIndex, []);
        request.send('append-entries', msg, function (err, result) {
            self._heartBeatCallback(err, result);
        });

        setTimeout(function () {
            heartBeat(request);
        }, HEART_BEAT_DELAY)
    }
}

RequestService.prototype.add = function (nodeInfo) {
    var self = this;
    var request = new Request(nodeInfo, self._timeout);
    var timer = new Timer(HEART_BEAT_DELAY);
    timer.start(function () {
        var msg = self._heartBeatMsg();
        request.send('append-entries', msg, function (err, result) {
            self._appendEntriesMsg(result);
        });
    });

    self._connections.addIndex({id: nodeInfo.id, timer: timer, request: request});
};

RequestService.prototype.send = function (id, msg) {
    var self = this;
    var connection = self._connections.getIndex(id);
    connection.timer.reset();
    connection.request.send('append-entries', msg, function (err, result) {
        self._appendEntriesMsg(result);
    });
};

RequestService.prototype.sendAll = function (msg, callback) {
    var self = this;
    var connections = self._connections.getAll();

    //self._callbacks[msg.commitIndex]=callback;

    connections.forEach(function (connection) {
        connection.timer.reset();
        connection.request.send('append-entries', msg, function (err, result) {
            if(err){
                return callback(err);
            }

            self._appendEntriesMsg(result);
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

module.exports = RequestService;