var util = require('util');
var BaseRole = require('./base-role');

function Candidate(raftState, clusterConfig, requestService) {
    BaseRole.call(this, raftState, clusterConfig);

    this._requestService = requestService;
}

util.inherits(Candidate, BaseRole);

Candidate.prototype.start = function () {
    var self = this;

    self._timer.start(function () {
        self._context.switchToCandidate();
    });

    var nodeId = self._clusterConfig.getNodeId();
    self._raftState.incTerm();
    self._raftState.setVotedFor(nodeId);
    var msg = self._raftState.createRequestVoteMsg();
    var majority = self._clusterConfig.getMajority();

    function requestVote(id) {
        self._requestService.send('request-vote', id, msg, function (err, result) {
            if (!err) {
                self._requestService.close(id);
                self._handler.checkTerm(result.term, function () {
                    self._handler.checkVote(result, majority, function () {
                        self._raftState.setLeaderId(nodeId);
                        self._context.switchToLeader();
                    });
                });
            }
        });
    }

    if (majority == 1) {
        self._context.switchToLeader();
    } else {
        self._requestService.start(requestVote);
        self._clusterConfig.forEach(function (nodeInfo) {
            requestVote(nodeInfo.id);
        });
    }
};

Candidate.prototype.stop = function () {
    this._timer.stop();
    this._requestService.closeAll();
};

module.exports = Candidate;