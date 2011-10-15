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
    Creates ObjectFS drivers for given URIs.
*/


// Requirements:
var core = require("objectfs-core");

// --- vars: -----------------------------------------------------------------

// Taken from http://tools.ietf.org/html/rfc3986#appendix-B
var uri_regexp = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');


// Scheme map:
var schemes = {
    "sqlite":   "ofs-sqlite",
};

// --- exports: --------------------------------------------------------------

/**
 * Create and return a connected ObjectFS driver for a given URI.
 */
exports.getFs = function(uri) {

    if (uri.slice(0,4) === "ofs:") {
        uri = uri.slice(4);
    }
    
    var uri = this.parseUri(uri);

    if (!schemes[uri.scheme]) {
        
        return false;
    } else {
        
        var fs = core.cloneModule(schemes[uri.scheme]);
        fs.connect(uri);
        return fs;
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
        for each (var pair in q.split("&")) {
            
            var [name,value] = pair.split("=");
            result[name]=value;
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
