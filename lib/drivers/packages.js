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
    ObjectFS driver for the package list.
*/

// Requirements:
var fs = require("fs");

var objects = require("ringo/utils/objects");
var parent = require("./files");

exports = objects.clone(parent, exports, true);


exports.extension = ".json";
exports.serialize = JSON.stringify;
exports.unserialize = JSON.parse;


/**
 *
 */
exports.connect = function(uri, ofs_options, io) {

    this.extension = ".json";
    
    if (!uri || (!uri.authority && uri.path)) {
        fs.canonical(this.file_dir = module.directory + "../../../objectfs-packages/json");
    } else {
        parent.connect.call(this, uri, ofs_options, io);
    }
};


/**
 * Returns a canonical path for the item.
 *
 * @param {String} path
 * @returns {String}
 */
exports.canonical = function(id) {

    //print(module.id, "canonical", id);
    return fs.base(id);
};


/**
 *
 */
exports.getFileName = function(id) {

    //print(module.id, "getFileName", uneval(id), this.file_dir, this.extension);
    if (id.slice(0,4) == "ofs-") {
        return [this.file_dir, id[4], id+this.extension].join("/");
    } else {
        return [this.file_dir, id[0], id+this.extension].join("/");
    }
};


/**
 *
 */
exports.getIdFromFileName = function(file_name) {

    //print(module.id, "getIdFromFileName", file_name);
    return file_name.split("/").pop().slice(0, 0-this.extension.length);
};




exports.list = function(filter, options) {

    options = options || {};
    var { reverse, pattern, limit} = options;

    if (reverse)
        var gen = this._rev_iter(this.file_dir);
    else
        var gen = this._fwd_iter(this.file_dir);

    var list = [];
    for each (var fpath in gen) {
        if (pattern === undefined || fpath.match(pattern)) {
            list.push( this.getIdFromFileName(fpath) );
        }
        if (limit !== undefined) {
            if (!limit) {
                gen.close();
                throw StopIteration;
            }
            else limit--;
        }
    }

    return list;
}

