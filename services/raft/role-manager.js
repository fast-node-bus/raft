var BaseHandler=require('./handlers/base-handler');
var CandidateHandler=require('./handlers/candidate-handler');
var LeaderHandler=require('./handlers/leader-handler');

function RoleManager(follower, candidate, leader) {
    this._follower = follower;
    this._candidate = candidate;
    this._leader = leader;

    this._currentRole = follower;

    follower.setContext(this, BaseHandler);
    candidate.setContext(this, CandidateHandler);
    leader.setContext(this, LeaderHandler);
}

RoleManager.prototype.switchToFollower = function () {
    console.log('Switch to Follower.');
    this._currentRole.stop();
    this._currentRole = this._follower;
    this._currentRole.start();
};

RoleManager.prototype.switchToCandidate = function () {
    console.log('Switch to Candidate.');
    this._currentRole.stop();
    this._currentRole = this._candidate;
    this._currentRole.start();
};

RoleManager.prototype.switchToLeader = function () {
    console.log('Switch to Leader.');
    this._currentRole.stop();
    this._currentRole = this._leader;
    this._currentRole.start();
};

RoleManager.prototype.appendEntries = function (msg, callback) {
    console.log('Received append-entries.');
    this._currentRole.appendEntries(msg, callback);
};

RoleManager.prototype.requestVote = function (msg, callback) {
    console.log('Received request-vote.');
    this._currentRole.requestVote(msg, callback);
};

RoleManager.prototype.exec = function (cmd, callback) {
    console.log('Received cmd.');
    this._currentRole.exec(cmd, callback);
};

module.exports = RoleManager;