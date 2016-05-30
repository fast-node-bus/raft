function Manager(follower, candidate, leader) {
    this._follower = follower;
    this._candidate = candidate;
    this._leader = leader;

    this._currentRole = follower;

    follower.setContext(this, BaseHandler);
    candidate.setContext(this, CandidateHandler);
    leader.setContext(this, LeaderHandler);
}

Manager.prototype.switchToFollower = function () {
    this._currentRole.stop();
    this._currentRole = this._follower;
    this._currentRole.start();
};

Manager.prototype.switchToCandidate = function () {
    this._currentRole.stop();
    this._currentRole = this._candidate;
    this._currentRole.start();
};

Manager.prototype.switchToLeader = function () {
    this._currentRole.stop();
    this._currentRole = this._leader;
    this._currentRole.start();
};

Manager.prototype.appendEntries = function (msg, callback) {
    this._currentRole.appendEntries(msg, callback);
};

Manager.prototype.requestVote = function (msg, callback) {
    this._currentRole.requestVote(msg, callback);
};