const fs = require("fs");
const path = process.argv[3];
const package = require(path + "/package.json");

package.version = process.argv[2];
fs.writeFileSync(path + "/package.json", JSON.stringify(package, null, 2));
