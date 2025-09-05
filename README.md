# Screen Recorder Web Application

A web application that allows users to record their screen with microphone audio, preview the recording, download it, and upload it to a backend server. The application is built using the MERN stack (MySQL, Express, React, Node.js).

## frontend: (https://7pm3qw6h-3000.inc1.devtunnels.ms/)
## backend: (https://7pm3qw6h-5000.inc1.devtunnels.ms/)

## Features

- **Screen Recording**: Record your active browser tab with microphone audio
- **Timer**: Live recording timer with a 3-minute limit
- **Preview**: Watch your recording before downloading or uploading
- **Download**: Save recordings to your local device
- **Upload**: Store recordings on the server
- **Recordings List**: View, play, and manage your uploaded recordings

## Tech Stack

### Frontend
- React.js
- MediaRecorder API for screen capture
- Axios for API requests

### Backend
- Node.js
- Express.js
- MySQL database
- Multer for file uploads

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL server
- Chrome browser (required for screen recording functionality)

### Database Setup

1. Create a MySQL database named `screen_recordings`
2. The application will automatically create the necessary tables on startup

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content (adjust as needed):
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=screen_recordings
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000` 

## Usage

1. Click the "Start Recording" button
2. Select the tab or window you want to record when prompted
3. Allow microphone access when prompted
4. Record your content (max 3 minutes)
5. Click "Stop Recording" when finished
6. Preview your recording
7. Download or upload your recording
8. View your uploaded recordings in the "Recordings" tab

## Known Limitations

1. **Browser Compatibility**: Screen recording functionality requires Chrome browser
2. **Recording Length**: Maximum recording time is limited to 3 minutes
3. **File Format**: Recordings are saved in WebM format
4. **Audio Source**: Only microphone audio is captured, not system audio
5. **Storage**: Large recordings may take time to upload depending on your internet connection

## Project Structure

```
├── backend/                # Backend server code
│   ├── index.js           # Express server and API endpoints
│   ├── uploads/           # Directory for uploaded recordings
│   └── package.json       # Backend dependencies
│
├── frontend/              # React frontend code
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   │   ├── Recorder.js       # Screen recording component
│   │   │   └── RecordingsList.js # Recordings list component
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point
│   └── package.json       # Frontend dependencies
│
└── README.md              # Project documentation
```
