var net = require('net');
var FollowerService = require('./raft/follower-service');
var CandidateService = require('./raft/candidate-service');
var LeaderService = require('./raft/leader-service');

var Message = require('../lib/message2');

var RESPONSE_TIMEOUT = 100;

module.exports = function (raftConfig, cmdHandler, callback) {
    //var commitLog=new CommitLog();

    var followerService = new FollowerService(raftConfig, cmdHandler);
    var candidateService = new CandidateService(raftConfig, RESPONSE_TIMEOUT);
    var leaderService = new LeaderService(raftConfig, cmdHandler, RESPONSE_TIMEOUT);

    var electionTimer = new ElectionTimer(300);

    electionTimer.timeout(function () {
        candidateService.election(function () {
            electionTimer.stop();
            raftConfig.setLeader();
            leaderService.start();
        });
    });

    var server = net.createServer(function (socket) {
        var message = new Message(socket);

        message.listen('client-cmd', function (cmd, res) {
            if (raftConfig.isLeader) {
                leaderService.exec(cmd, function (err, result) {
                    res.send(err, result);
                });
            } else {
                res.send(null, raftConfig.getLeaderAddress());
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

    server.listen(raftConfig.nodeAddress.port, raftConfig.nodeAddress.host, function () {
        callback(null);
    });


};