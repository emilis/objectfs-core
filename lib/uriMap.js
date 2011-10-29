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
    Reads and writes data to file that holds URI-module map.
*/

// Requirements:
var config = require("config");
var fs = require("fs");
var ioHandler = require("objectfs-core/ioHandler");
var objects = require("ringo/utils/objects");

// Extend CSV driver:
var parent = require("objectfs-core/drivers/csv");
exports = objects.clone(parent, exports, true);

/**
 *
 */
exports.connect = function(uri, ofs_options) {

    uri = uri || {};
    ofs_options = ofs_options || {};

    if (!uri.authority && !uri.path) {
        uri.path = config.DIRS.config + "/uri_map.csv";

        if (!fs.exists(uri.path)) {
            var file_name = module.directory + "../install/uri_map.csv";
            if (fs.exists(file_name)) {
                fs.copy(file_name, uri.path);
            } else {
                fs.write(uri.path, base_map);
            }
        }
    }

    uri.params = uri.params || {};
    uri.params.separator = uri.params.separator || " ";

    parent.connect.call(this, uri, ofs_options, ioHandler);
};


/**
 *
 */
var base_map = "scheme    authority    path    module   options\n"
    + "csv    *    *      objectfs-core/drivers/csv \n"
    + "*      *    *.csv  objectfs-core/drivers/csv \n";

