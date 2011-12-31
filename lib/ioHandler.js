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

// Requirements:
var fs = require("fs");
var system = require("system");


/**
 * Creates an iterator for the given read(byte[]) function.
 */
exports.readStrings = function(read, charset, bsize) {

    charset = charset || "UTF-8";
    bsize = bsize || (64*1024);

    var decoder = java.nio.charset.Charset.forName(charset).newDecoder()

    var ba = ByteArray(bsize);
    //var bbuffer = java.nio.ByteBuffer.allocateDirect(bsize + 32);
    var bbuffer = java.nio.ByteBuffer.allocate(bsize + 16);
    var cbuffer = java.nio.CharBuffer.allocate(bsize + 32);

    var blen = 0;
    var result = false;
    while ((blen=read(ba)) > 0) {
        bbuffer.put(ba, 0, blen);

        do {
            bbuffer.flip();
            result = decoder.decode(bbuffer, cbuffer, false);
            yield getString();
            bbuffer.compact();
        } while (result.isOverflow())
    }
   
    //*
    bbuffer.flip();
    decoder.decode(bbuffer, cbuffer, true);
    decoder.flush(cbuffer);
    yield getString();
    //*/
    

    // Converts CharBuffer to String:
    function getString() {

        cbuffer.flip();
        var str = new String(new java.lang.String(cbuffer.array(), cbuffer.position(), cbuffer.remaining()));
        cbuffer.clear();
        return str;
    }

};

/**
 *
 */
exports.getFileName = function(uri) {

    if (typeof(uri) === "string" || uri instanceof String) {
        return uri;
    } else if (!uri.authority) {
        if (uri.path) {
            return uri.path;
        } else {
            return InputStreamToFileName(system.stdin.raw.inputStream);
        }
    } else {
        return InputStreamToFileName(this.getInputStream(uri));
    }
};


/**
 *
 */
exports.getTempFileName = function() {

    return getTempFileName();
};



/**
 *
 */
exports.getFile = function(uri, mode) {

    var file_name = this.getFileName(uri);
    if (!fs.exists(file_name)) {
        var f = fs.open(file_name, {write:true});
        f.close();
    }

    return fs.open(file_name, mode);
};


/**
 *
 */
exports.getTextFile = function(uri, charset) {

    var file_name = this.getFileName(uri);
    var tf = new (require("objectfs-core/io/TextFile").TextFile)();
    tf.open(file_name, charset);
    return tf;
};

/**
 *
 */
exports.getRandomAccessFile = function(uri, mode) {

    var file_name = this.getFileName(uri);
    if (mode.write || mode.append) {
        return new java.io.RandomAccessFile(file_name, "rw");
    } else {
        return new java.io.RandomAccessFile(file_name, "r");
    }
};


/**
 *
 */
exports.getInputStream = function(uri) {

    if (!uri.authority) {

        if (!uri.path) {
            return java.lang.System.in;
        } else {
            var file_name = this.getFileName(uri);
            return new java.io.FileInputStream(file_name);
        }
    } else {
        if (uri.scheme == "http" || uri.scheme == "https") {
            var url = uri.uri;
        } else {
            var url = uri.uri.replace(uri.scheme + "://", "http://");
        }
        return java.net.URL(url).openStream();
    }
};


/**
 *
 */
exports.getInputReader = function(uri, charset) {

    charset = charset || "UTF-8";

    var is = this.getInputStream(uri);
    var isr = new java.io.InputStreamReader(is, charset);
    return new java.io.BufferedReader(isr);
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
            //todo: get HTTP POST/PUT stream
        }
    }
};


/**
 *
 */
exports.getDirectory = function(uri) {

    if (!uri.authority) {
        return uri.path;
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


function getTempFileName() {

    return java.io.File.createTempFile("ofs-is-", null).path;
};


function InputStreamToFileName(input) {

    // Create temporary file:
    var tmp_name = getTempFileName();
    var tmp_file = fs.openRaw(tmp_name, {write:true,binary:true,exclusive:true});

    // Write all input to file:
    var ba = new ByteArray(64*1024); // 64kB sized buffer
    var len = 0;
    while ((len = input.read(ba)) > 0) {
        tmp_file.write(ba, 0, len);
    }
    
    tmp_file.close();
    return tmp_name;


};
