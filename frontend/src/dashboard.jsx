import React, { useState, useEffect } from 'react';

export default function Dashboard() {
    const userId = localStorage.getItem('campusBorrow_userId');
    const token = localStorage.getItem('campusBorrow_token');

    // Added 'photo' to the state
    const [profile, setProfile] = useState({ name: '', bio: '', campusLocation: '', photo: '' });
    const [profileMsg, setProfileMsg] = useState('');
    
    const [myItems, setMyItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null); 
    
    // eslint-disable-next-line no-unused-vars
    const [borrowedItems, setBorrowedItems] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [myReviews, setMyReviews] = useState([]);

    useEffect(() => {
        // 1. Fetch the user's saved profile data
        fetch('http://localhost:3001/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.name) {
                // Pre-fill the form with the database data
                setProfile({
                    name: data.name || '',
                    bio: data.bio || '',
                    campusLocation: data.campusLocation || '',
                    photo: data.photo || '/default-avatar.png'
                });
            }
        })
        .catch(err => console.error("Error fetching profile:", err));

        // 2. Fetch User's Items
        fetch('http://localhost:3001/api/items')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const userItems = data.filter(item => item.lenderId === userId);
                    setMyItems(userItems);
                }
            })
            .catch(err => console.error("Error fetching items:", err));
    }, [userId, token]);

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
                setMyItems(myItems.map(item => item._id === updatedItem._id ? updatedItem : item));
                setEditingItem(null); 
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
            {/* Displaying the saved name dynamically */}
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
                Welcome to your Dashboard, {profile.name || 'User'}!
            </h2>

            {/* SECTION 1: ACCOUNT & PROFILE */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '20px' }}>
                
                {/* Profile Picture Display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
                    <img 
                        src={profile.photo || '/default-avatar.png'} 
                        alt="Profile Avatar" 
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px', border: '2px solid #ddd' }}
                        onError={(e) => { e.target.src = '/noimage.jpg'; }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Your Avatar</span>
                </div>

                {/* Profile Edit Form */}
                <div style={{ flexGrow: 1 }}>
                    <h3>Edit Profile Details</h3>
                    {profileMsg && <p style={{ color: 'green', fontWeight: 'bold' }}>{profileMsg}</p>}
                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" placeholder="Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ padding: '8px' }} />
                        <input type="text" placeholder="Profile Photo URL (e.g., imgur link)" value={profile.photo} onChange={(e) => setProfile({...profile, photo: e.target.value})} style={{ padding: '8px' }} />
                        <input type="text" placeholder="Campus Location" value={profile.campusLocation} onChange={(e) => setProfile({...profile, campusLocation: e.target.value})} style={{ padding: '8px' }} />
                        <textarea placeholder="Bio" value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} style={{ padding: '8px', minHeight: '80px' }} />
                        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Save Profile
                        </button>
                    </form>
                </div>
            </div>

            {/* SECTION 2: MY LISTINGS (View, Edit, Delete) */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>My Listings</h3>
                {myItems.length === 0 ? <p>You haven't listed any items yet.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {myItems.map(item => (
                            <div key={item._id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '4px', background: '#fafafa' }}>
                                
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