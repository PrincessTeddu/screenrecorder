import { useState } from 'react';
import './App.css';
import Recorder from './components/Recorder';
import RecordingsList from './components/RecordingsList';

function App() {
  const [activeTab, setActiveTab] = useState('record');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Screen Recorder</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'record' ? 'active' : ''}
            onClick={() => setActiveTab('record')}
          >
            Record
          </button>
          <button 
            className={activeTab === 'recordings' ? 'active' : ''}
            onClick={() => setActiveTab('recordings')}
          >
            Recordings
          </button>
        </div>
      </header>
      <main>
        {activeTab === 'record' ? <Recorder /> : <RecordingsList />}
      </main>
    </div>
  );
}

export default App;
