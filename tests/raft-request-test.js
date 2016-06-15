var assert = require('assert');
var sinon = require('sinon');

var net=require('net');
var Request = require('../services/raft/lib/raft-request');
var Message = require('../lib/message2');

describe('Connection Lost', function () {
    it('Should not callback', function (done) {
        var netStub=sinon.stub(net, 'createConnection');

        netStub.returns({on: function(){
            // nop
        }});
        netStub.callsArgAsync(2);

        var sendStub = sinon.stub(Message.prototype, 'send');
        sendStub.callsArgWithAsync(2, null, 'response');

        var request = new Request('localhost', 9000, 1000);
        request.start();


        request.send('my-method', 'my msg', function (err, msg) {
            console.log(err);
            console.log(msg);
            done();
        });
    });
});
