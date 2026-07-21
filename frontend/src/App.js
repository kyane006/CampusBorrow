import './App.css';
import { useState, useEffect } from 'react';

function App() {
const [items, setItems] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);

const [newItem, setNewItem] = useState({
  title: '',
  category: '',
  price: '',
  description: '',
  photo: ''
});

  useEffect(() => {
  fetch('http://localhost:3001/api/items')
    .then(response => response.json())
    .then(data => setItems(data))
    .catch(error => console.log('Error fetching items:', error));
}, []);

  const getItemDetails = (id) => {
    fetch(`http://localhost:3001/api/items/${id}`)
      .then(response => response.json())
      .then(data => setSelectedItem(data));
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
      setNewItem({
        ...newItem,
        [name]: value
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    fetch('http://localhost:3001/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...newItem,
        price: Number(newItem.price),
        lenderId: '507f1f77bcf86cd799439011',
        photo: newItem.photo || '/noimage.jpg',
        isAvailable: true
      })
    })
    .then(async response => {
      const data = await response.json();
      
      if (!response.ok) {
        console.log('Backend error:', data);
        throw new Error(data.error || 'Failed to add item');
      }
      return data;
    })
    .then(data => {
      setItems([...items, data]);

      setNewItem({
        title: '',
        category: '',
        price: '',
        description: '',
        photo: ''
      });
    })
    .catch(error => {
      console.log('Error adding item:', error);
    });
  };

  // Deletes an item from the backend and removes it from the page
const deleteItem = (id) => {
  fetch(`http://localhost:3001/api/items/${id}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      return response.json();
    })
    .then(() => {
      setItems(items.filter(item => item._id !== id));
      setSelectedItem(null);
    })
    .catch(error => {
      console.log('Error deleting item:', error);
    });
};

  return (
    <div className="App">
      <header className="hero">
        <h1>CampusBorrow</h1>
        <p>Borrow and lend items with students on campus.</p>
      </header>
      <main className="main-content">
        <section className="add-item-section">
          <h2>Add New Item</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Item title"
              value={newItem.title}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="category"
              placeholder="Category"
              value={newItem.category}
              onChange={handleInputChange}
            />

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={newItem.price}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="description"
              placeholder="Description"
              value={newItem.description}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="photo"
              placeholder="Image URL"
              value={newItem.photo}
              onChange={handleInputChange}
            />

            <button type="submit">Add Item</button>
          </form>
        </section>
        
        <section className="intro-card">
          <h2>Available Items</h2>
          <div className="item-list">
              {Array.isArray(items) && items.map(item => (
                <div className="item-card" key={item._id}>
                  <img src={item.photo} alt={item.title} className="item-image" />
                  <h3>{item.title}</h3>
                  <p><strong>Category:</strong> {item.category}</p>
                  <p><strong>Status:</strong> {item.isAvailable ? 'Available' : 'Unavailable'}</p>

                  <button onClick={() => getItemDetails(item._id)}>View Details </button>
                  <button onClick={() => deleteItem(item._id)}>Delete</button>
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
