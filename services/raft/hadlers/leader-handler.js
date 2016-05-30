var util=require('util');
var BaseHandler=require('./base-handler');

function LeaderHandler(raftState, roleManager) {
    BaseHandler.call(this, raftState, roleManager);
}

util.inherits(LeaderHandler, BaseHandler);

LeaderHandler.prototype.checkTerm = function (term, resultCallback) {
    var self = this;
    if (term > self._raftState.currentTerm) {
        self._raftState.changeTerm(term);
        self._roleManager.switchToFollower();
    } else {
        resultCallback();
    }
};

LeaderHandler.prototype.updateFollowerIndex = function (id, entriesCount, retryFunc) {
    var self = this;
    self._raftState.nextIndex[id] += entriesCount;
    self._raftState.matchIndex[id] += entriesCount;

    if (self._raftState.lastLogIndex >= self._raftState.nextIndex[id]) {
        retryFunc(id);
    }
};

LeaderHandler.prototype.decFollowerIndex = function (id, retryFunc) {
    var self = this;
    self._raftState.nextIndex[id]--;
    retryFunc(id);
};

LeaderHandler.prototype.updateCommitIndex = function (majority, callback) {
    var self = this;
    for (var n = self._raftState.commitIndex + 1; n <= self._raftState.lastIndex; n++) {
        var entry = self._raftState.get(n);
        if (entry.term === self._raftState.currentTerm) {
            var count = 1;
            for (var id in self._raftState.matchIndex) {
                if (self._raftState.matchIndex[id] >= n) {
                    count++
                }
            }

            if (count >= majority) {
                self._raftState.changeCommitIndex(n, function (err, result) {
                    callback(err, result);
                });
            }
        }
    }
};

module.exports = LeaderHandler;
