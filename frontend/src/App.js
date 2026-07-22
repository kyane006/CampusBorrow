import './App.css';
import { useState, useEffect } from 'react';
import Login from './login';
import Register from './register';
import Dashboard from './dashboard';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('campusBorrow_userId'));
  
  // The switch that controls whether to show Login or Register
  const [showRegister, setShowRegister] = useState(false); 
  
  // The switch that controls whether to show the Dashboard
  const [showDashboard, setShowDashboard] = useState(false);
  
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '', category: '', price: '', description: '', photo: ''
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
    setNewItem({ ...newItem, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const token = localStorage.getItem('campusBorrow_token');

    if (!userId) {
      alert("You must be logged in to post an item!");
      return;
    }

    fetch('http://localhost:3001/api/items', {
      method: 'POST',
      headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newItem,
        price: Number(newItem.price),
        photo: newItem.photo || '/noimage.jpg',
        isAvailable: true
      })
    })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add item');
      return data;
    })
    .then(data => {
      setItems([...items, data]);
      setNewItem({ title: '', category: '', price: '', description: '', photo: '' });
    })
    .catch(error => console.log('Error adding item:', error));
  };

  const deleteItem = (id) => {
    const token = localStorage.getItem('campusBorrow_token');

    fetch(`http://localhost:3001/api/items/${id}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(() => {
        setItems(items.filter(item => item._id !== id));
        setSelectedItem(null);
      })
      .catch(error => console.log('Error deleting item:', error));
  };

  const handleLogout = () => {
    localStorage.removeItem('campusBorrow_userId');
    setUserId(null); 
    setShowDashboard(false); // Reset dashboard state on logout
  };

  if (!userId) {
    if (showRegister) {
      return <Register onSwitchToLogin={() => setShowRegister(false)} />;
    }
    
    return (
      <div>
        <Login onLoginSuccess={(id) => setUserId(id)} />
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button 
            onClick={() => setShowRegister(true)} 
            style={{ background: 'none', border: 'none', color: '#28a745', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
          >
            Need an account? Sign up here.
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="hero">
        <div className="hero-title">
          <img src="/transparent-logo.png" alt="CampusBorrow logo" className="hero-logo"/>
          <div className="hero-text">
            <h1>CampusBorrow</h1>
            <p>Borrow and lend items with students on campus.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowDashboard(!showDashboard)} 
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {showDashboard ? 'Back to Feed' : 'My Dashboard'}
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {showDashboard ? (
          <Dashboard token={localStorage.getItem('campusBorrow_token')} />
        ) : (
          <>
            <section className="add-item-section">
              <h2>Add New Item</h2>
              <form onSubmit={handleSubmit}>
                <input type="text" name="title" placeholder="Item title" value={newItem.title} onChange={handleInputChange} />
                <input type="text" name="category" placeholder="Category" value={newItem.category} onChange={handleInputChange} />
                <input type="number" name="price" placeholder="Price" value={newItem.price} onChange={handleInputChange} />
                <input type="text" name="description" placeholder="Description" value={newItem.description} onChange={handleInputChange} />
                <input type="text" name="photo" placeholder="Image URL" value={newItem.photo} onChange={handleInputChange} />
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
                      <p className="item-price">${item.price}</p>
                      <p><strong>Category:</strong> {item.category}</p>
                      <p><strong>Status:</strong> {item.isAvailable ? 'Available' : 'Unavailable'}</p>
                      <button onClick={() => getItemDetails(item._id)}>View Details</button>
                      {item.lenderId === userId && (
                         <button onClick={() => deleteItem(item._id)} style={{ marginLeft: '10px', background: '#ff4d4d', color: 'white' }}>Delete</button>
                      )}
                    </div>
                  ))}
                </div>

                {selectedItem && (
                  <div className="item-details">
                    <h2>Selected Item</h2>
                    <img src={selectedItem.photo || '/noimage.jpg'} alt={selectedItem.title} className="details-image" onError={(e) => { e.target.src = '/noimage.jpg'; }} />
                    <h3>{selectedItem.title}</h3>
                    <p className="item-price">${selectedItem.price}</p>
                    <p><strong>Category:</strong> {selectedItem.category}</p>
                    <p><strong>Price:</strong> ${selectedItem.price}</p>
                    <p><strong>Description:</strong> {selectedItem.description}</p>
                    <p><strong>Status:</strong> {selectedItem.isAvailable ? 'Available' : 'Unavailable'}</p>
                    <button className="borrow-button">Request to Borrow</button>
                  </div>
                )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;