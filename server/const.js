const os = require('os');

const MAX_UPLOAD_SIZE = 5; // MB
const UPLOAD_DIR = os.homedir + '/' + 'uploader_example';
const PORT_NUM = 3001;

exports.MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE;
exports.UPLOAD_DIR = UPLOAD_DIR;
exports.PORT_NUM = PORT_NUM;
