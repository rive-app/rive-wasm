import Animation from './Animation.js';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Animation asset="https://cdn.rive.app/animations/truck.riv" fit="cover" alignment="center" />
        <p>
          Edit the <code>src/Animation.js</code> Rive React component.
        </p>
        <a
          className="App-link"
          href="https://beta.rive.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Rive
        </a>
      </header>
    </div>
  );
}

export default App;
