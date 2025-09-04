import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Recorder.css';

const Recorder = () => {
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [timer, setTimer] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  
  // Maximum recording time in seconds (3 minutes)
  const MAX_RECORDING_TIME = 180;
  
  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      // Request screen capture with audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      
      // Get microphone audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      // Combine the streams
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      streamRef.current = combinedStream;
      
      // Display the stream in the video element
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        videoRef.current.muted = true; // Mute to prevent feedback
      }
      
      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreview(url);
        setRecordedBlob(blob);
        
        // Clean up streams
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      
      // Start timer
      setTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prevTimer + 1;
        });
      }, 1000);
      
      setRecording(true);
      
      // Add event listener for when user stops sharing screen
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please make sure you have granted the necessary permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };
  
  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  const uploadRecording = async () => {
    if (!recordedBlob) return;
    
    setUploading(true);
    setUploadStatus(null);
    
    try {
      const formData = new FormData();
      // The parameter name 'recording' must match what the backend expects
      formData.append('recording', recordedBlob, `screen-recording-${new Date().toISOString()}.webm`);
      
      console.log('Attempting to upload recording to backend...');
      console.log('FormData contents:', formData.get('recording'));
      
      const response = await axios.post('http://localhost:5000/api/recordings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Upload response:', response.data);
      setUploadStatus({ success: true, message: 'Recording uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading recording:', error);
      let errorMessage = 'Failed to upload recording. ';
      
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
      
      setUploadStatus({ success: false, message: errorMessage });
    } finally {
      setUploading(false);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const resetRecording = () => {
    setPreview(null);
    setRecordedBlob(null);
    setUploadStatus(null);
  };
  
  return (
    <div className="recorder-container">
      <div className="video-container">
        {!preview ? (
          <div className="live-video-container">
            <video ref={videoRef} autoPlay playsInline className="video-preview" />
            {recording && (
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                <span className="recording-time">{formatTime(timer)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="recorded-video-container">
            <video 
              ref={previewRef} 
              src={preview} 
              controls 
              className="video-preview" 
              onLoadedMetadata={() => {
                if (previewRef.current) {
                  previewRef.current.play();
                }
              }}
            />
          </div>
        )}
      </div>
      
      <div className="controls">
        {!preview ? (
          <div className="recording-controls">
            {!recording ? (
              <button 
                className="start-button" 
                onClick={startRecording}
              >
                Start Recording
              </button>
            ) : (
              <button 
                className="stop-button" 
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            )}
            {recording && (
              <div className="timer-display">
                Recording: {formatTime(timer)}
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${(timer / MAX_RECORDING_TIME) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="playback-controls">
            <button 
              className="download-button" 
              onClick={downloadRecording}
            >
              Download
            </button>
            <button 
              className="upload-button" 
              onClick={uploadRecording}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button 
              className="reset-button" 
              onClick={resetRecording}
            >
              Record Again
            </button>
          </div>
        )}
      </div>
      
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
          {uploadStatus.message}
        </div>
      )}
      
      <div className="instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Click "Start Recording" to begin capturing your screen and microphone.</li>
          <li>Select the tab or window you want to record when prompted.</li>
          <li>Recording will automatically stop after 3 minutes.</li>
          <li>Click "Stop Recording" to end the recording early.</li>
          <li>After recording, you can preview, download, or upload your recording.</li>
        </ul>
      </div>
    </div>
  );
};

export default Recorder;