/*
    Copyright 2010,2011 Emilis Dambauskas

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
    Reads and writes CSV data.
*/


// Requirements:
var fs = require("fs");
var ioHandler = require("objectfs-core/ioHandler");


exports.stream = false;
exports.schema = false;
exports.options = {
    noSchemaLine: false,
    separator: ",",
    schema: false
};

exports.list = [];

/**
 *
 */
exports.connect = function(uri, ofs_options, io) {

    ofs_options = ofs_options || {};
    io = io || ioHandler;

    if (ofs_options.read_only && ofs_options.one_call) {
        this.stream = io.getInputStream(uri);
    } else {
        var charset = uri.params && uri.params.charset;
        this.stream = io.getTextFile(uri, charset);
    }

    this.options = uri.params || this.options;

    if (this.options.schema) {
        this.schema = this.options.schema.split(":");
    }
};


/**
 *
 */
exports.read = function(line) {

    line = parseInt(line, 10) || 0;

    if (this.empty_file) {
        return false;

    } else {    
        var gen = this.iterate();

        try {
            while (line--) {
                gen.next();
            }
            var result = gen.next();
        } catch (e) {
            return null;
        }

        gen.close();
        return result;
    }
};


/**
 *
 */
exports.write = function(line, obj) {

    if (!line && line !== "0" && line !== 0) {
        return this.create(obj);
    } else {
        return this.update(line, obj);
    }
};


/**
 *
 */
exports.create = function(obj) {

    var schema = this.getSchema(obj);

    return this.stream.writeLine(this.stringifyRow(obj));
};


/**
 *
 */
exports.update = function(line, obj) {

    line = parseInt(line, 10);

    // Create temp file:
    var tmp_file = ioHandler.createTempFile({write:true});

    if (!this.options.noSchemaLine) {
        tmp_file.writeLine(this.stringifyRow(this.schema));
    }
    
    // Write lines to temp file:
    var gen = this.iterate();
    while (line--) {
        tmp_file.writeLine(this.stringifyRow( gen.next() ));
    }
    tmp_file.writeLine(this.stringifyRow(obj));
    gen.next();
    for each (var nobj in gen) {
        tmp_file.writeLine(this.stringifyRow(nobj));
    }

    fs.copy(tmp_file, this.stream);
    tmp_file.close();
    fs.remove(tmp_file);

    return true;
};


/**
 *
 */
exports.remove = function(line) {

    line = parseInt(line, 10);

    var tmp_file = ioHandler.createTempFile({write:true});

    if (!this.options.noSchemaLine) {
        tmp_file.writeLine(this.stringifyRow(this.schema));
    }

    var gen = this.iterate();
    while (line--) {
        tmp_file.writeLine(this.stringifyRow( gen.next() ));
    }
    gen.next();
    for each (var nobj in gen) {
        tmp_file.writeLine(this.stringifyRow(nobj));
    }

    fs.copy(tmp_file, this.stream);
    tmp_file.close();
    fs.remove(tmp_file);

    return true;
};


/**
 *
 */
exports.list = function(filter, options) {

    var list = [];
    for each (var obj in this.iterate(filter, options)) {
        list.push(obj);
    }

    return list;
};


/**
 *
 */
exports.iterate = function(filter, options) {

    if (this.stream.seek) {
        this.stream.seek(0);
    }

    if (this.stream.readStrings) {
        var gen = this.parse(this.stream.readStrings());
    } else {
        var gen = this.parse(ioHandler.readStrings(
                    this.stream.read.bind(this.stream),
                    this.options.charset
                    ));
    }

    if (!this.options.noSchemaLine) {
        if (!this.schema) {
            this.schema = gen.next();
        } else {
            gen.next();
        }
    }

    for each (var row in gen) {
        if (row.length) {
            yield this.schema.reduce(
                function(record, field, index) {
                    record[field]=row[index];
                    return record;
                },
                {});
        }
    }
};

// ---------------------------------------------------------------------------

/**
 *
 */
exports.getSchema = function(rec) {

    if (!this.schema) {
        try {
            var gen = this.iterate(false, {limit:1});
            var first = gen.next();
            if (first) {
                this.schema = Object.keys(first);
            }
        } catch (e) {
            this.schema = Object.keys(rec);
        }
    }
    return this.schema;
};




/**
 *
 */
