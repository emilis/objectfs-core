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
    Some utility functions for ObjectFS-core modules.
*/


// Requirements:
var objects = require("ringo/utils/objects");


/**
 * Creates a clone for a module specified by module_id.
 */
exports.cloneModule = function(module_id, child) {

    child = child || {};

    var parent = require(module_id);
    child = objects.clone(parent, child, true);
    child.parent = parent;

    return child;
};
