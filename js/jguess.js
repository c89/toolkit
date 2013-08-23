(function(){
    var
        JGUESS_VERSION = '0.0.1',
        setting = {
            channel: null,
            size: 100,
            expire: 1000 * 60 * 24 * 30, // A month
            top: 3
        },
        $ = window.jQuery || window.$ || (window.$ = {}),
        $$ = $.jStorage;

    if (!$$) {
        throw new Error("Please add jStorage js file before this, get jStorage from https://github.com/andris9/jStorage");
    }

    ////////////////////////// PRIVATE METHODS ////////////////////////
    function _filter_channel(str) {
        if (typeof str == 'number') {
            str = str.toString();
        }
        return str.replace('$', '');
    }
    function _filter_type(str) {
        return str.replace('$', '-');
    }
    function _filter_key(key) {
        return key.replace('$', '');
    }
    function _set(type, key, weight) {
        var k = type + '$' + key;
        if (!$$.get(k) && $$.index().length >= setting.size) {
            var idx = $$.index();
            // Get min times
            var min = {v: $$.get(idx[0]), g: [idx[0]]};
            for (var i = 1; i < idx.length; i++) {
                var obj = $$.get(idx[i]);
                if (obj.v < min.v) {
                    min.v = obj.v;
                    min.g = [idx[i]];
                } else if (obj.v == min.v) {
                    min.g.push(idx[i]);
                }
            }
            // Get min weight
            var del = {k: min.g[0], w: $$.get(min.g[0]).w};
            for (var i = 1; i < min.g.length; i++) {
                var obj = $$.get(min.g[i]);
                if (obj.w < del.w) {
                    del.k = min.g[i];
                    del.w = obj.w;
                }
            };
            // Remove min
            $$.deleteKey(del.k);
        }
        // {v:v w:w}
        var v = {v: ($$.get(k)? ($$.get(k).v + 1): 1), w: weight};
        $$.set(k, v, {TTL: setting.expire});
    }

    function _top (type, num) {
        var idx = $$.index();
        if (!idx.length) {
            return [];
        }

        var out = [];
        for (var i = 0; i < idx.length; i++) {
            var arr = idx[i].split('$');
            if (arr[0] != type) {
                continue;
            }

            if (out.length >= num) {
                // Get min data
                var min = {i: 0, o: $$.get(out[0])};
                for (var j = 1; j < out.length; j++) {
                    var obj = $$.get(out[j]);
                    if (min.o.v > obj.v || (min.o.v == obj.v && min.o.w >= obj.w)) {
                        min.i = j;
                        min.o = obj;
                    }
                }
                obj = $$.get(idx[i]);
                if (min.o.v < obj.v || (min.o.v == obj.v && min.o.w < obj.w)) {
                    out[min.i] = idx[i];
                }
            } else {
                out.push(idx[i]);
            }
        }
        for (var i = 0; i < out.length; i++) {
            out[i] = out[i].split('$')[1];
        }
        return out;
    }

    ////////////////////////// PUBLIC INTERFACE /////////////////////////
    $.jguess = {
        version: JGUESS_VERSION,
        /**
         * Sets a key's value.
         *
         * @param {String} type Key to set. If this value is not set or not
         *              a string an exception is raised.
         * @param {String} key Value to set.
         * @return {Mixed} the used value
         */
        set: function(type, key, weight) {
            if (!type || typeof type != 'string') {
                throw new TypeError('Type name must be string');
            }
            if(!key || typeof key != "string"){
                throw new TypeError('Key name must be string');
            }
            if (weight && isNaN(weight)) {
                throw new TypeError('weight name must be number');
            }

            type = _filter_type(type);
            if (setting.channel) {
                type += _filter_channel(setting.channel);
            }
            key = _filter_key(key);
            weight = Number(weight) || 1;
            _set(type, key, weight);
        },
        top: function(type, num) {
            type = _filter_type(type);
            if (setting.channel) {
                type += _filter_channel(setting.channel);
            }
            num = num || setting.top;
            return _top(type, num);
        },
        config: function(set) {
            if (typeof set != 'object') {
                return false;
            }
            for(i in set){
                if(set.hasOwnProperty(i) && setting.hasOwnProperty(i)) {
                    setting[i] = set[i];
                }
            }
        }
    };

})();