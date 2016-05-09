function IndexArray(index) {
    this._index = index;

    //this._array = [];
    this._keys = {};

    this.length = 0;
}

IndexArray.prototype.addIndex = function (value) {
    var key = value[this._index];
    var obj = this._keys[key];

    if (!obj) {
        obj = value;

        this._keys[key] = obj;
        this.length++;
    }

    return obj;
};

IndexArray.prototype.getIndex = function (value) {
    var key = value[this._index];
    var obj = this._keys[key];

    return obj;
};



//IndexArray.prototype.add = function (key, value) {
//    var obj = this._keys[key];
//
//    if (!obj) {
//        obj = {
//            key: key,
//            value: value,
//            index: this._array.length
//        };
//
//        this._keys[key] = obj;
//        this._array.push(obj);
//
//        this.length++;
//    }
//
//    return obj.value;
//};
//
//IndexArray.prototype.next = function () {
//    var obj = this._array.shift();
//    if (obj) {
//        delete this._keys[obj.value];
//        this.length--;
//        return obj.value;
//    }
//
//    return null;
//};
//
//IndexArray.prototype.get = function (key) {
//    var obj = this._keys[key];
//    if (obj) {
//        return obj.value;
//    }
//
//    return null;
//};
//
//IndexArray.prototype.remove = function (key) {
//    var obj = this._keys[key];
//    if (obj) {
//        this._array.splice(obj.index, 1);
//        delete this._keys[key];
//        this.length--;
//        return obj.value;
//    }
//
//    return null;
//};
//
//IndexArray.prototype.forEach = function (callback) {
//    this._array.forEach(function (obj, i) {
//        callback(obj.value, i)
//    });
//};
//
//IndexArray.prototype.next = function () {
//
//};


module.exports = IndexArray;