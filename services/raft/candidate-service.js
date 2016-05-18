var Q = require('q');

var RaftRequest = require('./raft-request');

function CandidateService(clusterConfig, raftState, timeout) {
    this._clusterConfig = clusterConfig;
    this._raftState = raftState;
    this._timeout = timeout;
}

CandidateService.prototype.election = function (callback) {
    var self = this;
    var deferred = Q.defer();

    var msg = self._raftState.createVoteMsg();
    var nodes = self._clusterConfig.getNodes();
    var majority = self._clusterConfig.getMajority();
    var voteCount = 1;

    if (majority == 1) {
        deferred.resolve(voteCount);
    } else {
        var requests = [];
        nodes.forEach(function (nodeInfo) {
            var request = new RaftRequest(nodeInfo, self._timeout);
            request.send('request-vote', msg, function (err, voteGranted) {
                if (err) {
                    deferred.reject(err);
                }

                if (voteGranted) {
                    voteCount++;
                }

                if (voteCount >= majority) {
                    requests.forEach(function (req) {
                        req.close();
                    });
                    deferred.resolve(voteCount);
                }

                request.close();
            });

            requests.push(request);
        });
    }

    deferred.promise
        .then(function () {
            callback(null);
        }).catch(function (err) {
            callback(err);
        });
};

module.exports = CandidateService;