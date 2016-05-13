var Q = require('q');

var RaftRequest = require('./raft-request');

function CandidateService(raftConfig, timeout) {
    this._raftConfig = raftConfig;
    this._timeout = timeout;
}

CandidateService.prototype.election = function (callback) {
    var self = this;
    var deferred = Q.defer();

    var nodeId = self._raftConfig.getNodeId();
    var term = 5;
    var lastLogTerm = 2;
    var lastLogIndex = 45;

    var msg = createMsg(nodeId, term, lastLogTerm, lastLogIndex);
    var nodes = self._raftConfig.getNodes();
    var majority = (nodes.length / 2 + 1) | 0;
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

function createMsg(nodeId, term, lastLogTerm, lastLogIndex) {
    return {
        candidateId: nodeId,
        term: term,
        lastLogTerm: lastLogTerm,
        lastLogIndex: lastLogIndex
    };
}

module.exports = CandidateService;