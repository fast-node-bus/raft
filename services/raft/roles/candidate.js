var util = require('util');
var BaseState = require('./base-state');

var ELECTION_TIMEOUT = 300;

function Candidate(raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);

    this._timer = new ElectionTimer(ELECTION_TIMEOUT);
    this._requestService = new RequestService();
}

util.inherits(Candidate, BaseState);

Candidate.prototype.start = function () {
    var self = this;

    self._timer.start(function () {
        self._context.switchToCandidate();
    });

    var nodeId = self._clusterConfig.getNodeId();
    self._raftState.incTerm();
    self._raftState.setVotedFor(nodeId);
    var msg = self._raftState.createRequestVoteMsg();
    var nodes = self._clusterConfig.getNodes();
    var majority = self._clusterConfig.getMajority();

    if (majority == 1) {
        self._context.switchToLeader();
    } else {
        self._requests = [];
        nodes.forEach(function (nodeInfo) {
            self._requestService.add(nodeInfo, function onIdleTimeout(id) {
                self._requestService.send('request-vote', id, msg, function (err, result) {
                    if (!err) {
                        self._requestService.close(id);
                        self._requestVote.responseHandler(result, majority, function onMajority() {
                            self.stop();
                            self._context.switchToLeader();
                        });
                    }
                });
            });
        });
    }
};

Candidate.prototype.stop = function () {
    this._timer.stop();
    this._requestService.closeAll();
};

module.exports = Candidate;