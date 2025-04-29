import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './AddUserPopup.css';

interface AddUserPopupProps {
  onClose: () => void;
  onUserAdded: () => void;
}

interface UploadState {
  name: string;
  images: File[];
  previews: string[];
  isUploading: boolean;
  error: string | null;
  isCameraActive: boolean;
  capturedImages: string[];
}

const AddUserPopup: React.FC<AddUserPopupProps> = ({ onClose, onUserAdded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<UploadState>({
    name: '',
    images: [],
    previews: [],
    isUploading: false,
    error: null,
    isCameraActive: true,
    capturedImages: []
  });

  useEffect(() => {
    if (state.isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [state.isCameraActive]);

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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || state.capturedImages.length >= 3) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/png');

    // Validate if the captured image contains a face
    const img = await faceapi.fetchImage(imageData);
    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
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
      // Convert captured images to files
      const files = await Promise.all(
        newCapturedImages.map(async (dataUrl: string, index: number) => {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          return new File([blob], `captured-${index + 1}.png`, { type: 'image/png' });
        })
      );
      setState(prev => ({
        ...prev,
        images: files,
        previews: newCapturedImages,
        isCameraActive: true
      }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, name: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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
    }
  };

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

  const saveImagesToLocal = async (files: File[], userName: string) => {
    try {
      const userDir = `labels/${userName}`;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${i + 1}.png`;
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise((resolve) => {
          reader.onload = () => {
            localStorage.setItem(`${userDir}/${fileName}`, reader.result as string);
            resolve(true);
          };
        });
      }

      const userNames = JSON.parse(localStorage.getItem('users') || '[]');
      if (!userNames.includes(userName)) {
        userNames.push(userName);
        localStorage.setItem('users', JSON.stringify(userNames));
      }
    } catch (error) {
      console.error('Error saving images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.images.length !== 3) {
      setState(prev => ({ ...prev, error: 'Please upload exactly 3 images' }));
      return;
    }

    if (!state.name.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a name' }));
      return;
    }

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

          {!state.isCameraActive ? (
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
          ) : (
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
          )}

          {state.previews.length > 0 && (
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
          )}

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