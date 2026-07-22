import './App.css';
import { useState, useEffect, useRef } from 'react';
import Login from './login';
import Register from './register';
import Dashboard from './dashboard';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('campusBorrow_userId'));
  const token = localStorage.getItem('campusBorrow_token');

  const [showRegister, setShowRegister] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '',
    category: '',
    price: '',
    description: ''
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItem, setEditItem] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    photo: ''
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const fileInputRef = useRef(null);

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

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditItem({ ...editItem, [name]: value });
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (searchCategory) params.append('category', searchCategory);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (onlyAvailable) params.append('isAvailable', 'true');

    fetch(`http://localhost:3001/api/items/search?${params.toString()}`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
          setSelectedItem(null);
        }
      })
      .catch(error => console.error('Search error:', error));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!userId) {
      alert('You must be logged in to post an item!');
      return;
    }

    const formData = new FormData();
    formData.append('title', newItem.title);
    formData.append('category', newItem.category);
    formData.append('price', Number(newItem.price));
    formData.append('description', newItem.description);
    formData.append('lenderId', userId);
    formData.append('isAvailable', true);

    if (fileInputRef.current && fileInputRef.current.files[0]) {
      formData.append('photo', fileInputRef.current.files[0]);
    }

    fetch('http://localhost:3001/api/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to add item');
        return data;
      })
      .then(data => {
        setItems([...items, data]);
        setNewItem({ title: '', category: '', price: '', description: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      })
      .catch(error => console.log('Error adding item:', error));
  };

  const startEditing = (item) => {
    setEditingItemId(item._id);
    setEditItem({
      title: item.title || '',
      category: item.category || '',
      price: item.price || '',
      description: item.description || '',
      photo: item.photo || ''
    });
  };

  const updateItem = (id) => {
    fetch(`http://localhost:3001/api/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...editItem,
        price: Number(editItem.price)
      })
    })
      .then(response => response.json())
      .then(updatedItem => {
        setItems(items.map(item => item._id === id ? updatedItem : item));
        setSelectedItem(updatedItem);
        setEditingItemId(null);
      })
      .catch(error => console.log('Error updating item:', error));
  };

  const deleteItem = (id) => {
    fetch(`http://localhost:3001/api/items/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete item');
        return response.json();
      })
      .then(() => {
        setItems(items.filter(item => item._id !== id));
        setSelectedItem(null);
        if (editingItemId === id) {
          setEditingItemId(null);
        }
      })
      .catch(error => console.log('Error deleting item:', error));
  };

  const handleLogout = () => {
    localStorage.removeItem('campusBorrow_userId');
    localStorage.removeItem('campusBorrow_token');
    setUserId(null);
    setShowDashboard(false);
  };

  // Handle borrow request
  const handleBorrowRequest = async (itemId) => {
    if (!userId) {
      alert("You must be logged in to request an item!");
      return;
    }

    // Prompting for a return date for testing purposes
    const daysOut = prompt("How many days do you want to borrow this item for?", "7");
    if (!daysOut) return;

    const returnTimestamp = Date.now() + (Number(daysOut) * 24 * 60 * 60 * 1000);

    try {
      const res = await fetch('http://localhost:3001/api/borrows', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId: itemId,
          pickupDate: new Date().toISOString(),
          returnDate: new Date(returnTimestamp).toISOString() 
        })
      });

      if (res.ok) {
        alert("Request sent successfully! Check your Dashboard.");
        setSelectedItem(null);
      } else {
        const data = await res.json();
        alert(`Failed to send request: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating borrow request:', error);
    }
  };
  
  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

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
          <img src="/transparent-logo.png" alt="CampusBorrow logo" className="hero-logo" />
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
          <button
            onClick={handleLogout}
            style={{ padding: '8px 16px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {showDashboard ? (
          <Dashboard token={token} />
        ) : (
          <div className="content-layout">
            <section className="add-item-section">
              <h2>Add New Item</h2>
              <form onSubmit={handleSubmit}>
                <input type="text" name="title" placeholder="Item title" value={newItem.title} onChange={handleInputChange} required />
                <input type="text" name="category" placeholder="Category" value={newItem.category} onChange={handleInputChange} required />
                <input type="number" name="price" placeholder="Price" value={newItem.price} onChange={handleInputChange} required />
                <input type="text" name="description" placeholder="Description" value={newItem.description} onChange={handleInputChange} required />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Upload Item Photo:</label>
                  <input type="file" ref={fileInputRef} accept="image/*" required />
                </div>

                <button type="submit">Add Item</button>
              </form>
            </section>

            <section className="search-section" style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3>Search & Filter Listings</h3>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Keyword (title, description)..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ padding: '8px', flexGrow: '1' }}
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  style={{ padding: '8px' }}
                />
                <input
                  type="number"
                  placeholder="Max Price ($)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ padding: '8px', width: '120px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                  />
                  Available Only
                </label>
                <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Search
                </button>
              </form>
            </section>

            <section className="intro-card">
              <h2>Available Items</h2>
              <div className="items-and-details">
                <div className="item-list">
                  {Array.isArray(filteredItems) && filteredItems.map(item => (
                    <div className="item-card" key={item._id}>
                      <img
                        src={item.photo || '/noimage.jpg'}
                        alt={item.title}
                        className="item-image"
                        onError={(e) => { e.target.src = '/noimage.jpg'; }}
                      />
                      <h3>{item.title}</h3>
                      <p className="item-price">${item.price}</p>
                      <p><strong>Category:</strong> {item.category}</p>
                      <p><strong>Status:</strong> {item.isAvailable ? 'Available' : 'Unavailable'}</p>
                      <button onClick={() => getItemDetails(item._id)}>View Details</button>
                      {String(item.lenderId) === String(userId) && (
                        <>
                          <button onClick={() => startEditing(item)}>Edit</button>
                          <button onClick={() => deleteItem(item._id)} style={{ marginLeft: '10px', background: '#ff4d4d', color: 'white' }}>Delete</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {selectedItem && (
                  <div className="item-details">
                    <h2>Selected Item</h2>
                    <img
                      src={selectedItem.photo || '/noimage.jpg'}
                      alt={selectedItem.title}
                      className="details-image"
                      onError={(e) => { e.target.src = '/noimage.jpg'; }}
                    />
                    <h3>{selectedItem.title}</h3>
                    <p className="item-price">${selectedItem.price}</p>
                    <p><strong>Category:</strong> {selectedItem.category}</p>
                    <p><strong>Description:</strong> {selectedItem.description}</p>
                    <p><strong>Status:</strong> {selectedItem.isAvailable ? 'Available' : 'Unavailable'}</p>
                    
                    {/* Borrow button */}
                    <button 
                      className="borrow-button" 
                      onClick={() => handleBorrowRequest(selectedItem._id)}
                      style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Request to Borrow
                    </button>

                    {editingItemId === selectedItem._id && (
                      <div className="edit-item-form" style={{ marginTop: '15px' }}>
                        <h3>Edit Item</h3>

                        <input type="text" name="title" value={editItem.title} onChange={handleEditInputChange} />
                        <input type="text" name="category" value={editItem.category} onChange={handleEditInputChange} />
                        <input type="number" name="price" value={editItem.price} onChange={handleEditInputChange} />
                        <input type="text" name="description" value={editItem.description} onChange={handleEditInputChange} />
                        <input type="text" name="photo" value={editItem.photo} onChange={handleEditInputChange} />

                        <button onClick={() => updateItem(selectedItem._id)}>Save Changes</button>
                        <button onClick={() => setEditingItemId(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;