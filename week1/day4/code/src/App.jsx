import React from 'react';
import { DataProvider } from './context/DataContext';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <DataProvider>
      <div className="app-container">
        <header className="header">
          <nav className="nav">
            <div className="nav-brand">
              <span className="logo-symbol">❖</span>
              <h1>Apex Telemetry</h1>
            </div>
            <ul className="nav-menu">
              <li><a href="#overview" className="active">Overview</a></li>
              <li><a href="#performance">Performance</a></li>
            </ul>
          </nav>
        </header>
        
        <main className="main">
          <aside className="sidebar">
            <nav className="sidebar-nav">
              <ul>
                <li><a href="#dashboard" className="active"><span className="icon">📊</span>Dashboard</a></li>
                <li><a href="#telemetry"><span class="icon">⚡</span>Telemetry</a></li>
              </ul>
            </nav>
          </aside>
          
          <section className="content-wrapper">
            <Dashboard />
          </section>
        </main>
        
        <footer className="footer">
          <p>&copy; 2026 Apex Telemetry. Powered by React hooks & modular states.</p>
        </footer>
      </div>
    </DataProvider>
  );
}

export default App;
