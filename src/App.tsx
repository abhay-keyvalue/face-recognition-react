/**
 * App Component
 *
 * The main application component that serves as the root of the React application.
 * It renders the header and the FaceRecognition component.
 *
 * Structure:
 * - Header with application title
 * - Main content area containing the FaceRecognition component
 * - User upload section for adding new users
 */

import React, { useState } from "react";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import "./App.css";
import AddUserPopup from "./components/AddUserPopup/AddUserPopup";
import UserList from "./components/UserList/UserList";

const App: React.FC = () => {
  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [userListKey, setUserListKey] = useState(0);
  const [faceRecognitionKey, setFaceRecognitionKey] = useState(0);

  const handleUserAdded = () => {
    setShowAddUserPopup(false);
    setUserListKey(prev => prev + 1);
    setFaceRecognitionKey(prev => prev + 1); // Force FaceRecognition to remount
  };

  const handleUserDeleted = () => {
    setUserListKey(prev => prev + 1);
    setFaceRecognitionKey(prev => prev + 1); // Force FaceRecognition to remount
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Face Recognition App</h1>
      </header>
      <div className="main-content">
        <FaceRecognition key={faceRecognitionKey} />
        <div className="user-management-section">
          <button
            className="add-user-button"
            onClick={() => setShowAddUserPopup(true)}
          >
            Add New User
          </button>

          {showAddUserPopup && (
            <AddUserPopup
              onClose={() => setShowAddUserPopup(false)}
              onUserAdded={handleUserAdded}
            />
          )}

          <UserList key={userListKey} onUserDeleted={handleUserDeleted} />
        </div>
      </div>
    </div>
  );
};

export default App;
