const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'recording-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// File-based storage for recordings metadata
const metadataFilePath = path.join(__dirname, 'recordings-metadata.json');

// Initialize metadata storage
function initializeStorage() {
  try {
    // Check if metadata file exists, if not create it
    if (!fs.existsSync(metadataFilePath)) {
      fs.writeFileSync(metadataFilePath, JSON.stringify({ recordings: [] }));
      console.log('Created recordings metadata file');
    } else {
      console.log('Recordings metadata file exists');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Helper functions for file-based storage
function getRecordings() {
  try {
    const data = fs.readFileSync(metadataFilePath, 'utf8');
    return JSON.parse(data).recordings;
  } catch (error) {
    console.error('Error reading recordings metadata:', error);
    return [];
  }
}

function saveRecordings(recordings) {
  try {
    fs.writeFileSync(metadataFilePath, JSON.stringify({ recordings }, null, 2));
  } catch (error) {
    console.error('Error saving recordings metadata:', error);
  }
}

function addRecording(recording) {
  const recordings = getRecordings();
  const newRecording = {
    id: Date.now().toString(),
    ...recording,
    created_at: new Date().toISOString()
  };
  recordings.push(newRecording);
  saveRecordings(recordings);
  return newRecording;
}

function getRecordingById(id) {
  const recordings = getRecordings();
  return recordings.find(recording => recording.id === id);
}

function deleteRecording(id) {
  const recordings = getRecordings();
  const updatedRecordings = recordings.filter(recording => recording.id !== id);
  saveRecordings(updatedRecordings);
  return updatedRecordings.length < recordings.length;
}

// API Endpoints

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Screen Recorder API is running',
    endpoints: [
      { method: 'POST', path: '/api/recordings', description: 'Upload a recording' },
      { method: 'GET', path: '/api/recordings', description: 'Get all recordings' },
      { method: 'GET', path: '/api/recordings/:id', description: 'Stream a specific recording' },
      { method: 'DELETE', path: '/api/recordings/:id', description: 'Delete a recording' }
    ]
  });
});

// POST /api/recordings - Upload a recording
app.post('/api/recordings', upload.single('recording'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { filename, originalname, size, path: filepath } = req.file;
    
    // Add recording info to storage
    const newRecording = addRecording({
      filename,
      originalname,
      size,
      filepath
    });
    
    res.status(201).json({
      ...newRecording,
      url: `/api/recordings/${newRecording.id}`
    });
  } catch (error) {
    console.error('Error uploading recording:', error);
    res.status(500).json({ error: 'Failed to upload recording' });
  }
});

// GET /api/recordings - Get all recordings
app.get('/api/recordings', (req, res) => {
  try {
    const recordings = getRecordings();
    // Sort by created_at in descending order
    recordings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const formattedRecordings = recordings.map(recording => ({
      id: recording.id,
      filename: recording.filename,
      originalname: recording.originalname,
      size: recording.size,
      url: `/api/recordings/${recording.id}`,
      created_at: recording.created_at
    }));
    
    res.json(formattedRecordings);
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// GET /api/recordings/:id - Get a specific recording
app.get('/api/recordings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recording = getRecordingById(id);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    // Stream the file
    const filePath = recording.filepath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Recording file not found' });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming recording:', error);
    res.status(500).json({ error: 'Failed to stream recording' });
  }
});

// DELETE /api/recordings/:id - Delete a recording
app.delete('/api/recordings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recording = getRecordingById(id);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(recording.filepath)) {
      fs.unlinkSync(recording.filepath);
    }
    
    // Delete from metadata storage
    const deleted = deleteRecording(id);
    
    if (deleted) {
      res.json({ message: 'Recording deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete recording metadata' });
    }
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeStorage();
});