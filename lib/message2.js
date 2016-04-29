var util = require('util');
var EventEmitter = require('events').EventEmitter;
var shortid = require('shortid');

var Protocol = require('../lib/socket-protocol');

function Message(socket) {
    EventEmitter.call(this);

    var self = this;

    this._sendCallbacks = {};
    this._protocol = new Protocol(socket);

    this._errorHandler = function () {
        // nop
    };

    this._protocol.on('error', function (err) {
        self._errorHandler(err);
    });

    self._protocol.on(Protocol.RESPONSE, function (msg) {
        var args = [msg.err].concat(msg.data);
        var callback = self._sendCallbacks[msg.id];

        if(callback){
            delete self._sendCallbacks[msg.id];
            callback.apply(this, args);
        }
    });
}

util.inherits(Message, EventEmitter);

Message.prototype.send = function (methodName) {
    var self = this;
    var params = getSendParams(arguments);
    var id = shortid.generate();
    var msg = {
        id: id,
        data: params.args
    };

    self._sendCallbacks[id] = params.callback;

    self._protocol.send(Protocol.REQUEST, methodName, msg);
};

Message.prototype.listen = function (methodName) {
    var self = this;
    var params = getListenParams(arguments);

    self._protocol.on(methodName, function (msg) {

        var res = (function () {
            var hasError=false;
            var resultCallback = function (err) {
                hasError=err;
            };

            var error = function (err) {
                resultCallback(err);
            };

            self._protocol.on('error', error);

            return {
                send: function () {
                    if(hasError){
                        return resultCallback(hasError);
                    }

                    var args = [].slice.call(arguments, 1);
                    var err = arguments[0];

                    var respMsg = {
                        id: msg.id,
                        data: args,
                        err: err
                    };

                    self._protocol.send(Protocol.RESPONSE, methodName, respMsg, function () {
                        self._protocol.removeListener('error', error);
                        resultCallback(null);
                    });
                },
                onResult: function (resultCb) {
                    resultCallback = resultCb;
                }
            };
        })();

        var args = msg.data.concat(res);

        params.callback.apply(this, args);
    });
};

Message.prototype.onError = function (handler) {
    this._errorHandler = handler;
};

function getSendParams(args) {
    var callbackPos = args.length - 1;
    return {
        args: [].slice.call(args, 1, callbackPos),
        callback: args[callbackPos]
    };
}

function getListenParams(args) {
    var callbackPos = args.length - 1;
    return {
        args: [].slice.call(args, 1),
        callback: args[callbackPos]
    };
}

module.exports = Message;