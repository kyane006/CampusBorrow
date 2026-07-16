import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  useEffect(() => {
  fetch('http://localhost:3001/api/items')
    .then(response => response.json())
    .then(data => setItems(data));
}, []);

  const getItemDetails = (id) => {
    fetch(`http://localhost:3001/api/items/${id}`)
      .then(response => response.json())
      .then(data => setSelectedItem(data));
  };

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
                <li key={item.id} onClick={() => getItemDetails(item.id)}>
                  {item.name} - {item.category}
                </li>
              ))}
            </ul>
            {selectedItem && (
              <div className="item-details">
                <h3>Item Details</h3>
                <p><strong>Name:</strong> {selectedItem.name}</p>
                <p><strong>Category:</strong> {selectedItem.category}</p>
                <p><strong>Description:</strong> {selectedItem.description}</p>
                <p><strong>Status:</strong> {selectedItem.available ? 'Available' : 'Unavailable'}</p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default App;
