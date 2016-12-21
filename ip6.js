/**
 * Created by elgs on 3/5/16.
 */
;(function () {
    'use strict';

    let normalize = function (a) {
        if (!_validate(a)) {
            throw new Error('Invalid address: ' + a);
        }
        let nh = a.split(/\:\:/g);
        if (nh.length > 2) {
            throw new Error('Invalid address: ' + a);
        }

        let sections = [];
        if (nh.length == 1) {
            // full mode
            sections = a.split(/\:/g);
            if (sections.length !== 8) {
                throw new Error('Invalid address: ' + a);
            }
        } else if (nh.length == 2) {
            // compact mode
            let n = nh[0];
            let h = nh[1];
            let ns = n.split(/\:/g);
            let hs = h.split(/\:/g);
            for (let i in ns) {
                sections[i] = ns[i];
            }
            for (let i = hs.length; i > 0; --i) {
                sections[7 - (hs.length - i)] = hs[i - 1];
            }
        }
        for (let i = 0; i < 8; ++i) {
            if (sections[i] === undefined) {
                sections[i] = '0000';
            }
            sections[i] = _leftPad(sections[i], '0', 4);
        }
        return sections.join(':');
    };

    let abbreviate = function (a) {
        if (!_validate(a)) {
            throw new Error('Invalid address: ' + a);
        }
        a = normalize(a);
        a = a.replace(/0000/g, 'g');
        a = a.replace(/\:000/g, ':');
        a = a.replace(/\:00/g, ':');
        a = a.replace(/\:0/g, ':');
        a = a.replace(/g/g, '0');
        let sections = a.split(/\:/g);
        let zPreviousFlag = false;
        let zeroStartIndex = -1;
        let zeroLength = 0;
        let zStartIndex = -1;
        let zLength = 0;
        for (let i = 0; i < 8; ++i) {
            let section = sections[i];
            let zFlag = (section === '0');
            if (zFlag && !zPreviousFlag) {
                zStartIndex = i;
            }
            if (!zFlag && zPreviousFlag) {
                zLength = i - zStartIndex;
            }
            if (zLength > 1 && zLength > zeroLength) {
                zeroStartIndex = zStartIndex;
                zeroLength = zLength;
            }
            zPreviousFlag = (section === '0');
        }
        if (zPreviousFlag) {
            zLength = 8 - zStartIndex;
        }
        if (zLength > 1 && zLength > zeroLength) {
            zeroStartIndex = zStartIndex;
            zeroLength = zLength;
        }
        //console.log(zeroStartIndex, zeroLength);
        //console.log(sections);
        if (zeroStartIndex >= 0 && zeroLength > 1) {
            sections.splice(zeroStartIndex, zeroLength, 'g');
        }
        //console.log(sections);
        a = sections.join(':');
        //console.log(a);
        a = a.replace(/\:g\:/g, '::');
        a = a.replace(/\:g/g, '::');
        a = a.replace(/g\:/g, '::');
        a = a.replace(/g/g, '::');
        //console.log(a);
        return a;
    };

    // Basic validation
    let _validate = function (a) {
        return /^[a-f0-9\\:]+$/ig.test(a);
    };

    let _leftPad = function (d, p, n) {
        let padding = p.repeat(n);
        if (d.length < padding.length) {
            d = padding.substring(0, padding.length - d.length) + d;
        }
        return d;
    };

    let _hex2bin = function (hex) {
        return parseInt(hex, 16).toString(2)
    };
    let _bin2hex = function (bin) {
        return parseInt(bin, 2).toString(16)
    };

    let _addr2bin = function (addr) {
        let nAddr = normalize(addr);
        let sections = nAddr.split(":");
        let binAddr = '';
        for (let i in sections) {
            let part = sections[i];
            let section = _leftPad(_hex2bin(part), '0', 16);
            binAddr += section;
        }
        return binAddr;
    };

    let _bin2addr = function (bin) {
        let addr = [];
        for (let i = 0; i < 8; ++i) {
            let binPart = bin.substr(i * 16, 16);
            let hexSection = _leftPad(_bin2hex(binPart), '0', 4);
            addr.push(hexSection);
        }
        return addr.join(':');
    };

    let divideSubnet = function (addr, mask0, mask1, limit, abbr) {
        if (!_validate(addr)) {
            throw new Error('Invalid address: ' + addr);
        }
        if (mask0 < 1 || mask1 < 1 || mask0 > 128 || mask1 > 128 || mask0 > mask1) {
            throw new Error('Invalid masks.');
        }
        let ret = [];
        let binAddr = _addr2bin(addr);
        let binNetPart = binAddr.substr(0, mask0);
        let binSubnetPart = binAddr.substr(mask0, mask1 - mask0);
        let binHostPart = binAddr.substr(mask1);
        if (binSubnetPart.includes('1') || binHostPart.includes('1')) {
            throw new Error('Invalid masks.');
        }
        let numSubnets = Math.pow(2, binSubnetPart.length);
        for (let i = 0; i < numSubnets; ++i) {
            if (!!limit && i >= limit) {
                break;
            }
            let binSubnet = _leftPad(i.toString(2), '0', binSubnetPart.length);
            let binSubAddr = binNetPart + binSubnet + binHostPart;
            let hexAddr = _bin2addr(binSubAddr);
            if (!!abbr) {
                ret.push(abbreviate(hexAddr));
            } else {
                ret.push(hexAddr);
            }

        }
        // console.log(numSubnets);
        // console.log(binNetPart, binSubnetPart, binHostPart);
        // console.log(binNetPart.length, binSubnetPart.length, binHostPart.length);
        // console.log(ret.length);
        return ret;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        exports.normalize = normalize;
        exports.abbreviate = abbreviate;
        exports.divideSubnet = divideSubnet;
    } else {
        window.normalize = normalize;
        window.abbreviate = abbreviate;
        window.divideSubnet = divideSubnet;
    }
})();