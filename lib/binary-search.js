exports.findFirst = function (array, target, propName, start, end) {
    start = start || 0;
    end = end || array.length;

    var startIndex = -1;
    while (start <= end) {
        var mid = ((end - start) / 2 | 0) + start;
        var elem = array[mid][propName];
        if (elem > target) {
            end = mid - 1;
        } else if (elem === target) {
            startIndex = mid;
            end = mid - 1;
        } else
            start = mid + 1;
    }

    return startIndex;
};

exports.findLast = function (array, target, propName, start, end) {
    start = start || 0;
    end = end || array.length;

    var startIndex = -1;
    while (start <= end) {
        var mid = ((end - start) / 2 | 0) + start;
        var elem = array[mid][propName];
        if (elem > target) {
            end = mid - 1;
        } else if (elem === target) {
            startIndex = mid;
            start = mid + 1;
        } else
            start = mid + 1;
    }

    return startIndex;
};