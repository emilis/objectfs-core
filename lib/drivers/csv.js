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


exports.stream = false;
exports.schema = false;
exports.options = {
    separator: ","
};

exports.list = [];

/**
 *
 */
exports.connect = function(uri, ofs_options, io) {

    if (ofs_options.read_only && ofs_options.one_pass) {
        this.stream = io.getInputReader(uri);
    } else {
        this.stream = io.getFile(uri);
    }

    this.options = uri.params || this.options;

    if (this.options.schema) {
        this.schema = this.options.schema.split(",");
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

    //print("write", line, uneval(obj));

    if (!this.schema) {
        if (this.empty_file) {
            this.schema = Object.keys(obj);
        } else {
            var gen = this.iterate();
            this.schema = gen.next();
            gen.close();
        }
    }

    if (this.empty_file) {
        this.append(this.stringifyRow(this.schema, false));
        this.empty_file = false;
    }

    if (!line) {
        this.append(this.stringifyRow(obj, this.schema));
    } else {
        var list = this.list();
        list[line]=obj;
        this.rewrite(list);
    }
};


/**
 *
 */
exports.remove = function(line) {

    if (!line && line !== 0) {
        return false;
    }

    if (this.empty_file) {
        return false;
    }

    var gen = this.iterate();
    var list = [];
    while (line--) {
        list.push(gen.next());
    }
    gen.next();
    for each (var obj in gen) {
        list.push(obj);
    }

    this.rewrite(list);
};


/**
 *
 */
exports.list = function(filter, options) {

    if (this.empty_file) {
        return [];
    }

    var list = [];
    for each (var obj in this.iterate(filter, options)) {
        list.push(obj);
    }

    return list;
};


/**
 *
 */
exports.iterate = function() {

    try {
        this.stream.reset();
    } catch (e) {
        // do nothing
    }

    var gen = this.parse();
    if (!this.options.noSchemaLine) {
        if (!this.schema) {
            this.schema = gen.next();
        } else {
            gen.next();
        }
    }

    for each (var row in gen) {
        if (row.length) {
            yield this.schema.reduce(function(r,v,i) {
                r[v]=row[i];
                return r;
                }, {});
        }
    }
};


/**
 *
 */
exports.getSchema = function() {

    if (!this.schema) {
        var gen = this.iterate(false, {limit:1});
        var first = gen.next();
        if (first) {
            this.schema = Object.keys(first);
        }
    }
    return this.schema;
};


// ---------------------------------------------------------------------------


/**
 *
 */
exports.readFromFile = function(file_name) {

    var list = this.parse(fs.read(file_name));

    if (!list.length) {
        return list;
    } else {
        if (!this.schema) {
            this.schema = list.shift();
        }
        var schema = this.schema;
        var len = this.schema.length;
        return list.map(function(row){
                var obj = {};
                for (var i=0;i<len;i++) {
                    obj[schema[i]] = row[i];
                }
                return obj;
                });
    }
};


/**
 *
 */
exports.writeToFile = function(file_name) {

    var out_list = [];
    var schema = this.schema;

    var out_list = this.list.map(function(obj){
            var row = [];
            for each (var k in schema) {
                row.push(obj[k]);
            }
            return row;
            });

    out_list.unshift(Object.keys(schema));

    return fs.write(file_name, this.stringify(out_list));
};


/**
 *
 */
exports.parseStream = function(is) {

    var opt = {
        sep: this.options.separator,
        lsep: "\n",
        quo: '"'
    };

    var row = [];
    var item = false;
    while (item = parseItem(is, opt)) {
        if (item.str !== false) {
            row.push(item.str);
        }
        if (item.lsep) {
            yield row;
            row = [];
        }
    }
    yield row;
};


function nextChar(is) {
    var char = is.read();
    if (char < 0) {
        return false;
    } else {
        return java.lang.Character.toString(char);
    }
}

function parseItem(is, opt) {

    var char = false;
    while (char = nextChar(is)) {
        switch (char) {
            case " ":
                break;
            case opt.quo:
                return parseQuotedItem(is, opt);
                break;
            case opt.sep:
                return {str:""};
                break;
            case opt.lsep:
                return {str:false,lsep:true};
                break;
            default:
                var str = char;
                while (char = nextChar(is)) {
                    switch (char) {
                        case opt.sep:
                            return {str:str};
                            break;
                        case opt.lsep:
                            return {str:str,lsep:true};
                            break;
                        default:
                            str += char;
                    }
                }
                return {str:str};
        }
    }
};

function parseQuotedItem(is, opt) {

    var str = "";
    var char = false;
    while (char = nextChar(is)) {
        if (char === '"') {
            is.mark(1024);
            char = nextChar(is);
            if (char === '"') {
                str += char;
            } else {
                is.reset();
                return {str:str};
            }
        } else {
            str += char;
        }
    }
    throw Error("Unterminated quoted item.");
};


/**
 *
 */
exports.stringify = function(list) {

    var item_separator = this.options.separator || ",";

    //print(uneval(list));

    return list.map(function(line){
        return line.map(function(item){
            if (item.indexOf && item.indexOf('"') !== -1) {
                return ['"', item.replace(/"/g, '""'), '"'].join("");
            } else {
                return ['"', item, '"'].join("");
            }
        }).join(item_separator);
    }).join("\n");
};


/**
 * Parses multi-line CSV string into two-dimentional array.
 *
 * @param {String} csv CSV string.
 * @param {String} optional separator Item separator character (defaults to ",").
 * @returns {Array}
 */
exports.parse = function() {

    //print(uneval(this.options));

    var sep = this.options.separator || ",";
    var lsep = "\n"; // line separator
    var quo = '"'; // quote character

    // Operation modes:
    var BEGIN = 0;
    var NEXT = 1;
    var QUOTED = 2;
    var mode = BEGIN; // current mode

    // Arrays:
    var row = []; // current line array
    var cur = ""; // current item value

    var line = false;
    while (line = trimNewline(this.stream.readLine())) {
    
        // String parameters:
        var len = line.length; // string length
        var pos = 0; // current position in string

        //print(line, len, pos, cur);

        while (pos < len) {
            switch (mode) {
                case BEGIN:
                    switch (line[pos]) {
                        case " ":
                            pos++;
                        break;
                        case lsep:
                            yield row;
                            row = [];
                            pos++;
                        break;
                        case sep:
                            row.push("");
                            pos++;
                        break;
                        case quo:
                            mode = QUOTED;
                            cur = "";
                            pos++;
                        break;
                        default:
                            // Found item text character. Try to capture the whole item.

                            var nlpos = line.indexOf(lsep, pos); // line separator position
                            var nipos = line.indexOf(sep, pos); // item separator position

                            if ((nlpos != -1) && ((nipos == -1) || (nlpos < nipos))) {
                                // found line separator first:
                                row.push(line.slice(pos, nlpos));
                                yield row;
                                row = [];
                                pos = nlpos + 1;
                            } else if (nipos != -1) {
                                // found item separator first:
                                row.push(line.slice(pos, nipos));
                                pos = nipos + 1;
                            } else {
                                // found no separators:
                                row.push(line.slice(pos, len));
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
                        cur += line.slice(pos);
                        pos = len;
                    } else if (line[qpos + 1] == quo) {
                        // Two quotes one after another (escaped quote char):
                        cur += line.slice(pos, qpos) + quo;
                        pos = qpos + 2;
                    } else {
                        // Ending quote:
                        cur += line.slice(pos, qpos);
                        row.push(cur);
                        cur = "";
                        mode = NEXT;
                        pos = qpos + 1;
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
                            row = [];
                            mode = BEGIN;
                            pos++;
                        break;
                        default:
                            throw Error("Item data found where item or line separator was expected at " + pos);
                    }
                break;
                default:
                    throw Error("Unknown operation mode " + mode);

            }
        }

        if (mode === BEGIN || mode === NEXT && row.length) {
            yield row;
            row = [];
            mode = BEGIN;
        } else if (mode === QUOTED) {
            cur += "\n";
        }
    }

    yield row;
}


function trimNewline(str) {

    if (!str) {
        return str;
    }

    var last = str.slice(-1);

    if (last === "\n") {
        return str.slice(0,-1);
    
    } else if (last === "\r") {
        if (str.slice(-1) === "\n") {
            return str.slice(0,-2);
        } else {
            return str.slice(0,-1);
        }
    } else {
        return str;
    }
}

