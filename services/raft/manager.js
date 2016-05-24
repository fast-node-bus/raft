function Manager(follower, candidate, leader) {
    this._follower = follower;
    this._candidate = candidate;
    this._leader = leader;

    this._currentState = follower;

    follower.setContext(this);
    candidate.setContext(this);
    leader.setContext(this);
}

Manager.prototype.switchToFollower = function () {
    this._currentState.stop();
    this._currentState = this._follower;
    this._currentState.start();
};

Manager.prototype.switchToCandidate = function () {
    this._currentState.stop();
    this._currentState = this._candidate;
    this._currentState.start();
};

Manager.prototype.switchToLeader = function () {
    this._currentState.stop();
    this._currentState = this._leader;
    this._currentState.start();
};

Manager.prototype.appendEntries = function (msg, callback) {
    this._currentState.appendEntries(msg, callback);
};

Manager.prototype.requestVote = function (msg, callback) {
    this._currentState.requestVote(msg, callback);
};