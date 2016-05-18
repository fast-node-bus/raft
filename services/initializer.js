var net = require('net');
var FollowerService = require('./raft/follower-service');
var CandidateService = require('./raft/candidate-service');
var LeaderService = require('./raft/leader-service');

var Message = require('../lib/message2');

var RESPONSE_TIMEOUT = 100;

// TODO: set leader 1. for self; 2. for other followers;
module.exports = function (clusterConfig, cmdHandler, callback) {
    var raftState = new RaftState();
    var commitLog = new CommitLog();

    var followerService = new FollowerService(clusterConfig, raftState, commitLog, cmdHandler);
    var candidateService = new CandidateService(clusterConfig, raftState, RESPONSE_TIMEOUT);
    var leaderService = new LeaderService(clusterConfig, raftState, commitLog, cmdHandler, RESPONSE_TIMEOUT);

    var electionTimer = new ElectionTimer(300);

    electionTimer.timeout(function () {
        candidateService.election(function () {
            electionTimer.stop();
            raftState.setLeader();
            leaderService.start();
        });
    });

    var server = net.createServer(function (socket) {
        var message = new Message(socket);

        message.listen('client-cmd', function (cmd, res) {
            if (raftState.isLeader) {
                leaderService.exec(cmd, function (err, result) {
                    res.send(err, result);
                });
            } else {
                res.send(null, clusterConfig.getLeaderAddress());
            }
        });

        message.listen('append-entries', function (msg, res) {
            electionTimer.reset();
            followerService.appendEntries(msg, function (err, result) {
                res.send(err, result);
            });
        });

        message.listen('request-vote', function (msg, res) {
            followerService.vote(msg, function (err, result) {
                if (err) {
                    return res.send(err);
                }

                if (result.voteGranted) {
                    electionTimer.reset();
                }

                res.send(null, result);
            });
        });
    });

    server.on('error', function (err) {
        callback(err);
    });

    server.listen(clusterConfig.nodeAddress.port, clusterConfig.nodeAddress.host, function () {
        callback(null);
    });


};