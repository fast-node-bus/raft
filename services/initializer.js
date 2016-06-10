var net = require('net');

var Message = require('../lib/message2');
var Follower = require('./raft/roles/follower');
var Candidate = require('./raft/roles/candidate');
var Leader = require('./raft/roles/leader');
var RoleManager = require('./raft/role-manager');

var debug=require('../helper/debug');

function Initializer(raftState, requestService, clusterConfig) {
    this._raftState = raftState;
    this._requestService = requestService;
    this._clusterConfig = clusterConfig;

    this._server = null;
}

Initializer.prototype.start = function (callback) {
    var self = this;

    var follower = new Follower(self._raftState);
    var candidate = new Candidate(self._raftState, self._clusterConfig, self._requestService);
    var leader = new Leader(self._raftState, self._clusterConfig, self._requestService);
    var manager = new RoleManager(follower, candidate, leader);

    manager.switchToFollower();

    self._server = net.createServer(function (socket) {
        var message = new Message(socket);
        debug('!!!Connect to server!!!');
        message.listen('client-cmd', function (cmd, res) {
            console.log('client-cmd');
            console.log(cmd);
            manager.exec(cmd, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('add-server', function (nodeAddress, res) {
            console.log('add-server');
            console.log(nodeAddress);
            manager.addServer(nodeAddress, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('remove-server', function (nodeAddress, res) {
            console.log('remove-server');
            console.log(nodeAddress);
            manager.removeServer(nodeAddress, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('append-entries', function (msg, res) {
            console.log('append-entries');
            console.log(msg);
            manager.appendEntries(msg, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('request-vote', function (msg, res) {
            console.log('request-vote');
            console.log(msg);
            manager.requestVote(msg, function (err, result) {
                res.send(err, result);
            });
        });
    });

    //this._clusterConfig.onAddNode(function (nodeInfo) {
    //    //self._requestService.addNode(nodeInfo);
    //    //self._raftState.addNode(nodeInfo);
    //});
    //
    //this._clusterConfig.onRemoveNode(function (nodeInfo) {
    //    //self._requestService.removeNode(nodeInfo.id);
    //    //self._raftState.removeNode(nodeInfo.id);
    //});

    self._server.on('error', function (err) {
        callback(err);
    });

    self._server.listen(self._clusterConfig.nodeInfo.port, self._clusterConfig.nodeInfo.host, function () {
        callback(null);
    });
};

Initializer.prototype.stop = function () {
    this._server.close();
};

module.exports = Initializer;