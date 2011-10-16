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


// Exports:
export(
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


if (require.main === module) {
    main(system.args);
}


/**
 *
 */
function main(args) {

    var script_path = args.shift();

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
    
    print("\nOptions:");
    print("    -h Show this help");
    print("    -v Print version number and exit");
    
    print("\nCommands:");
    print("    read FS ID  Read one record from the specified storage");
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
    } else if (args.length === 1) {
        return ofs.list(args[0]);
    } else {
        if (args[1][0] === "{") {
            args[1] = JSON.parse(args[1]);
        }
        return ofs.list(args[0], args[1]);
    }
}


/**
 *
 */
function iterate(args) {
    
    if (args.length < 1) {
        return showError("Iterate expects at least a storage URL");
    } else if (args.length === 1) {
        return ofs.iterate(args[0]);
    } else {
        if (args[1][0] === "{") {
            args[1] = JSON.parse(args[1]);
        }
        return ofs.iterate(args[0], args[1]);
    }
}


/**
 *
 */
function mirror(args) {
    
    if (args.length < 2) {
        return showError("Mirros command needs two storage URLs");
    } else {
        return ofs.mirror(args[0], args[1]);
    }
}