exports.stringifyRow = function(row) {

    var item_separator = this.options.separator || ",";

    if (!(row instanceof Array)) {
        row = this.recordToRow(row);
    }

    return row.map(function(item){
        if (item.indexOf && item.indexOf('"') !== -1) {
            return ['"', item.replace(/"/g, '""'), '"'].join("");
        } else {
            return ['"', item, '"'].join("");
        }
    }).join(item_separator);
};


/**
 *
 */
exports.recordToRow = function(rec) {

    return this.getSchema(rec)
        .map(function(field){
            return rec[field];
        });
}


/**
 * Parses multi-line CSV string into two-dimentional array.
 *
 * @param {String} csv CSV string.
 * @param {String} optional separator Item separator character (defaults to ",").
 * @returns {Array}
 */
exports.parse = function(strings) {

    var sep = this.options.separator || ",";
    var lsep = "\n"; // line separator
    var quo = '"'; // quote character

    // Operation modes:
    var BEGIN = 0;
    var NEXT = 1;
    var QUOTED = 2;
    var END_QUOTE = 3;
    var mode = BEGIN; // current mode

    var QUOTED_ENDQ = false;

    // Arrays:
    var row = []; // current line array
    var cur = []; // current item value

    var row_no = 0;
    var line = false;
    //var gen = ioHandler.readStrings(this.stream.read.bind(this.stream));
    //for each (var line in gen) {
    for each (var line in strings) {
   
        // String parameters:
        var len = line.length; // string length
        var pos = 0; // current position in string

        while (pos < len) {
            switch (mode) {
                case BEGIN:
                    switch (line[pos]) {
                        case " ":
                            pos++;
                        break;
                        case lsep:
                            yield row;
                            row_no++;
                            row = [];
                            pos++;
                        break;
                        case sep:
                            row.push("");
                            pos++;
                        break;
                        case quo:
                            mode = QUOTED;
                            cur = [];
                            pos++;
                        break;
                        default:
                            // Found item text character. Try to capture the whole item.

                            var nlpos = line.indexOf(lsep, pos); // line separator position
                            var nipos = line.indexOf(sep, pos); // item separator position

                            if ((nlpos != -1) && ((nipos == -1) || (nlpos < nipos))) {
                                // found line separator first:
                                cur.push(line.slice(pos, nlpos));
                                row.push(cur.join(""));
                                yield row;
                                row_no++;
                                row = [];
                                cur = [];
                                pos = nlpos + 1;
                            } else if (nipos != -1) {
                                // found item separator first:
                                cur.push(line.slice(pos, nipos));
                                row.push(cur.join(""));
                                cur = [];
                                pos = nipos + 1;
                            } else {
                                // found no separators:
                                cur.push( line.slice(pos, len));
                                pos = len;
                            }
                    }
                break;
                case QUOTED:
                    // Quoted string parsing.

                    // Search for next quote:
                    var qpos = line.indexOf(quo, pos);

                    if (qpos == -1) {
                        // Quote not found.
                        //throw Error("Unclosed quote in string at " + (pos - 1));
                        cur.push( line.slice(pos) );
                        pos = len;
                    } else if (qpos === (len - 1)) {
                        cur.push( line.slice(pos, qpos) );
                        pos = len;
                        mode = END_QUOTE;
                    } else if (line[qpos + 1] == quo) {
                        // Two quotes one after another (escaped quote char):
                        cur.push( line.slice(pos, qpos), quo);
                        pos = qpos + 2;
                    } else {
                        // Ending quote:
                        cur.push( line.slice(pos, qpos));
                        row.push(cur.join(""));
                        cur = [];
                        mode = NEXT;
                        pos = qpos + 1;
                    }
                break;
                case END_QUOTE:
                    if (pos) {
                        throw Error("Position for END_QUOTE mode is not zero: " + row_no + ":" + pos);
                    }
                    if (line[pos] == quo) {
                        cur.push(quo);
                        pos++;
                        mode = QUOTED;
                    } else {
                        row.push(cur.join(""));
                        cur = [];
                        mode = NEXT;
                    }
                break;
                case NEXT:
                    // Item text has ended. Search for next item separator.
                    
                    switch (line[pos]) {
                        case " ":
                            pos++;
                        break;
                        case sep:
                            mode = BEGIN;
                            pos++;
                        break;
                        case lsep:
                            yield row;
                            row_no++;
                            row = [];
                            cur = [];
                            mode = BEGIN;
                            pos++;
                        break;
                        default:
                            throw Error("Item data found where item or line separator was expected at " + row_no + ":" + pos + "'" + line.slice(Math.max(pos-10,0), pos+10) + "'");
                    }
                break;
                default:
                    throw Error("Unknown operation mode " + mode);

            }
        }
    }

    yield row;
}


