function uploadFile(socketId, tmpId, data = {}) {
    return fetch(`/upload/${socketId}/${tmpId}`, {
        method: 'POST',
        body: data
    });
}

export { uploadFile }