var net = require('net');

var Message = require('../lib/message2');
var RequestService = require('./raft/lib/request-service');
var Follower = require('./raft/roles/follower');
var Candidate = require('./raft/roles/follower');
var Leader = require('./raft/roles/follower');

module.exports = function (raftState, clusterConfig, cmdHandler, callback) {
    var requestService = new RequestService();

    var follower = new Follower(raftState);
    var candidate = new Candidate(raftState, clusterConfig, requestService);
    var leader = new Leader(raftState, clusterConfig, requestService);
    var manager = new Manager(follower, candidate, leader);

    var server = net.createServer(function (socket) {
        var message = new Message(socket);

        message.listen('client-cmd', function (cmd, res) {
            if (clusterConfig.isLeader) {
                leader.exec(cmd, function (err, result) {
                    res.send(err, result);
                });
            } else {
                res.send(null, clusterConfig.getLeaderAddress());
            }
        });

        message.listen('append-entries', function (msg, res) {
            manager.appendEntries(msg, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('request-vote', function (msg, res) {
            manager.requestVote(msg, function (err, result) {
                res.send(err, result);
            });
        });
    });

    clusterConfig.onAddNode(function (nodeInfo) {
        requestService.addNode(nodeInfo);
        raftState.addNode(nodeInfo);
    });

    clusterConfig.onRemoveNode(function (nodeInfo) {
        requestService.removeNode(nodeInfo.id);
        raftState.removeNode(nodeInfo.id);
    });

    server.on('error', function (err) {
        callback(err);
    });

    server.listen(clusterConfig.nodeAddress.port, clusterConfig.nodeAddress.host, function () {
        callback(null);
    });


};