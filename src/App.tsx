/**
 * App Component
 * 
 * The main application component that serves as the root of the React application.
 * It renders the header and the FaceRecognition component.
 * 
 * Structure:
 * - Header with application title
 * - Main content area containing the FaceRecognition component
 */

import React from 'react';
import FaceRecognition from './components/FaceRecognition';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Face Recognition App</h1>
      </header>
      <main>
        <FaceRecognition />
      </main>
    </div>
  );
};

export default App; 