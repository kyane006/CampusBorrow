import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  useEffect(() => {
  fetch('http://localhost:3001/api/items')
    .then(response => response.json())
    .then(data => setItems(data));
}, []);

  return (
    <div className="App">
      <header className="hero">
        <h1>CampusBorrow</h1>
        <p>Borrow and lend items with students on campus.</p>
      </header>

      <main className="main-content">
        <section className="intro-card">
          <h2>Available Items</h2>
            <ul className="item-list">
              {items.map(item => (
                <li key={item.id}>
                  {item.name} - {item.category}
                </li>
              ))}
            </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
