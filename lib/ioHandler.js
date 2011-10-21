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
    Utilities to use input and output as streams, files, strings, etc.
*/

var fs = require("fs");
var system = require("system");

/**
 *
 */
exports.getFileName = function(uri) {

    if (!uri.authority) {
        if (uri.path) {
            return uri.path;
        } else {
            // Create temporary file:
            var tmp_name = java.io.File.createTempFile("ofs-is-", "").path;
            var tmp_file = fs.openRaw(tmp_name, {write:true,binary:true,exclusive:true});

            // Write all input to file:
            var input = system.stdin.raw.inputStream;
            var ba = new ByteArray(64*1024); // 64kB sized buffer
            var len = 0;
            while ((len = input.read(ba)) > 0) {
                tmp_file.write(ba, 0, len);
            }
            
            tmp_file.close();
            return tmp_name;
        }
    } else {
        if (uri.scheme == "http") {
            // download from http
        }
    }
};


/**
 *
 */
exports.getFile = function(uri, mode) {

    var file_name = this.getFileName(uri);
    return fs.open(file_name, mode);
};


/**
 *
 */
exports.getRawFile = function(uri, mode) {

    var file_name = this.getFileName(uri);
    return fs.openRaw(file_name, mode);
};


/**
 *
 */
exports.getInputReader = function(uri, charset) {

    charset = charset || "UTF-8";

    if (!uri.authority) {
        
        if (!uri.path) {
            return system.stdin;
        } else {
            var file_name = this.getFileName(uri);
            var fis = new java.io.FileInputStream(file_name);
            var isr = new java.io.InputStreamReader(fis, charset);
            return new java.io.BufferedReader(isr);
        }
    } else {

        if (uri.scheme == "http") {
            // get HTTP stream
        }
    }
};



/**
 *
 */
exports.getOutputWriter = function(uri, charset) {

    charset = charset || "UTF-8";

    if (!uri.authority) {
        
        if (!uri.path) {
            return system.stdout;
        
        } else {
            var file_name = this.getFileName(uri);
            var fos = new java.io.FileOutputStream(file_name);
            var osw = new java.io.OutputStreamWriter(fos, charset);
            return new java.io.BufferedWriter(osw);
        }
    } else {
        
        if (uri.scheme == "http") {
            // get HTTP POST/PUT stream
        }
    }
};


/**
 *
 */
exports.getBinary = function(uri) {

};


/**
 *
 */
exports.getString = function(uri) {

};


/**
 *
 */
exports.getDom = function(uri) {

};


/**
 *
 */
exports.getSizzle = function(uri) {

};


// ---------------------------------------------------------------------------


