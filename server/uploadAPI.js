const Busboy = require('busboy');
const { app, http } = require('./server');
let io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const { getUniqueID, checkUnique } = require('./util');

const { MAX_UPLOAD_SIZE, UPLOAD_DIR } = require('./const.js');

// To hold the sockets
let connections = {};

// defines the handlers for each socket.
io.on("connection", (newSocket) => {
  console.log(`Socket connected: ${newSocket.id}`);
  addSocket(newSocket);
});

// adds a socket to the connections object and defines its handlers.
function addSocket(newSocket) {
  let socketId = newSocket.id;
  connections[socketId] = { socket: newSocket, uploads: {} };

  connections[socketId].socket.on("disconnect", () => {
    if (deleteSocket(socketId)) {
      console.log(`Socket ${socketId} disconnected and deleted`);
    }
    else {
      console.log(`Socket ${socketId} disconnected, but an error occured deleteing it.`);
    }
  });
}

// removes a socket from the connections object
function deleteSocket(socketId) {
  return delete connections[socketId];
}

// associates an upload with the socket. 
function addUpload(uploadId, socketId, uploadDst, givenFileName) {
  if (connections[socketId]) {
    connections[socketId].uploads[uploadId] = {
      uploadDst: uploadDst,
      originalFileName: givenFileName,
    };

  }
  else {
    throw (`Socket id ${socketId} was not found`);
  }
}

// endpoint for upload
app.post('/upload/:socketId/:tempUploadId', function (req, res) {
  console.log("upload endpoint hit.");

  let socketId = req.params.socketId;
  let tempUploadId = req.params.tempUploadId;
  let percentUploaded = 0;
  let bytesRecieved = 0;
  let fileSize = req.headers["content-length"];
  let uploadId = getUniqueID();
  let uploadDst;
  let fileName;

  // Do some validation here. Using size as example
  if (fileSize / (1000 * 1000).toFixed(2) > MAX_UPLOAD_SIZE) {
    console.log(`Chosen file is ${fileSize / (1000 * 1000).toFixed(2)} MB, while ${MAX_UPLOAD_SIZE} MB is the maximum. Returning 400..`);
    res.status(400).send({ error: `File Too Large. Max Size: ${MAX_UPLOAD_SIZE} Mb.` });
    return;
  }
  // make sure the socket is connected.
  else if (!connections[socketId]) {
    console.log(`${socketId} not found.`);
    req.unpipe();
    res.status(400).send({ error: `Socket ${socketId} not found.` });
    return;
  }
  // do the upload
  else {
    let busboy = new Busboy({ headers: req.headers });

    busboy.on('file', function (fieldName, file, givenFileName, encoding, mimetype) {
      // set the fileName
      fileName = checkUnique(givenFileName, UPLOAD_DIR);
      // set the upload dst
      uploadDst = path.join(UPLOAD_DIR + "/" + fileName);
      // map this socket to this upload
      try {
        // uploadId, socketId, uploadDst, givenFileName
        addUpload(uploadId, socketId, uploadDst, givenFileName);
      }
      catch (err) {
        console.log("Error adding upload.");
        console.log(err);
        res.status(400).send({ error: err });
        return;
      }

      // signal to client that we are starting the upload
      // and give the client the uploads official ID.
      if (connections[socketId] && connections[socketId].socket) {
        connections[socketId].socket.emit("uploadStart", {
          uploadId: uploadId,
          tempUploadId: tempUploadId
        });
      }

      // callback for recieving data
      file.on('data', function (data) {
        bytesRecieved = bytesRecieved + data.length;
        let newPercentUploaded = Math.round(bytesRecieved * 100 / fileSize);
        console.log(`upload progress: ${percentUploaded}% for uploadId ${uploadId}`);

        // check to make sure socket is still connected
        if (connections[socketId] && connections[socketId].socket) {
          // send progress update
          connections[socketId].socket.emit("uploadProgress", {
            uploadId: uploadId,
            percentUploaded: newPercentUploaded,
          });
          percentUploaded = newPercentUploaded;
        }
        else {
          console.log(`No socket to send upload progress to for socket ${socketId}`);
          req.unpipe();
        }
      });

      file.pipe(fs.createWriteStream(uploadDst));
    });

    busboy.on('finish', function () {
      connections[socketId].socket.emit("uploadComplete", {
        uploadId: uploadId
      });

      // finish was called so upload was success.
      res.writeHead(200, { 'Connection': 'close' });
      res.end();
    });

    return req.pipe(busboy);
  }
});

