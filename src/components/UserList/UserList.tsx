import React, { useState, useEffect } from 'react';
import './UserList.css';

interface User {
  name: string;
  images: string[];
}

interface UserListProps {
  onUserDeleted: () => void;
}

const UserList: React.FC<UserListProps> = ({ onUserDeleted }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const userNames = JSON.parse(localStorage.getItem('users') || '[]');
    const loadedUsers = userNames.map((name: string) => {
      const images = [];
      for (let i = 1; i <= 3; i++) {
        const imageData = localStorage.getItem(`labels/${name}/${i}.png`);
        if (imageData) {
          images.push(imageData);
        }
      }
      return { name, images };
    });
    setUsers(loadedUsers);
  };

  const deleteUser = (userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      for (let i = 1; i <= 3; i++) {
        localStorage.removeItem(`labels/${userName}/${i}.png`);
      }

      const userNames = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = userNames.filter((name: string) => name !== userName);
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      loadUsers();
      if (selectedUser?.name === userName) {
        setSelectedUser(null);
      }
      onUserDeleted();
    }
  };

  return (
    <div className="existing-users">
      <h3>Existing Users</h3>
      {users.length === 0 ? (
        <p className="no-users">No users added yet</p>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user.name} className="user-card">
              <div className="user-header">
                <h4>{user.name}</h4>
                <div className="user-actions">
                  <button
                    onClick={() => setSelectedUser(selectedUser?.name === user.name ? null : user)}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList; 