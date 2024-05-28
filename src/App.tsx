import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './App.css';
import setting from '@/assets/setting.svg';
import Code from './components/Code';

function App() {
  return (
    <div className="container">
      <h1 className="title">
        Authenticator
        <img src={setting} className="setting" alt="setting" />
      </h1>
      <div>
        <Code />
      </div>
    </div>
  );
}

export default App;
