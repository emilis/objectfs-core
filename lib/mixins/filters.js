/*
    Copyright 2012 Emilis Dambauskas

    This file is part of ObjectFS-core package.

    ObjectFS-core is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    ObjectFS-core is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with ObjectFS-core.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    A mixin that helps you add filter support on top of wrapper that only has iterateAll() function.
*/


/**
 *
 */
exports.read = function(pk, iterate) {
    
    return function(id) {
        
        var filter = {};
        filter[pk] = id;
        
        return iterate(filter, {limit:1}).next();
    };
};


/**
 *
 */
exports.list = function(iterate) {
    
    return function(filter, flt_options) {

        var l = [];
        for each (var record in iterate(filter, flt_options)) {
            l.push(record);
        }
        return l;
    };
};


/**
 *
 */
exports.iterate = function(iterateAll) {
    
    return function(filter, flt_options) {

        if (!filter && !flt_options) {
            for each (var record in iterateAll()) {
                yield record;
            }
        } else {

            flt_options = flt_options || {};
            flt_options.offset = flt_options.offset || 0;
            flt_options.limit = flt_options.limit || Infinity;

            var count = 0;
            for each (var record in iterateAll()) {
                if (recordMatches(record, filter)) {

                    count++;
                    if (count > flt_options.offset) {
                        
                        yield filterFields(record, flt_options.fields);
                        if (count === (flt_options.offset + flt_options.limit)) {
                            throw StopIteration;
                        }
                    }
                }
            }
        }
    }
};


/**
 *
 */
function recordMatches(record, filter) {

    if (!filter) {
        return true;
    } else {
        for (var k in filter) {
            var f = filter[k];
            
            if (f instanceof Array) {
                if (f.indexOf(record[k]) === -1) {
                    return false;
                }
            
            } else if (f instanceof RegExp) {
                if (!record[k].match(f)) {
                    return false;
                }
            
            } else if (f instanceof Function) {
                if (!f(record[k])) {
                    return false;
                }
            
            } else {
                if (f != record[k]) {
                    return false;
                }
            }
        }
    }
    return true;
};


/**
 *
 */
function filterFields(record, fields) {

    if (!fields) {
        return record;
    } else {
        var result = {};
        for (var k in fields) {
            result[k] = record[k];
        }
        return result;
    }
};

