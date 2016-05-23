var util = require('util');
var BaseState = require('./base-state');

var ELECTION_TIMEOUT=300;

function Candidate(raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);

    this._timer = new ElectionTimer(ELECTION_TIMEOUT);
}

util.inherits(Candidate, BaseState);

Candidate.prototype.start = function () {
    var self = this;

    //**********************************
    self._timer.start(function () {
        self._context.switchToCandidate();
    });
    //**********************************

    var deferred = Q.defer();

    var nodeId=self._clusterConfig.getNodeId();
    self._raftState.incTerm();
    self._raftState.vote(nodeId);
    var msg = self._raftState.createVoteMsg();
    var nodes = self._clusterConfig.getNodes();
    var majority = self._clusterConfig.getMajority();
    var voteCount = 1;

    if (majority == 1) {
        deferred.resolve(voteCount);
    } else {
        self._requests = [];
        nodes.forEach(function (nodeInfo) {
            var request = new RaftRequest(nodeInfo, self._timeout);
            request.send('request-vote', msg, function (err, voteGranted) {
                if (err) {
                    // TODO: repeat request
                }

                if (voteGranted) {
                    voteCount++;
                }

                if (voteCount === majority) {
                    self.stop();
                    self._context.switchToLeader();
                }

                request.close();
            });

            self._requests.push(request);
        });
    }
};

Candidate.prototype.stop = function () {
    this._timer.stop();
    self._requests.forEach(function (req) {
        req.close();
    });
};

module.exports = Candidate;