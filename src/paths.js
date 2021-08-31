"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLocalization = exports.readDatasheet = exports.writeFile = exports.OUT = exports.LOCALIZATIONS = exports.DATASHEETS = exports.TMP = exports.DATA = exports.ROOT = void 0;
const fs_1 = require("fs");
exports.ROOT = __dirname + "/..";
exports.DATA = exports.ROOT + "/data";
exports.TMP = exports.ROOT + "/tmp";
exports.DATASHEETS = exports.TMP + "/datasheets";
exports.LOCALIZATIONS = exports.TMP + "/localizations";
exports.OUT = exports.ROOT + "/out";
function writeFile(path, data) {
    let dir = path.substring(0, path.lastIndexOf("/"));
    if (!fs_1.existsSync(dir)) {
        fs_1.mkdirSync(dir, { recursive: true });
    }
    fs_1.writeFileSync(path, data);
}
exports.writeFile = writeFile;
function readDatasheet(name) {
    return JSON.parse(fs_1.readFileSync(exports.DATASHEETS + `/javelindata_${name}.json`, { encoding: "utf-8" }));
}
exports.readDatasheet = readDatasheet;
function readLocalization(name) {
    return JSON.parse(fs_1.readFileSync(exports.LOCALIZATIONS + `/javelindata_${name}.json`, { encoding: "utf-8" }));
}
exports.readLocalization = readLocalization;
//# sourceMappingURL=paths.js.map