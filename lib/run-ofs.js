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
    Command-line input handler for objectfs-core/ofs module.
*/


// Requirements:
var ofs = require("./ofs");
var ofs_pkg = require("./ofs-pkg");
var uriMapper = require("./uriMapper");

// Exports:
export(
    "options",
    "main",
    "showHelp",
    "showVersion",
    "showError",
    "read",
    "write",
    "remote",
    "list",
    "iterate",
    "mirror");


// --- Main: -----------------------------------------------------------------

var options = {};

if (require.main === module) {
    
    var script_path = system.args.shift();
    main(system.args);
}


/**
 *
 */
function main(args) {

    if (args.length === 0) {
        showHelp();
    } else {

        var cmd = args.shift();
        switch (cmd) {

        // Shell option passed to RingoJS:
        case "-i":
            if (args.length) {
                args.unshift(script_path);
                main(args);
            }
            print("ObjectFS (RingoJS) shell.");
            break;
            
        case "-h":
            showHelp();
            break;

        case "-v":
            showVersion();
            break;

        // ObjectFS options:
        case "--schema":
            options.schema = JSON.parse(args.shift());
            main(args);
            break;

        case "--pk":
            options.pk = args.shift();
            main(args);
            break;

        case "--filter":
            options.filter = parseJs(args.shift());
            main(args);
            break;

        case "--filter-options":
            options.filter_options = parseJs(args.shift());
            main(args);
            break;

        case "--translate":
            options.translate = Function("id", "record", args.shift());
            main(args);
            break;

        // ObjectFS commands:
        case "read":
            print(JSON.stringify(read(args)));
            break;

        case "write":
            return write(args);
            break;

        case "remove":
            return remove(args);
            break;

        case "list":
            print(JSON.stringify(list(args)))
            break;

        case "iterate":
            var gen = iterate(args);
            if (gen && gen.next) {
                for each (var obj in gen) {
                    print(JSON.stringify(obj));
                }
            }
            break;

        case "mirror":
            return mirror(args);
            break;


        case "exists":
        case "create":
        case "update":
        case "copy":
        case "move":
            showError("Not implemented yet.");
            break;

        case "label":
            showError("Comming in future releases.");
            break;

        default:
            showError("Unknown command '" + cmd + "'", args);
        }
    }
}

// --- Helpers: --------------------------------------------------------------

/**
 *
 */
function showHelp() {
    
    print("Usage: ofs [OPTIONS] [COMMAND [ARGUMENTS]]");
    
    print("\nGlobal options:");
    print("     -h Show this help.");
    print("     -i Start JavaScript shell.");
    print("     -v Print version number and exit.");

    print("\nCommand options:");
    print("     --pk NAME               Set primary key field name to be used by storage(s).");
    print("     --schema SCHEMA         Set schema to be used by storage(s).");
    print("     --filter FILTER         Show/use only records matching filter.");
    print("     --filter-options OPT    Limit and sort the records.");
    print("     --translate FUNC_BODY   Transform the records when transfering between storages.");
    
    print("\nCommands:");
    print("     read STORAGE ID         Print one record from the specified storage.");
    print("     iterate STORAGE         Print all records in JSON format. One record per line.");
    print("     list STORAGE            Print all records as a single JSON array.");
    print("     write STORAGE JSON      Write on JSON record to storage.");
    print("     write STORAGE ID JSON   Provide a record ID if you want to update an existing record.");
    print("     remove STORAGE ID       Remove one JSON record from storage.");
    print("     mirror STORAGE1 STORAGE2    Copy all records from one storage to another.");
    print("");
}


/**
 *
 */
function showVersion() {
    print("ObjectFS DEVELOPMENT VERSION");
}


/**
 *
 */
function showError(msg, args) {
    print("ERROR:", msg);
}


//--- Commands: --------------------------------------------------------------

/**
 *
 */
function read(args) {
    
    if (args.length < 2) {
        return showError("Read command needs at least two arguments: storage URL and record ID");
    } else {
        return ofs.read(args[0], args[1]);
    }
}


/**
 *
 */
function write(args) {

    if (args.length < 2) {
        return showError("Write command needs at least two arguments: storage URL and record JSON");
    } else if (args.length === 2) {
        return ofs.write(args[0], false, JSON.parse(args[1]));
    } else {
        return ofs.write(args[0], args[1], JSON.parse(args[2]));
    }
}


/**
 *
 */
function remove(args) {

    if (args.length < 2 || args.length > 2) {
        return showError("Remove expects two arguments: storage URL and record ID");
    } else {
        return ofs.remove(args[0], args[1]);
    }
}


/**
 *
 */
function list(args) {

    if (args.length < 1) {
        return showError("List command needs at least a storage URL");
    } else {
        return ofs.list(args[0], this.options.filter, this.options.filter_options);
    }
}


/**
 *
 */
function iterate(args) {
    
    if (args.length < 1) {
        return showError("Iterate expects at least a storage URL");
    } else {
        return ofs.iterate(args[0], this.options.filter, this.options.filter_options);
    }
}


/**
 *
 */
function mirror(args) {
    
    if (args.length < 2) {
        return showError("Mirror command needs two storage URLs");
    } else {
        return ofs.mirror(args[0], args[1], this.options);
    }
}


// --- Utilities: ------------------------------------------------------------

/**
 *
 */
function parseJs(str) {

    return Function('return ' + str)();
};
