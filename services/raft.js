var net = require('net');
var async=require('async');

var RaftConfig = require('./raft-config');

var Message = require('../lib/message2');
var WatchDog = require('../lib/watch-dog');

function Raft(nodeAddress, CmdHandler) {
    this._raftConfig = new RaftConfig(nodeAddress);
    this._cmdHandler = new CmdHandler(this._raftConfig);

    this._request=new RaftRequest(this._raftConfig);

    this._watchDog = new WatchDog(300);
    this._watchDog.timeout(function () {
        election.call(this);
    });
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
    var voteCount=1;
    var nodes = this._raftConfig.getNodes();
    var connectionManager=new ConnectionManager(nodes);
    var msg={
        term: 2,
        candidateId: 123,
        lastLogIndex: 33,
        lastLogTerm: 1
    };

    connectionManager.send('request-vote', msg, function(err, result){
        voteCount++;
    });
}

module.exports = Raft;