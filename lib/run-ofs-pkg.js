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
    Command-line input handler for objectfs-core/ofs-pkg module.
*/

// Requirements:
var ofs_pkg = require("./ofs-pkg");


// Exports:
export(
    "main",
    "showHelp",
    "showVersion",
    "showError",
    "search",
    "show",
    "install",
    "remove",
    "update",
    "upgrade");


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

        case "search":
            for each (var item in search(args)) {
                print(item.name, "\t\t", item.description);
            }
            break;

        case "show":
            print(JSON.stringify(show(args)));
            break;

        case "install":
            return install(args);
            break;

        case "remove":
            return remove(args);
            break;

        case "update":
            return update(args);
            break;

        case "upgrade":
            return upgrade(args);
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
    
    print("Usage: ofs-pkg [OPTIONS] [COMMAND [ARGUMENTS]]");
    
    print("\nOptions:");
    print("    -h Show this help");
    print("    -v Print version number and exit");
    
    print("\nCommands:");
    print("    search STRING                    Show packages containing string in names and descriptions");
    print("    show PKGNAME                     Show information about the package");
    print("    install PKGNAME [PKGNAME2...]    Install package(s)");
    print("    remove PKGNAME [PKGNAME2...]     Remove package(s)");
    print("    update [PKGNAME [PKGNAME2...]]   Update package(s)");
    print("    upgrade [PKGNAME [PKGNAME2..]]   Upgrade package(s)");
    print("");
}


/**
 *
 */
function showVersion() {
    print("ObjectFS Package manager DEVELOPMENT VERSION");
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
function search(args) {

    return ofs_pkg.search(args[0]);
}


/**
 *
 */
function show(args) {

    return ofs_pkg.show(args[0]);
}


/**
 *
 */
function install(args) {

    return ofs_pkg.install(args);
}


/**
 *
 */
function remove(args) {

    return ofs_pkg.remove(args);
}


/**
 *
 */
function update(args) {

    return ofs_pkg.update(args);
}


/**
 *
 */
function upgrade(args) {

    return ofs_pkg.upgrade(args);
}
