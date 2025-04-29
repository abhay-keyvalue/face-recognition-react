/**
 * UserList Component
 * 
 * This component displays and manages the list of registered users in the face recognition system.
 * It provides functionality to view user images and delete users.
 * 
 * @component
 * @param {Function} onUserDeleted - Callback function triggered when a user is deleted
 */

import React, { useState, useEffect } from 'react';
import './UserList.css';

// Interface defining the structure of a user
interface User {
  name: string;      // User's name
  images: string[];  // Array of base64 encoded user images
}

// Interface defining the props for the UserList component
interface UserListProps {
  onUserDeleted: () => void;
}

const UserList: React.FC<UserListProps> = ({ onUserDeleted }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Loads a single user's images from local storage
   * @param {string} name - Name of the user
   * @returns {User} User object with name and images
   */
  const loadUserImages = (name: string): User => {
    const images = [];
    for (let i = 1; i <= 3; i++) {
      const imageData = localStorage.getItem(`labels/${name}/${i}.png`);
      if (imageData) {
        images.push(imageData);
      }
    }
    return { name, images };
  };

  /**
   * Loads all users from local storage
   */
  const loadUsers = () => {
    const userNames = JSON.parse(localStorage.getItem('users') || '[]');
    const loadedUsers = userNames.map(loadUserImages);
    setUsers(loadedUsers);
  };

  /**
   * Removes user images from local storage
   * @param {string} userName - Name of the user
   */
  const removeUserImages = (userName: string) => {
    for (let i = 1; i <= 3; i++) {
      localStorage.removeItem(`labels/${userName}/${i}.png`);
    }
  };

  /**
   * Updates the user list in local storage
   * @param {string} userName - Name of the user to remove
   */
  const updateUserList = (userName: string) => {
    const userNames = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = userNames.filter((name: string) => name !== userName);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  /**
   * Handles user selection/deselection
   * @param {User} user - The user to select/deselect
   */
  const handleUserSelection = (user: User) => {
    setSelectedUser(selectedUser?.name === user.name ? null : user);
  };

  /**
   * Deletes a user and their associated images
   * @param {string} userName - Name of the user to delete
   */
  const deleteUser = (userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    removeUserImages(userName);
    updateUserList(userName);
    loadUsers();

    if (selectedUser?.name === userName) {
      setSelectedUser(null);
    }
    onUserDeleted();
  };

  /**
   * Renders a single user card
   * @param {User} user - The user to render
   * @returns {JSX.Element} User card component
   */
  const renderUserCard = (user: User) => (
    <div key={user.name} className="user-card">
      <div className="user-header">
        <h4>{user.name}</h4>
        <div className="user-actions">
          <button
            onClick={() => handleUserSelection(user)}
            className="view-button"
          >
            {selectedUser?.name === user.name ? 'Hide' : 'Images'}
          </button>
          <button
            onClick={() => deleteUser(user.name)}
            className="delete-button"
          >
            Delete
          </button>
        </div>
      </div>
      {selectedUser?.name === user.name && (
        <div className="user-images">
          {user.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${user.name} ${index + 1}`}
              className="user-image"
            />
          ))}
        </div>
      )}
    </div>
  );

  /**
   * Renders the list of users
   * @returns {JSX.Element} Users list component
   */
  const renderUsersList = () => (
    <div className="users-list">
      {users.map(renderUserCard)}
    </div>
  );

  return (
    <div className="existing-users">
      <h3>Existing Users</h3>
      {users.length === 0 ? (
        <p className="no-users">No users added yet</p>
      ) : (
        renderUsersList()
      )}
    </div>
  );
};

export default UserList; 