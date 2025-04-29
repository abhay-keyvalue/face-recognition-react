/**
 * AddUserPopup Component
 * 
 * This component provides a modal interface for registering new users in the face recognition system.
 * It supports two methods of adding user images: camera capture and file upload.
 * 
 * @component
 * @param {Function} onClose - Callback function to close the popup
 * @param {Function} onUserAdded - Callback function triggered when a new user is successfully added
 */

import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './AddUserPopup.css';

// Interface defining the props for the AddUserPopup component
interface AddUserPopupProps {
  onClose: () => void;
  onUserAdded: () => void;
}

// Interface defining the state structure for the AddUserPopup component
interface UploadState {
  name: string;              // User's name
  images: File[];           // Array of uploaded/captured image files
  previews: string[];       // Array of image preview URLs
  isUploading: boolean;     // Flag to track upload status
  error: string | null;     // Error message if any
  isCameraActive: boolean;  // Flag to track camera mode
  capturedImages: string[]; // Array of base64 encoded captured images
}

const AddUserPopup: React.FC<AddUserPopupProps> = ({ onClose, onUserAdded }) => {
  // Reference to the video element for camera access
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize component state
  const [state, setState] = useState<UploadState>({
    name: '',
    images: [],
    previews: [],
    isUploading: false,
    error: null,
    isCameraActive: true,
    capturedImages: []
  });

  // Effect hook to handle camera activation/deactivation
  useEffect(() => {
    if (state.isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [state.isCameraActive]);

  /**
   * Starts the camera stream and sets it to the video element
   * @async
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to access camera' }));
    }
  };

  /**
   * Stops the camera stream and cleans up resources
   */
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Captures a frame from the video element
   * @returns {string} Base64 encoded image data
   */
  const captureVideoFrame = (): string => {
    if (!videoRef.current) return '';
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/png');
  };

  /**
   * Validates if an image contains a detectable face
   * @param {string} imageData - Base64 encoded image data
   * @returns {Promise<boolean>} True if a face is detected
   */
  const validateFaceDetection = async (imageData: string): Promise<boolean> => {
    const img = await faceapi.fetchImage(imageData);
    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return !!detections;
  };

  /**
   * Converts base64 image data to a File object
   * @param {string} dataUrl - Base64 encoded image data
   * @param {number} index - Index of the image
   * @returns {Promise<File>} File object
   */
  const convertToFile = async (dataUrl: string, index: number): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], `captured-${index + 1}.png`, { type: 'image/png' });
  };

  /**
   * Captures an image from the camera and validates it
   * @async
   */
  const captureImage = async () => {
    if (!videoRef.current || state.capturedImages.length >= 3) return;

    const imageData = captureVideoFrame();
    if (!imageData) return;

    const hasFace = await validateFaceDetection(imageData);
    if (!hasFace) {
      setState(prev => ({ ...prev, error: 'No face detected in the captured image' }));
      return;
    }

    const newCapturedImages = [...state.capturedImages, imageData];
    setState(prev => ({
      ...prev,
      capturedImages: newCapturedImages,
      error: null
    }));

    if (newCapturedImages.length === 3) {
      const files = await Promise.all(
        newCapturedImages.map(convertToFile)
      );
      setState(prev => ({
        ...prev,
        images: files,
        previews: newCapturedImages,
        isCameraActive: true
      }));
    }
  };

  /**
   * Handles name input changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, name: e.target.value }));
  };

  /**
   * Handles file input changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setState(prev => ({ ...prev, error: 'Please select only 3 images' }));
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setState(prev => ({
      ...prev,
      images: files,
      previews,
      error: null
    }));
  };

  /**
   * Validates all uploaded images
   * @param {File[]} files - Array of image files
   * @returns {Promise<boolean>} True if all images are valid
   */
  const validateImages = async (files: File[]): Promise<boolean> => {
    for (const file of files) {
      const img = await faceapi.fetchImage(URL.createObjectURL(file));
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detections) {
        return false;
      }
    }
    return true;
  };

  /**
   * Saves a single image to local storage
   * @param {File} file - Image file to save
   * @param {string} userDir - User directory path
   * @param {number} index - Image index
   */
  const saveImageToLocal = async (file: File, userDir: string, index: number): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(`${userDir}/${index + 1}.png`, reader.result as string);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Saves all user images to local storage
   * @param {File[]} files - Array of image files
   * @param {string} userName - Name of the user
   */
  const saveImagesToLocal = async (files: File[], userName: string): Promise<void> => {
    const userDir = `labels/${userName}`;
    
    await Promise.all(
      files.map((file, index) => saveImageToLocal(file, userDir, index))
    );

    const userNames = JSON.parse(localStorage.getItem('users') || '[]');
    if (!userNames.includes(userName)) {
      userNames.push(userName);
      localStorage.setItem('users', JSON.stringify(userNames));
    }
  };

  /**
   * Validates form input
   * @returns {boolean} True if input is valid
   */
  const validateInput = (): boolean => {
    if (state.images.length !== 3) {
      setState(prev => ({ ...prev, error: 'Please upload exactly 3 images' }));
      return false;
    }

    if (!state.name.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a name' }));
      return false;
    }

    return true;
  };

  /**
   * Handles form submission
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInput()) return;

    setState(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      const isValid = await validateImages(state.images);
      if (!isValid) {
        setState(prev => ({ ...prev, error: 'One or more images do not contain a detectable face' }));
        return;
      }

      await saveImagesToLocal(state.images, state.name);

      setState({
        name: '',
        images: [],
        previews: [],
        isUploading: false,
        error: null,
        isCameraActive: true,
        capturedImages: []
      });

      onUserAdded();
      onClose();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    }
  };

  /**
   * Renders the camera view
   * @returns {JSX.Element} Camera view component
   */
  const renderCameraView = () => (
    <div className="camera-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-view"
      />
      <div className="camera-controls">
        <button
          type="button"
          className="capture-button"
          onClick={captureImage}
          disabled={state.capturedImages.length >= 3}
        >
          Capture Image ({state.capturedImages.length}/3)
        </button>
      </div>
    </div>
  );

  /**
   * Renders the file upload view
   * @returns {JSX.Element} File upload component
   */
  const renderFileUpload = () => (
    <div className="form-group">
      <label htmlFor="images">Upload 3 Face Images:</label>
      <input
        type="file"
        id="images"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        required
      />
      <p className="help-text">Please upload exactly 3 clear face images</p>
    </div>
  );

  /**
   * Renders image previews
   * @returns {JSX.Element} Image previews component
   */
  const renderImagePreviews = () => (
    <div className="image-previews">
      {state.previews.map((preview, index) => (
        <img
          key={index}
          src={preview}
          alt={`Preview ${index + 1}`}
          className="preview-image"
        />
      ))}
    </div>
  );

  // Render the component
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h2>Add New User</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={state.name}
              onChange={handleNameChange}
              placeholder="Enter user's name"
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Method:</label>
            <div className="upload-methods">
              <button
                type="button"
                className={`upload-method-button ${state.isCameraActive ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, isCameraActive: true }))}
              >
                Scan Face
              </button>
              <button
                type="button"
                className={`upload-method-button ${!state.isCameraActive ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, isCameraActive: false }))}
              >
                Upload Files
              </button>
            </div>
          </div>

          {state.isCameraActive ? renderCameraView() : renderFileUpload()}
          {state.previews.length > 0 && renderImagePreviews()}
          {state.error && <div className="error-message">{state.error}</div>}

          <button
            type="submit"
            disabled={state.isUploading}
            className="submit-button"
          >
            {state.isUploading ? 'Uploading...' : 'Upload User'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserPopup; 