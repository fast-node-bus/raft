var net = require('net');
var async = require('async');

var RaftConfig = require('./raft-config');

var Message = require('../lib/message2');
var WatchDog = require('../lib/watch-dog');

function Raft(nodeAddress, CmdHandler) {
    var self=this;
    this._raftConfig = new RaftConfig(nodeAddress);
    this._cmdHandler = new CmdHandler(this._raftConfig);

    //***
    this._candidateService = new CandidateService(this._raftConfig);
    this._leaderService = new LeaderService(this._raftConfig, CmdHandler);
    this._followerService=new FollowerService(nodeAddress);


    this._watchDog = new WatchDog(300);
    this._watchDog.timeout(function () {
        self._candidateService.election(function(){
            self._leaderService.start();
        });
    });

    this._followerService.start();
}

Raft.prototype.exec = function (cmd, callback) {
    if (this._raftConfig.isLeader) {
        this._request(cmd, function (err) {
            if (err) {
                return callback(err);
            }

            this._cmdHandler.exec(cmd, function (err, result) {
                callback(err, result);
            });
        });
    } else {
        callback(null, this._raftConfig.getLeaderAddress());
    }
};

Raft.prototype.vote = function (msg, callback) {

};

Raft.prototype.appendEntries = function (msg, callback) {
    // TODO: operate msg

    this._cmdHandler.exec(msg.cmd, function (err, result) {
        callback(err, result);
    });
};

function election() {
    var self = this;
    var voteCount = 1;
    var msg = {
        term: 2,
        candidateId: 123,
        lastLogIndex: 33,
        lastLogTerm: 1
    };

    self._candidateService.election(
        function () {
            self._leaderService.start();
        }, function () {

        });
}

module.exports = Raft;