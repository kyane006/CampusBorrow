import React, { useState, useEffect } from 'react';

export default function Dashboard() {
    const userId = localStorage.getItem('campusBorrow_userId');
    const token = localStorage.getItem('campusBorrow_token');

    const [profile, setProfile] = useState({ name: '', bio: '', campusLocation: '' });
    const [profileMsg, setProfileMsg] = useState('');
    
    const [myItems, setMyItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null); // Tracks which item is being edited
    
    // State for future features
    // eslint-disable-next-line no-unused-vars
    const [borrowedItems, setBorrowedItems] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [myReviews, setMyReviews] = useState([]);

    useEffect(() => {
        // 1. Fetch User's Items
        fetch('http://localhost:3001/api/items')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter to only show items this user owns
                    const userItems = data.filter(item => item.lenderId === userId);
                    setMyItems(userItems);
                }
            })
            .catch(err => console.error("Error fetching items:", err));

        // Note: When the backend routes are built, you will add fetch calls 
        // here for GET /api/users/profile, GET /api/borrows/me, and GET /api/reviews/me
    }, [userId]);

    // --- PROFILE HANDLER ---
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/users/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(profile)
            });
            if (res.ok) setProfileMsg('Profile updated successfully!');
            else setProfileMsg('Failed to update profile.');
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    // --- ITEM EDIT HANDLERS ---
    const handleItemUpdateChange = (e) => {
        const { name, value } = e.target;
        setEditingItem({ ...editingItem, [name]: value });
    };

    const submitItemUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/items/${editingItem._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(editingItem)
            });
            
            if (res.ok) {
                const updatedItem = await res.json();
                // Update the item in the local array so the UI refreshes
                setMyItems(myItems.map(item => item._id === updatedItem._id ? updatedItem : item));
                setEditingItem(null); // Close the edit form
            } else {
                alert("Failed to update item.");
            }
        } catch (error) {
            console.error('Item update error:', error);
        }
    };

    const deleteItem = async (id) => {
        try {
            const res = await fetch(`http://localhost:3001/api/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMyItems(myItems.filter(item => item._id !== id));
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>User Dashboard</h2>

            {/* SECTION 1: ACCOUNT & PROFILE */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>My Profile</h3>
                {profileMsg && <p style={{ color: 'green' }}>{profileMsg}</p>}
                <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" placeholder="Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ padding: '8px' }} />
                    <input type="text" placeholder="Campus Location" value={profile.campusLocation} onChange={(e) => setProfile({...profile, campusLocation: e.target.value})} style={{ padding: '8px' }} />
                    <textarea placeholder="Bio" value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} style={{ padding: '8px', minHeight: '80px' }} />
                    <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save Profile
                    </button>
                </form>
            </div>

            {/* SECTION 2: MY LISTINGS (View, Edit, Delete) */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>My Listings</h3>
                {myItems.length === 0 ? <p>You haven't listed any items yet.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {myItems.map(item => (
                            <div key={item._id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '4px', background: '#fafafa' }}>
                                
                                {/* If this item is being edited, show the form */}
                                {editingItem && editingItem._id === item._id ? (
                                    <form onSubmit={submitItemUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input type="text" name="title" value={editingItem.title} onChange={handleItemUpdateChange} required />
                                        <input type="number" name="price" value={editingItem.price} onChange={handleItemUpdateChange} required />
                                        <textarea name="description" value={editingItem.description} onChange={handleItemUpdateChange} required />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="submit" style={{ background: '#28a745', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>Save Updates</button>
                                            <button type="button" onClick={() => setEditingItem(null)} style={{ background: '#6c757d', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Normal Display Mode */
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0' }}>{item.title}</h4>
                                                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>${item.price} - {item.category}</p>
                                                <p style={{ margin: '0', fontSize: '14px' }}>{item.description}</p>
                                            </div>
                                            <img src={item.photo} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => e.target.src='/noimage.jpg'} />
                                        </div>
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                            <button onClick={() => setEditingItem(item)} style={{ background: '#ffc107', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>Edit</button>
                                            <button onClick={() => deleteItem(item._id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>Delete</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 3: CURRENTLY BORROWING */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Items I'm Borrowing</h3>
                {borrowedItems.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>You are not currently borrowing any items. Request an item from the main feed!</p>
                ) : (
                    <div>{/* Will map borrowed items here once backend is ready */}</div>
                )}
            </div>

            {/* SECTION 4: MY REVIEWS & RATINGS */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <h3>My Reviews & Ratings</h3>
                <div style={{ marginBottom: '15px' }}>
                    <strong>My Average Rating: </strong> 
                    <span style={{ color: '#f39c12' }}>★★★★★ (0)</span>
                </div>
                {myReviews.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>No reviews yet. Complete a borrow to leave or receive reviews.</p>
                ) : (
                    <div>{/* Will map reviews here once backend is ready */}</div>
                )}
            </div>
            
        </div>
    );
}