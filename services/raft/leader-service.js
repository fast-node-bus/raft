var Q = require('q');

var RaftRequest = require('./raft-request');

function LeaderService(raftConfig, cmdHandler, timeout) {
    this._raftConfig = raftConfig;
    this._cmdHandler = cmdHandler;
    this._timeout = timeout;

    this._timer = new Timer(200);
}

LeaderService.prototype.exec = function (cmd, callback) {
    var self = this;
    self._request(cmd, function (err) {
        if (err) {
            return callback(err);
        }

        self._cmdHandler.exec(cmd, function (err, result) {
            callback(err, result);
        });
    });
};

LeaderService.prototype.start = function () {
    var self = this;


    var deferred = Q.defer();

    var leaderId = self._raftConfig.getNodeId();
    var term = 5;
    var prevLogTerm = 2;
    var prevLogIndex = 45;
    var commitIndex = 44;

    self._timer.start(function () {
        var msg = createMsg(leaderId, term, prevLogTerm, prevLogIndex, commitIndex, []);
        var nodes = self._raftConfig.getNodes();
        //var majority = (nodes.length / 2 + 1) | 0;

        var requests = [];
        var promiseCount = 1;
        nodes.forEach(function (nodeInfo) {
            var request = new RaftRequest(nodeInfo, self._timeout);
            request.send('append-entries', msg, function (err, voteGranted) {
                if (err) {
                    deferred.reject(err);
                }

                if (voteGranted) {
                    promiseCount++;
                }

                if (promiseCount >= majority) {
                    requests.forEach(function (req) {
                        req.close();
                    });
                    deferred.resolve(voteCount);
                }

                request.close();
            });

            requests.push(request);
        });

        deferred.promise
            .then(function () {
                callback(null);
            }).catch(function (err) {
                callback(err);
            });
    });

};

LeaderService.prototype.stop = function () {

};

module.exports = LeaderService;