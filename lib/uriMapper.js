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
    Creates ObjectFS wrappers for given URIs.
*/


// Requirements:
var core = require("objectfs-core");
var ioHandler = require("./ioHandler");
var objects = require("ringo/utils/objects");

var uriMap = require("./uriMap");
uriMap.connect();

// --- vars: -----------------------------------------------------------------

// Taken from http://tools.ietf.org/html/rfc3986#appendix-B
var uri_regexp = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');

var patterns = getPatterns(uriMap.list());

// --- exports: --------------------------------------------------------------

/**
 * Create and return a connected ObjectFS wrapper for a given URI.
 */
exports.getFs = function(uri, ofs_options) {

    ofs_options = ofs_options || {};

    if (uri.slice(0,4) === "ofs:") {
        uri = uri.slice(4);
    }
    
    var uri = this.parseUri(uri);
    var module = this.findModuleForUri(uri);

    if (!module) {

        //todo: find a suitable package
        return false;
    } else {
        
        var fs = core.cloneModule(module.name);

        uri.params = objects.merge(uri.params, ofs_options, module.options);
        fs.connect(uri, ioHandler);
        
        return fs;
    }
};


/**
 *
 */
exports.findModuleForUri = function(uri) {

    var match = false;
    for each (var pattern in patterns) {
        
        // Counts a score if any of pattern parts matches:
        var score = 0;
        uri.scheme      && pattern.scheme       && uri.scheme.match(pattern.scheme)         && (score += 4);
        uri.authority   && pattern.authority    && uri.authority.match(pattern.authority)   && (score += 2);
        uri.path        && pattern.path         && uri.path.match(pattern.path)             && (score += 1);
        
        // Updates match if new score is higher:
        if (score && (!match || (match && match.score < score))) {
            match = {
                score: score,
                name: pattern.module,
                options: pattern.options,
            };
        }
    }
    
    if (match) {
        return match;
    } else {
        return false;
    }
};


/**
 * Split an URI into its parts:
 */
exports.parseUri = function(uri) {

    var m = uri.match(uri_regexp);

    if (!m || !m.length) {
        
        return false;
    } else {
        
        return {
            uri: uri,
            scheme: m[2],
            authority: m[4],
            path: m[5],
            query: m[7],
            fragment: m[9],
            params: parseQuery(m[7]),
            host: parseAuthority(m[4])
        };
    }
};

// --- private functions: ----------------------------------------------------

/**
 * Return a map of query parameters:
 */
function parseQuery(q) {
    
    var result = {};

    if (q) {
        for each (var pair in q.split(",")) {
            
            var [name,value] = pair.split("=");
            result[name]=decodeURIComponent(value);
        }
    }

    return result;
};


/**
 * Split username:password@host:port into parts:
 */
function parseAuthority(a) {

    if (!a || !a.length) {
        return undefined;
    } else {
        
        var parts = a.split('@');
        
        if (parts.length === 1) {
            
            var [host,port] = parts[0].split(":");
            return {
                host: host,
                port: port
            };
        
        } else if (parts.length === 2) {
            
            var [user,pass] = parts[0].split(":");
            var [host,port] = parts[1].split(":");
            return {
                host: host,
                port: port,
                username: user,
                password: pass
            };
        
        } else {
            return false;
        }
    }
};


/**
 *
 */
function getPatterns(uri_map) {

    return uri_map.map(function(pattern){
            pattern.scheme      = make_pattern(pattern.scheme);
            pattern.authority   = make_pattern(pattern.authority);
            pattern.path        = make_pattern(pattern.path);
            pattern.options     = pattern.options ? parseQuery(pattern.options) : undefined;
            return pattern;
    });

    function make_pattern(str) {

        var undefined;

        if (str === undefined || str === false || str === null || str === "*") {
            return false;
        } else if (str === "") {
            return /^$/;  
        } else if (str[0] === "/") {
            return new RegExp(str);
        
        } else {
            return new RegExp("^" + str
                    .replace(/\./g, '\\.')
                    .replace(/\?/g, ".")
                    .replace(/\*/g, ".*")
                    + "$");
        }
    }

};
