import React, { Component } from 'react';
import Upload from '../Upload';
import io from "socket.io-client";
import { uploadFile } from '../../data';

export default class Uploader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            uploads: [],
            filesHovering: false
        };

        // this is a reference to the 'Choose Files' input
        this.fileSelectInput = React.createRef();
        // this is to hold the files upon drag/drop or select
        this.unprocessedFiles = [];
        // this is to prevent race conditons when updating the state
        this.uploads = [];
        // the socket for receiving upload progress
        this.socket = null;
        // for iterating though the uploads
        this.curFileNum = 0;
        // for assigning temporary file ids
        this.numFilesChosen = 0;
        // a flag meaning that uploading is in progress
        this.isUploading = false;
    }

    // a recursive function that iterates through each file and uploads it.
    upload = () => {
        // Our base case. When we complete the last file, we return.
        if (this.curFileNum >= this.uploads.length) {
            this.isUploading = false;
            return;
        }

        this.isUploading = true;

        let upload = this.uploads[this.curFileNum];
        let formData = new FormData();
        formData.append("file", upload.file);

        // upload the file
        return uploadFile(this.socket.id, upload.uploadId, formData).then(res => {
            if (res.ok) {
                console.log(`Response from server for file ${upload.file.name} ok!`);
                // continue to the next file
                this.curFileNum++;
                this.upload();
            }
            else {
                res.json().then(resJson => {
                    console.log(`Response from server for file ${upload.file.name} not ok.`);
                    console.log(resJson);

                    // mark this upload as having an error
                    this.updateUploads(upload.uploadId, {
                        error: resJson.error
                    });

                    // continue to the next file
                    this.curFileNum++;
                    this.upload();
                }).catch(err => console.log(`json err: ${err}`));
            }
        }).catch(err => {
            console.log(err);
        });
    }

    // creates a new socket and defines event handler callbacks.
    createSocket = () => {
        console.log("creating socket.");
        
        this.socket = io('http://localhost:3001/');

        this.socket.on("connect", () => {
            console.log(`Socket ${this.socket.id} connected`);
            this.upload();
        });

        this.socket.on("uploadProgress", data => {
            console.log("upload progress");
            console.log(data);
            const { uploadId, percentUploaded } = data;

            this.updateUploads(uploadId, {
                percentUploaded: percentUploaded
            });
        });

        this.socket.on("uploadComplete", (data) => {
            console.log("Upload complete");
            const { uploadId } = data;

            this.updateUploads(uploadId, {
                percentUploaded: 100
            })
        });

        this.socket.on("uploadStart", data => {
            console.log("upload start");
            console.log(data);
            const { uploadId, tempUploadId } = data;

            this.updateUploads(tempUploadId, {
                uploadId: uploadId
            });
        });

    }

    // a helper function to update the uploads
    // object and set the state 
    updateUploads = (uploadId, obj) => {
        let keys = Object.keys(obj);

        for (let i = 0; i < this.uploads.length; i++) {
            if (this.uploads[i].uploadId === uploadId) {
                for (let j = 0; j < keys.length; j++) {
                    this.uploads[i][keys[j]] = obj[keys[j]];
                }
            }
        }

        this.setState({ uploads: this.uploads });
    }

    // Processes files after they are chosen and prepares them for upload
    initUpload = () => {
        for (let i = 0; i < this.unprocessedFiles.length; i++) {
            let file = this.unprocessedFiles[i];
            let upload = {
                percentUploaded: 0,
                file: file,
                uploadId: `tmp_id_${this.numFilesChosen}`,
                error: ""
            }

            this.numFilesChosen++;
            this.uploads.push(upload);
        }

        this.unprocessedFiles = [];

        this.setState({
            uploads: this.uploads
        });

        // this is true if no uploads have happened yet
        if (this.socket === null) {
            this.createSocket();
        }
        // this is true if uploads have completed and 
        // the user wishes to upload more.
        else if (this.socket.connected && !this.isUploading) {
            this.upload();
        }
        // this means the socket is in the process of connecting.
        else {
            // don't need to do anything because these uploads will
            // be uploaded in the initial upload call.
        }
    }

    // to handle when a user selects files
    // through the file explorer
    selectFiles = () => {
        let files = this.fileSelectInput.current.files;

        for (let i = 0; i < files.length; i++) {
            this.unprocessedFiles.push(files[i]);
        }

        this.initUpload();
    }

    // to handle when a user drops files
    onDropHandler = (event) => {
        event.preventDefault();
        this.setFilesHovering(false);

        // How files are added depends on the user's browser
        if (event.dataTransfer.items) {
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
                if (event.dataTransfer.items[i].kind === 'file') {
                    let file = event.dataTransfer.items[i].getAsFile();
                    this.unprocessedFiles.push(file);
                }
            }
        }
        else {
            for (let j = 0; j < event.dataTransfer.files.length; j++) {
                this.unprocessedFiles.push(event.dataTransfer.files[j]);
            }
        }

        this.initUpload();
    }

    onDragLeaveHandler = () => {
        this.setFilesHovering(false);
    }

    onDragOverHandler = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        this.setFilesHovering(true);
    }

    setFilesHovering = (val) => {
        this.setState({
            filesHovering: val
        });
    }

    render() {
        return (
            <div className={`dropBox ${this.state.filesHovering ? 'filesHovering' : ''}`}
                onDragOver={this.onDragOverHandler}
                onDragLeave={this.onDragLeaveHandler}
                onDrop={this.onDropHandler}
            >
                <div className="uploader">
                    <p>Hello, Welcome! Please drag and drop or select some files.</p>
                    <input
                        ref={this.fileSelectInput}
                        type="file"
                        accept={this.allowedMimeTypes}
                        multiple
                        onChange={this.selectFiles}
                    />
                </div>
                <div className="uploadContainer">
                    {this.state.uploads.map(upload => (
                        <Upload
                            key={upload.uploadId}
                            fileName={upload.file.name}
                            progress={upload.percentUploaded}
                            error={upload.error}
                        />
                    ))}
                </div>
            </div>
        );
    }
}