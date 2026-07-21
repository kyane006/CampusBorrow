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
          <div className="item-list">
              {items.map(item => (
                <div className="item-card" key={item._id}>
                  <h3>{item.title}</h3>
                  <p><strong>Category:</strong> {item.category}</p>
                  <p><strong>Status:</strong> {item.isAvailable ? 'Available' : 'Unavailable'}</p>

                  <button onClick={() => getItemDetails(item._id)}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
            {selectedItem && (
              <div className="item-details">
                <h3>Item Details</h3>
                <p><strong>Name:</strong> {selectedItem.title}</p>
                <p><strong>Category:</strong> {selectedItem.category}</p>
                <p><strong>Description:</strong> {selectedItem.description}</p>
                <p><strong>Status:</strong> {selectedItem.isAvailable ? 'Available' : 'Unavailable'}</p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default App;
