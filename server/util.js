const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const { UPLOAD_DIR } = require('./const.js');

// makes sure the upload directory exists before uploads start
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

function getExtension(fileName) {
    return path.extname(fileName);
}

function getFileName_noExtension(fileName) {
    return path.parse(fileName).name
}

// returns a randomly generated URL safe id to give to uploads.
function getUniqueID() {
    let id = crypto.randomBytes(6).toString("base64");
    while (id.includes('/') || id.includes('+')) {
        id = crypto.randomBytes(6).toString("base64");
    }

   return id;
}

/**
 * Ensures files do not get over-written.
 * @param {*} fileName 
 * @param {*} directory
 * @returns the orginal file, or a new incrimented filename if already existed 
 */
function checkUnique(fileName, directory) {
    let name = path.parse(fileName).name;
    let ext = path.parse(fileName).ext
    
    let i = 2;
    let file = path.join(directory + "/" + fileName);
    while(fs.existsSync(file)) {
        fileName = `${name} (${i})${ext}`;
        file = path.join(directory + "/" + fileName);
        i++;
    }

    return fileName;
}


exports.getExtension = getExtension;
exports.getFileName_noExtension = getFileName_noExtension;
exports.getUniqueID = getUniqueID;
exports.checkUnique = checkUnique;