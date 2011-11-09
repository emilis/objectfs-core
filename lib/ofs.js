/*
    Copyright 2011 Emilis Dambauskas

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
    Reads/writes objects from/to various storages.
*/


// Requirements:
var mapper = require("./uriMapper");


/**
 *
 */
exports.read = function(uri, id) {

    var fs = mapper.getFs(uri, {ofs_read_only:true, ofs_one_call:true});
    return fs.read(id);
};


/**
 *
 */
exports.write = function(uri, id, obj) {

    var fs = mapper.getFs(uri, {ofs_write_only:true, ofs_one_call:true});
    return fs.write(id, obj);
};


/**
 *
 */
exports.remove = function(uri, id) {

    var fs = mapper.getFs(uri);
    return fs.remove(id);
};


/**
 *
 */
exports.list = function(uri, filter, options) {

    var fs = mapper.getFs(uri, {ofs_read_only:true, ofs_one_call:true});
    return fs.list(filter, options);
};


/**
 *
 */
exports.iterate = function(uri, filter, options) {

    var fs = mapper.getFs(uri, {ofs_read_only:true, ofs_one_call:true});
    return fs.iterate(filter, options);
};


/**
 *
 */
exports.mirror = function(src, target) {

    var fs1 = mapper.getFs(src, {ofs_read_only:true, ofs_one_call:true});
    var fs2 = mapper.getFs(target, {ofs_write_only:true, ofs_batch:true});

    if (fs1.iterate) {
        var records = fs1.iterate();
    } else {
        var records = fs1.list();
    }

    var count = 0;
    for each (var record in records) {
        fs2.write(false, record);
        count++;
    }

    return count;
};
