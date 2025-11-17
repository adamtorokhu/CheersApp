import React, { useRef, useState } from "react";
import { FaCamera, FaTimesCircle } from 'react-icons/fa';

// Circular image uploader with drag-drop and preview
const ImageUpload = ({ onImageUpload, initialPreview = null }) => {
    const [preview, setPreview] = useState(initialPreview);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef();

    // Handle file selection with type validation
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.match(/^image\/(jpeg|png|gif)$/i)) {
                setError('Only JPG, PNG, and GIF images are allowed.');
                e.target.value = null;
                return;
            }

            setError('');
            setPreview(URL.createObjectURL(file));
            if (onImageUpload) {
                onImageUpload({ file, status: 'selected', preview: URL.createObjectURL(file) });
            }
        }
    };

    // Process dropped files
    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    // Clear image and notify parent
    const handleRemove = () => {
        setPreview(null);
        if (onImageUpload) {
            onImageUpload({ file: null, status: 'removed', preview: null });
        }
        fileInputRef.current.value = null;
    };

    return (
        <div className="image-upload-container">
            <div
                className={`image-upload-dropzone${dragActive ? ' drag-active' : ''}`}
                onClick={() => fileInputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                tabIndex={0}
                role="button"
                aria-label="Upload profile image"
                style={{
                    border: dragActive ? '2px solid #FBB117' : '2px dashed #ccc',
                    borderRadius: '50%',
                    width: 120,
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: preview ? '#fff' : '#f8f8f8',
                    cursor: 'pointer',
                    position: 'relative',
                    margin: '0 auto',
                    transition: 'border 0.2s',
                }}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="image-upload-preview"
                            style={{
                                width: 112,
                                height: 112,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #FBB117',
                            }}
                        />
                        <FaTimesCircle
                            onClick={e => { e.stopPropagation(); handleRemove(); }}
                            style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                color: '#dc3545',
                                background: '#fff',
                                borderRadius: '50%',
                                fontSize: 22,
                                cursor: 'pointer',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                            }}
                            title="Remove image"
                            aria-label="Remove image"
                        />
                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: '#aaa' }}>
                        <FaCamera style={{ fontSize: 36, color: '#FBB117', marginBottom: 8 }} />
                        <div style={{ fontSize: 14 }}>Click or drag image here</div>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>
            {error && <p className="error-message" style={{ textAlign: 'center', marginTop: 8 }}>{error}</p>}
        </div>
    );
};

export default ImageUpload;
