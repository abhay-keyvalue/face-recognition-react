# Face Recognition React Application

A real-time face recognition application built with React and face-api.js. The application uses your webcam to detect and recognize faces in real-time.

## Features

- Real-time face detection and recognition
- Webcam integration
- Face matching against known faces
- Visual feedback with bounding boxes and labels
- Support for multiple face detection
- User management system with face image storage
- Camera-based face capture for user registration

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Webcam access

## Project Structure

```
face-recognition-react/
├── public/
│   └── models/           # Face detection models
├── src/
│   ├── components/
│   │   ├── FaceRecognition/  # Main face recognition component
│   │   ├── AddUserPopup/     # User registration component
│   │   └── UserList/         # User management component
│   ├── App.tsx              # Root component
│   └── ...                  # Other configuration files
```

## Components Documentation

### AddUserPopup Component
The AddUserPopup component provides a user interface for registering new users in the face recognition system. It offers two methods for adding user images:

1. **Camera Capture Mode**:
   - Allows capturing up to 3 face images using the device's camera
   - Validates each captured image to ensure it contains a detectable face
   - Provides real-time preview of captured images

2. **File Upload Mode**:
   - Allows uploading up to 3 face images from the device
   - Validates uploaded images for face detection
   - Provides preview of uploaded images

Key Features:
- Face detection validation using face-api.js
- Local storage for user data and images
- Error handling for invalid images
- User-friendly interface with clear instructions

### UserList Component
The UserList component manages and displays the list of registered users in the system. It provides the following functionality:

1. **User Display**:
   - Lists all registered users with their names
   - Shows user images on demand
   - Handles empty state when no users are registered

2. **User Management**:
   - Delete user functionality with confirmation
   - Updates the list in real-time when users are added or removed
   - Maintains user data in local storage

Key Features:
- Collapsible user cards
- Image preview functionality
- Confirmation dialog for user deletion
- Real-time synchronization with the face recognition system

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Place face detection models in the `public/models` directory:
   - ssdMobilenetv1
   - faceRecognitionNet
   - faceLandmark68Net

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

## How It Works

The application uses face-api.js to:
1. Load pre-trained face detection models
2. Access the user's webcam
3. Detect faces in real-time
4. Match detected faces against known face descriptors
5. Display bounding boxes and labels around recognized faces

The user management system:
1. Stores user data and face images in local storage
2. Validates face images during user registration
3. Provides real-time updates to the face recognition system

## Available Scripts

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

To learn more about the technologies used in this project:

- [React documentation](https://reactjs.org/)
- [face-api.js documentation](https://github.com/justadudewhohacks/face-api.js)
- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
