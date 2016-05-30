var util=require('util');
var BaseHandler=require('./base-handler');

function CandidateHandler(raftState, roleManager) {
    BaseHandler.call(this, raftState, roleManager);

    // TODO: move to self._raftState
    this._prevTerm = 0;
    this._voteCount = 1;
}

util.inherits(CandidateHandler, BaseHandler);

CandidateHandler.prototype.checkTerm = function (term, resultCallback) {
    var self = this;
    if (term > self._raftState.currentTerm) {
        self._raftState.changeTerm(term);
        self._roleManager.switchToFollower();
    } else {
        resultCallback();
    }
};

CandidateHandler.prototype.checkVote = function (msg, majority, onMajority) {
    var self = this;

    if (self._prevTerm !== msg.term) {
        self._voteCount = 1;
    }

    if (msg.voteGranted) {
        self._voteCount++;
    }

    if (self._voteCount === majority) {
        onMajority();
    }
};

module.exports = CandidateHandler;
