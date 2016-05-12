function CandidateService(raftConfig, connectionManager) {
    this._raftConfig = raftConfig;
    this._connectionManager = connectionManager;
}

CandidateService.prototype.election = function (callback) {

};

module.exports = CandidateService;