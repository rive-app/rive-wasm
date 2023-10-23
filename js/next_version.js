const fs = require("fs");
const path = process.argv[3];
const package = require(path + "/package.json");
const newVersionToBumpTo = process.argv[2];

package.version = newVersionToBumpTo;

fs.writeFileSync(path + "/package.json", JSON.stringify(package, null, 2));
