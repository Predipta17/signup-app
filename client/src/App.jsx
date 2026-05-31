import React from 'react';
import SignupForm from './components/SignupForm';

function App() {
  return (
    <div className="app">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb--1" aria-hidden="true"></div>
      <div className="bg-orb bg-orb--2" aria-hidden="true"></div>
      <div className="bg-orb bg-orb--3" aria-hidden="true"></div>

      <main className="app__main">
        <SignupForm />
      </main>
    </div>
  );
}

export default App;
