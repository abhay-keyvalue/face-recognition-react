/**
 * FaceRecognition Component
 * 
 * A React component that implements real-time face recognition using face-api.js.
 * It captures video from the user's webcam, detects faces, and matches them against
 * pre-loaded labeled face descriptors.
 * 
 * Features:
 * - Real-time face detection and recognition
 * - Webcam integration
 * - Face matching against known faces
 * - Visual feedback with bounding boxes and labels
 */

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './FaceRecognition.css';

const FaceRecognition = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Loads the required face detection and recognition models from the server.
   * Initializes the webcam after successful model loading.
   */
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        startWebcam();
      } catch (error) {
        console.error("Error loading models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    /**
     * Initializes and starts the webcam stream.
     * Sets up the video element with the webcam feed.
     */
    const startWebcam = () => {
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error("Error accessing webcam:", error);
        });
    };

    /**
     * Loads and processes labeled face images from localStorage
     * @returns Promise resolving to an array of labeled face descriptors
     */
    const getLabeledFaceDescriptions = async () => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      const labeledDescriptors = await Promise.all(
        users.map(async (label: string) => {
          const descriptions: Float32Array[] = [];
          for (let i = 1; i <= 3; i++) {
            const imageData = localStorage.getItem(`labels/${label}/${i}.png`);
            if (!imageData) continue;

            const img = await faceapi.fetchImage(imageData);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (detections) {
              descriptions.push(detections.descriptor);
            }
          }
          return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
      );

      return labeledDescriptors.filter(descriptor => descriptor.descriptors.length > 0);
    };

    /**
     * Handles the video playback and performs real-time face recognition.
     * Sets up an interval to continuously detect and match faces in the video stream.
     */
    const handleVideoPlay = async () => {
      const labeledFaceDescriptors = await getLabeledFaceDescriptions();
      
      if (labeledFaceDescriptors.length === 0) {
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const container = containerRef.current;
      
      if (!canvas || !video || !container) return;

      // Set canvas dimensions to match video dimensions
      const displaySize = { 
        width: video.videoWidth || 640, 
        height: video.videoHeight || 480 
      };
      
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        if (!video.videoWidth || !video.videoHeight) return;

        const detections = await faceapi
          .detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const context = canvas.getContext("2d");
        if (!context) return;
        
        context.clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((d: faceapi.IFaceDescriptor) => {
          return faceMatcher.findBestMatch(d.descriptor);
        });

        results.forEach((result: faceapi.IFaceMatch, i: number) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result,
          });
          drawBox.draw(canvas);
        });
      }, 100);
    };

    loadModels();
    if (videoRef.current) {
      videoRef.current.addEventListener("play", handleVideoPlay);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("play", handleVideoPlay);
      }
    };
  }, []);

  return (
    <div className="face-recognition-wrapper">
      <div className="face-recognition-container" ref={containerRef}>
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading face recognition models...</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="face-recognition-canvas" />
      </div>
    </div>
  );
};

export default FaceRecognition; 