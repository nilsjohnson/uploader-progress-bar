import React from 'react';

export default function Upload(props) {
    const { fileName, progress, error } = props;

    return (
        <div className={`upload ${error ? "error" : ""}`}>
            <h5>{fileName}</h5>
            {!error ? <p>{`Progress: ${progress}%`}</p> : <p>{error}</p>}
        </div>
    );
}