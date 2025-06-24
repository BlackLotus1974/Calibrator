// src/components/MethodologyUpload.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Check, AlertCircle, Loader, FileText, X } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000'; // Full Backend URL

const MethodologyUpload = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentMethodology, setCurrentMethodology] = useState(null);

  // Ref to track if component is mounted to prevent setting state after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch the current methodology when the component mounts
  useEffect(() => {
    checkCurrentMethodology();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to check the currently uploaded methodology
  const checkCurrentMethodology = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/methodology/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (isMounted.current) {
          setCurrentMethodology(data.methodology);
        }
      } else {
        if (isMounted.current) {
          setCurrentMethodology(null);
        }
      }
    } catch (error) {
      console.error('Error checking methodology:', error);
      if (isMounted.current) {
        setError('Failed to fetch current methodology.');
      }
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a DOCX file.');
        setFile(null);
      }
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('methodology', file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/methodology/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload methodology.');
      }

      const data = await response.json();
      if (isMounted.current) {
        setSuccess(data.message || 'Methodology uploaded successfully.');
        setFile(null);
        checkCurrentMethodology(); // Refresh current methodology
      }
    } catch (err) {
      console.error('Upload Error:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Handle removing the selected file before upload
  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  // Handle drag events for the dropzone
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // Handle multiple file validations
  const handleFiles = (selectedFiles) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validType = selectedFiles.every(
      (file) =>
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
    );
    const validSize = selectedFiles.every((file) => file.size <= maxSize);

    if (!validType) {
      setError('Only DOCX files are allowed.');
      return;
    }

    if (!validSize) {
      setError('Each file must be smaller than 5MB.');
      return;
    }

    setFile(selectedFiles[0]); // Assuming only one file is allowed
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Methodology Management</h1>

      {/* Current Methodology Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-gray-700 mb-2">Current Methodology</h2>
        {currentMethodology ? (
          <div className="flex items-center text-green-600">
            <Check className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">{currentMethodology.name}</p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(currentMethodology.uploadDate).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center text-yellow-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>No permanent methodology currently set</span>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 mb-4 ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            Select Methodology File
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".docx"
            />
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Upload a DOCX file containing the methodology (Max 5MB)
          </p>
        </div>

        {/* Display selected file */}
        {file && (
          <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-gray-700">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Success and Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`w-full ${
          !file || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        } text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin h-5 w-5 mr-2" />
            Uploading...
          </>
        ) : (
          'Upload Methodology'
        )}
      </button>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload a DOCX file containing your custom methodology.</li>
          <li>• The file will replace any existing methodology.</li>
          <li>• Maximum file size: 5MB.</li>
          <li>• This methodology will be used for all strategy analyses.</li>
        </ul>
      </div>
    </div>
  );
};

export default MethodologyUpload;
