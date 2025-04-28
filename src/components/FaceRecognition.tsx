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

import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './FaceRecognition.css';

const FaceRecognition = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Loads the required face detection and recognition models from the server.
   * Initializes the webcam after successful model loading.
   */
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        startWebcam();
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    /**
     * Initializes and starts the webcam stream.
     * Sets up the video element with the webcam feed.
     */
    const startWebcam = () => {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
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
     * Loads and processes labeled face images to create face descriptors.
     * @returns Promise resolving to an array of labeled face descriptors
     */
    const getLabeledFaceDescriptions = async () => {
      const labels = ["Abhay", "Nini"];
      return Promise.all(
        labels.map(async (label) => {
          const descriptions: Float32Array[] = [];
          for (let i = 1; i <= 2; i++) {
            const img = await faceapi.fetchImage(`/labels/${label}/${i}.png`);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            descriptions.push(detections.descriptor);
          }
          return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
      );
    };

    /**
     * Handles the video playback and performs real-time face recognition.
     * Sets up an interval to continuously detect and match faces in the video stream.
     */
    const handleVideoPlay = async () => {
      const labeledFaceDescriptors = await getLabeledFaceDescriptions();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
      console.log('faceMatcher', faceMatcher);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
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
    <div className="face-recognition-container">
      <video
        ref={videoRef}
        width="600"
        height="450"
        autoPlay
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="face-recognition-canvas" />
    </div>
  );
};

export default FaceRecognition; 