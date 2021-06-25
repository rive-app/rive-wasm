const fs = require('fs');

let package = require('./package.json');
let current = package.version.split('.');
let versions = JSON.parse(process.argv[2].trim().replace(/\'/g, '"'));

for (let i = 0; i < current.length; i++) {
    current[i] = Number.parseInt(current[i]);
}

// Set the build number at minimum to the desired one, that way if nothing
// conflicts, we'll take it.
let buildNumber = current[2];
// Iterate all versions and find the max buildNumber that is in use so we can
// take the next one.
for (let version of versions) {
    version = version.split('.');
    for (let i = 0; i < version.length; i++) {
        version[i] = Number.parseInt(version[i]);
    }
    if (current[0] == version[0] && current[1] == version[1] && buildNumber < version[2]) {
        buildNumber = version[2] + 1;
    }

}

current[2] = buildNumber;
package.version = current.join('.');

fs.writeFileSync('./package.json', JSON.stringify(package, null, 2));