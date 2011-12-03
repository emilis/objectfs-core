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
    ObjectFS package manager.
*/

// Requirements:
var arrays = require("ringo/utils/arrays");
var fs = require("fs");
var ioHandler = require("./ioHandler");
var shell = require("ringo/shell");

var packages = require("./wrappers/packages");
packages.connect();

// Properties:
exports.package_dir = fs.resolve(module.directory + "/../../");


/**
 *
 */
exports.search = function(str) {

    str = str || ".";
    var re = new RegExp(str, "i");
    
    for each (var pkg in packages.iterate()) {
        if (
                (pkg.name && pkg.name.match && pkg.name.match(re))
                || (pkg.description && pkg.description.match && pkg.description.match(re))
            ) {
            yield pkg;
        }
    }
};


/**
 *
 */
exports.show = function(name) {

    return packages.read(name);
};


/**
 *
 */
exports.install = function(names) {

    var all_names = this.getFullInstallList(names);

    if (all_names.length !== names.length
        || arrays.intersection(all_names, names).length !== names.length) {
        print("The following packages will be installed:");
        print("    ", all_names.join(" "));
    }

    all_names.map(function(name) {

        var pkg = packages.read(name);
        if (!pkg) {
            throw Error("Package " + name + ".json file not found.");
        } else {
            print("Installing package", name);
        }
        
        if (pkg.repositories && pkg.repositories.length) {
            var repos = pkg.repositories.filter(function(repo){ return repo.type=="git"; });
            if (repos.length) {
                var repo = repos[0];
                var output = exec(["git", "clone", repo.url]);
                for each (var str in output) {
                    print(str);
                }
            }
        }
    });
};


/**
 *
 */
exports.isInstalled = function(name) {

    return fs.exists(getPackageDir(name));
};


/**
 *
 */
exports.remove = function(names) {

    forInstalled.call(this, names, function(name) {
            
            var choice = shell.readln("Are you sure you want to remove package '" + name + "' [Y/n]");
            if (choice.toLowerCase().trim() != "n") {
                fs.removeTree(getPackageDir(name));
            }
        }
    );
};


/**
 *
 */
exports.update = function(names) {

    names = (names && names.length) ? names : fs.list(this.package_dir);

    forInstalled.call(this, names, function(name) {

            print("Updating package", name);

            var output = exec(["git", "fetch"], null, getPackageDir(name));
            for each (var str in output) {
                print(str);
            }
    });
};


/**
 *
 */
exports.upgrade = function(names) {

    names = (names && names.length) ? names : fs.list(this.package_dir);

    forInstalled.call(this, names, function(name) {
            print("Upgrading package", name);

            var output = exec(["git", "pull", "origin", "master"], null, getPackageDir(name));
            for each (var str in output) {
                print(str);
            }
    });
};


/**
 *
 */
exports.getFullInstallList = function(names) {
    //todo: cache results.

    var all_names = [];

    for each (var name in names) {
        if (!this.isInstalled(name)) {

            all_names.push.apply(all_names, this.getDependencies(name));
            all_names.push(name);
        }
    }

    return arrays.union(all_names);
};


/**
 *
 */
exports.getDependencies = function(name) {
    //todo: cache results.

    var pkg = packages.read(name);
    if (!pkg) {
        throw Error("Package " + name + ".json file not found.");
    }

    if (!pkg.dependencies || !pkg.dependencies.length) {
        return [];
    } else {

        var pd = pkg.dependencies;
        var dependencies = [];
        for (var dep_name in pd) {
            
            var dep_value = pd[dep_name];
            if (typeof(dep_value) === "object" && !(dep_value instanceof Array) && !(dep_value instanceof String)) {
                dep_name = Object.keys(dep_value).shift();
                dep_value = dep_value[dep_name];
            }

            dependencies.push.apply(dependencies, this.getDependencies(dep_name));
            dependencies.push(dep_name);
        }

        return dependencies;
    }
};


// --- Utilities: ------------------------------------------------------------


/**
 *
 */
function exec(cmdargs, env, path) {

    env = env || null;
    path = path ? java.io.File(path) : java.io.File(exports.package_dir);

    var process = java.lang.Runtime.getRuntime().exec(cmdargs, env, path);
    var out = process.getInputStream();

    return ioHandler.readStrings(out.read.bind(out));
}


/**
 *
 */
function getPackageDir(name) {

    return [exports.package_dir, name].join("/");
};


/**
 *
 */
function forInstalled(names, callback) {
    
    for each (var name in names) {
        if (!this.isInstalled(name)) {
            throw Error("Package '" + name + "' is not installed.");
        } else {
            callback.call(this, name);
        }
    }
}


/**
 *
 */
function forNotInstalled(names, callback) {
    
    for each (var name in names) {
        if (this.isInstalled(name)) {
            print("Package '" + name + "' is already installed.");
        } else {
            callback.call(this, name);
        }
    }
}

