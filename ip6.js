/**
 * Created by elgs on 3/5/16.
 */
;(function () {
    'use strict';

    var normalize = function (a) {
        if (!_validate(a)) {
            return false;
        }
        var nh = a.split(/\:\:/g);
        if (nh.length > 2) {
            return false;
        }

        var sections = [];
        if (nh.length == 1) {
            // full mode
            sections = a.split(/\:/g);
            if (sections.length !== 8) {
                return false;
            }
        } else if (nh.length == 2) {
            // compact mode
            var n = nh[0];
            var h = nh[1];
            var ns = n.split(/\:/g);
            var hs = h.split(/\:/g);
            for (var i in ns) {
                sections[i] = ns[i];
            }
            for (var i = hs.length; i > 0; --i) {
                sections[7 - (hs.length - i)] = hs[i - 1];
            }
        }
        for (var i = 0; i < 8; ++i) {
            if (sections[i] === undefined) {
                sections[i] = '0000';
            }
            if (sections[i].length < 4) {
                sections[i] = '0000'.substring(0, 4 - sections[i].length) + sections[i];
            }
        }
        return sections.join(':');
    };
    var abbreviate = function (a) {
        if (!_validate(a)) {
            return false;
        }
        a = normalize(a);
        a = a.replace(/0000/g, 'g');
        a = a.replace(/\:000/g, ':');
        a = a.replace(/\:00/g, ':');
        a = a.replace(/\:0/g, ':');
        a = a.replace(/g/g, '0');
        return a;
    };

    // Basic validation
    var _validate = function (a) {
        return /^[a-f0-9\\:]+$/ig.test(a);
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        exports.normalize = normalize;
        exports.abbreviate = abbreviate;
        exports._validate = _validate;
    } else {
        window.normalize = normalize;
        window.abbreviate = abbreviate;
        window._validate = _validate;
    }
})();