module.exports={
    'add-node':function(cmd){
        this._raftConfig.add(cmd.nodeInfo);
    }
};