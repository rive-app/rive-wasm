const fs = require("fs");
const path = process.argv[3];
const package = require(path + "/package.json");
const newVersionToBumpTo = process.argv[2];

const litePackages = [
  "@rive-app/canvas-lite",
  "@rive-app/canvas-advanced-lite",
];

// TEMP: Set the lite packages at 0.1.x until we do a quick test when its published
// that everything looks good. Then we can remove this if statement
if (litePackages.indexOf(package.name) > -1) {
  package.version = `0.1.${newVersionToBumpTo.charAt(
    newVersionToBumpTo.length - 1
  )}`;
} else {
  package.version = newVersionToBumpTo;
}

fs.writeFileSync(path + "/package.json", JSON.stringify(package, null, 2));
