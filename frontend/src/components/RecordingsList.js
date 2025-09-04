import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecordingsList.css';

const RecordingsList = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      console.log('Fetching recordings from backend...');
      const response = await axios.get('http://localhost:5000/api/recordings', {
        timeout: 10000 // 10 second timeout
      });
      console.log('Recordings fetched:', response.data);
      setRecordings(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      let errorMessage = 'Failed to load recordings. ';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage += `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage += 'No response from server. Please check if the backend server is running.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePlay = (id) => {
    setCurrentPlaying(id === currentPlaying ? null : id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        await axios.delete(`http://localhost:5000/api/recordings/${id}`);
        fetchRecordings();
      } catch (error) {
        console.error('Error deleting recording:', error);
        alert('Failed to delete recording. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading recordings...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (recordings.length === 0) {
    return (
      <div className="no-recordings">
        <h2>No Recordings Found</h2>
        <p>Start recording your screen to see recordings here.</p>
      </div>
    );
  }

  return (
    <div className="recordings-list">
      <h2>Your Recordings</h2>
      <button className="refresh-button" onClick={fetchRecordings}>Refresh List</button>
      
      <div className="recordings-grid">
        {recordings.map((recording) => (
          <div key={recording.id} className="recording-card">
            <div className="recording-info">
              <h3>{recording.originalname || `Recording ${recording.id}`}</h3>
              <p className="recording-meta">
                <span>Size: {formatFileSize(recording.size)}</span>
                <span>Date: {formatDate(recording.created_at)}</span>
              </p>
            </div>
            
            <div className="recording-actions">
              <button 
                className="play-button" 
                onClick={() => handlePlay(recording.id)}
              >
                {currentPlaying === recording.id ? 'Hide Player' : 'Play'}
              </button>
              <button 
                className="delete-button" 
                onClick={() => handleDelete(recording.id)}
              >
                Delete
              </button>
            </div>
            
            {currentPlaying === recording.id && (
              <div className="video-player">
                <video 
                  controls 
                  autoPlay 
                  src={`http://localhost:5000${recording.url}`} 
                  width="100%"
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    alert('Error playing video. The file may be corrupted or no longer exists.');
                    setCurrentPlaying(null);
                  }}
                />
                <div className="video-info">
                  <p>If video doesn't play, try downloading it directly from the server.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordingsList;