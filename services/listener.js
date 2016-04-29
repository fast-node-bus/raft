var net = require('net');
var clusterConfig=require('./cluster-config');
var Message=require('../lib/message2');


module.exports = function (host, port) {
    var raftNode=new RaftNode(host, port);

    var server = net.createServer(function (socket) {
        var message=new Message(socket);

        raftNode.add(message);

        message.listen('append-entries', function(msg, res){

        });

        socket.on('error', function (err) {
            console.log('Server Error');
            console.log(err);
        });

        socket.on('connect', function () {
            console.log('New connection');
            console.log(arguments);
        });

        socket.on('close', function () {
            console.log('Connection closed');
            console.log(arguments);
        });

        socket.on('data', function (data) {
            console.log(data.toString());
        });

        //var counter=0;
        //setInterval(function(){
        //    socket.write('ping'+counter++);
        //}, 1000);
    });

    server.listen(port, host, function () {
        console.log('Server is started on port: ' + port);
    });
};

