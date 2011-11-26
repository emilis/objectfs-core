# ObjectFS-core

Core library for ObjectFS.

**This is still under heavy development. Don&#39;t expect anything to work.**

## Usage

### Example

```javascript
// Get the first user information from your passwd file:
var ofs = require("objectfs-core/ofs");
ofs.list("csv:/tmp/passwd?separator=:,noSchemaLine=true,schema=user:x:uid:gid:name:home:shell");
```
OR

```javascript
// Same as above, but use the CSV wrapper directly:
var uriMapper = require("objectfs-core/uriMapper");
var passwd = uriMapper.getFs("csv:/tmp/passwd?separator=:,noSchemaLine=true,schema=user:x:uid:gid:name:home:shell");
passwd.list();
```
OR

```javascript
// Same as above, but instantiate the CSV wrapper yourself:
var csv = require("objectfs-core/wrappers/csv");
csv.connect({
    path:"/tmp/passwd",
    params: {
        separator:":",
        noSchemaLine:true,
        schema="user:x:uid:gid:name:home:shell"
        }
});
csv.list();
```

### API summary

#### objectfs-core/ofs

<table><tbody>
<tr><td align="right">Object</td>
    <td><b>read</b> (URI, ID)</td>
    <td>Read one record from the specified storage.</td></tr>
<tr><td align="right">Boolean</td>
    <td><b>write</b> (URI, ID, Object)</td>
    <td>Write one record to the specified storage with the given ID. Set ID to false if you want to create a new record.</td></tr>
<tr><td align="right">Boolean</td>
    <td><b>remove</b> (URI, ID)</td>
    <td>Remove one record from the specified storage.</td></tr>
<tr><td align="right">Array</td>
    <td><b>list</b> (URI, filter, options)</td>
    <td>Get an array of records matching the criteria.</td></tr>
<tr><td align="right"><a href="https://developer.mozilla.org/en/JavaScript/Guide/Iterators_and_Generators">Iterator</a></td>
    <td nowrap="nowrap"><b>iterate</b> (URI, filter, options)</td>
    <td>A generator function that returns an iterator over all records in the storage matching the criteria.</td></tr>
<tr><td align="right">Number</td>
    <td><b>mirror</b> (URI, URI)</td>
    <td>Copies records from one storage into another. Returns the number of records transfered.</td></tr>
</tbody></table>

#### objectfs-core/ofs-pkg

<table><tbody>
<tr><td align="right"><a href="https://developer.mozilla.org/en/JavaScript/Guide/Iterators_and_Generators">Iterator</a></td>
    <td><b>search</b> (string)</td>
    <td>Return a list of packages which names and descriptions match the given string.</td></tr>
<tr><td align="right">Object</td>
    <td><b>show</b> (name)</td>
    <td>Return an object from the package&#39;s package.json file.</td></tr>
<tr><td align="right">void</td>
    <td><b>install</b> (name[])</td>
    <td>Install the specified packages. Throws error on the first package that is already installed.</td></tr>
<tr><td align="right">void</td>
    <td><b>remove</b> (name[])</td>
    <td>Remove the specified packages. Throws error on the first package that is not installed.</td></tr>
<tr><td align="right">void</td>
    <td><b>update</b> (name[])</td>
    <td>Fetches git updates from the packages default remote repository, but doesn&#39;t update the package files.<br>
        Throws error on the first package that is not installed.</td></tr>
<tr><td align="right">void</td>
    <td><b>upgrade</b> (name[])</td>
    <td>Updates packages from their default remote repositories. Note: this may break your changes to package files.<br>
        Throws error on the first package that is not installed.</td></tr>
</tbody></table>

#### objectfs-core/uriMapper

<table><tbody>
<tr><td align="right">Object</td>
    <td><b>getFs</b> (uri)</td>
    <td>Creates an ObjectFS storage wrapper instance and connects it to the specified storage.</td></tr>
<tr><td align="right">Object</td>
    <td><b>findModuleForUri</b> (uri)</td>
    <td>Finds a module name to work as a wrapper for the storage specified in uri.</td></tr>
<tr><td align="right">Object</td>
    <td><b>parseUri</b> (uri)</td>
    <td>Splits a given uri String into parts.<br>
    E.g.: <code>http://example.org/path/to/file?p1=v1,p2=v2#fragment</code> would become:<br>
        <pre>{ schema: "http",
  authority: "example.org",
  path: "/path/to/file",
  query: "p1=v1",
  params: { p1: "v1",
            p2: "v2" },
  fragment: "fragment"
}</pre><em>Note that a comma "," is used instead of ampersand "&amp;" to separate query parameters.</em></td></tr>
</tbody></table>

### Requirements

- [RingoJS](http://ringojs.org/) v0.8
- "config" module with `DIRS.config` variable set to the appropriate configuration directory.
- git command in your PATH.

## About

### License

This is free software, and you are welcome to redistribute it under certain conditions; see LICENSE.txt for details.

### Thanks

- [RingoJS](http://ringojs.org/) developers and maintainers.
- Open Society Institute for funding the development of [KąVeikiaValdžia.lt](http://kaveikiavaldzia.lt/) during which this concept was born.

### Author contact

Emilis Dambauskas <emilis.d@gmail.com>, <http://emilis.github.com/>



