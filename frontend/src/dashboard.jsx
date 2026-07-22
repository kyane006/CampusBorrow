import React, { useState, useEffect, useRef } from 'react';

export default function Dashboard() {
    const userId = localStorage.getItem('campusBorrow_userId');
    const token = localStorage.getItem('campusBorrow_token');

    const [profile, setProfile] = useState({ name: '', bio: '', campusLocation: '', photo: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const avatarFileRef = useRef(null);
    
    const [myItems, setMyItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null); 
    
    const [borrowedItems, setBorrowedItems] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [myReviews, setMyReviews] = useState([]);

    // Track which request/borrow card has its chat expanded
    const [expandedRequestId, setExpandedRequestId] = useState(null);
    const [expandedBorrowId, setExpandedBorrowId] = useState(null);

    // Track which borrows the user has already reviewed (by borrow ID)
    const [reviewedBorrowIds, setReviewedBorrowIds] = useState(new Set());

    // Pause polling while user is typing in chat
    const isTypingRef = useRef(false);

    // Helper to fetch all borrow data dynamically for live updates
    const fetchBorrows = () => {
        if (!token || isTypingRef.current) return;
        
        // Fetch Items I'm Borrowing
        fetch('http://localhost:3001/api/borrows/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setBorrowedItems(data); });

        // Fetch Incoming Requests
        fetch('http://localhost:3001/api/borrows/incoming', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setIncomingRequests(data); });
    };

    useEffect(() => {
        if (!token) return;

        // 1. Fetch Profile
        fetch('http://localhost:3001/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.name) {
                setProfile({
                    name: data.name || '',
                    bio: data.bio || '',
                    campusLocation: data.campusLocation || '',
                    photo: data.photo || '/default-avatar.png'
                });
            }
        }).catch(err => console.error("Error fetching profile:", err));

        // 2. Fetch My Listed Items
        fetch('http://localhost:3001/api/items')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const userItems = data.filter(item => item.lenderId === userId);
                    setMyItems(userItems);
                }
            }).catch(err => console.error("Error fetching items:", err));

        // 3. Fetch Initial Borrows & Requests
        fetchBorrows();

        // Polling Interval for Live Updates (Every 3 seconds)
        const intervalId = setInterval(() => {
            fetchBorrows();
        }, 3000);

        // 4. Fetch My Reviews
        fetch('http://localhost:3001/api/reviews/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setMyReviews(data); })
        .catch(err => console.error("Error fetching reviews:", err));

        // Cleanup interval when leaving dashboard
        return () => clearInterval(intervalId);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('bio', profile.bio);
            formData.append('campusLocation', profile.campusLocation);

            if (avatarFileRef.current && avatarFileRef.current.files[0]) {
                formData.append('photo', avatarFileRef.current.files[0]);
            }

            const res = await fetch('http://localhost:3001/api/users/profile', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(prev => ({ ...prev, photo: data.user.photo }));
                setProfileMsg('Profile updated successfully!');
            } else {
                setProfileMsg('Failed to update profile.');
            }
        } catch (error) {
            setProfileMsg('Error updating profile.');
        }
    };

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

    // Update Request Status (Approve/Cancel) and refresh data live
    const handleStatusUpdate = async (borrowId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:3001/api/borrows/${borrowId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchBorrows();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Shared message send handler with optimistic UI update
    const sendMessage = (borrowId, text) => {
        if (!text) return;

        const userName = profile.name || 'You';

        // Optimistic: inject message into local state immediately
        const optimisticMsg = { senderId: { name: userName }, text, sentAt: new Date().toISOString() };

        const addMsg = (list) =>
            list.map(b => b._id === borrowId
                ? { ...b, messages: [...(b.messages || []), optimisticMsg] }
                : b
            );

        setBorrowedItems(prev => addMsg(prev));
        setIncomingRequests(prev => addMsg(prev));

        // Fire the request in the background, no await needed
        fetch(`http://localhost:3001/api/borrows/${borrowId}/messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ text })
        }).catch(error => console.error('Error sending message:', error));
    };

    // Submit a review for a completed borrow
    const submitReview = async (borrowId, revieweeId, rating, comment) => {
        try {
            const res = await fetch('http://localhost:3001/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ borrowId, revieweeId, rating, comment })
            });
            if (res.ok) {
                setReviewedBorrowIds(prev => new Set([...prev, borrowId]));
                // Refresh reviews list
                fetch('http://localhost:3001/api/reviews/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setMyReviews(data); });
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    // Inline review form component
    const ReviewForm = ({ borrowId, revieweeId, revieweeName, onComplete }) => {
        const [rating, setRating] = useState(5);
        const [comment, setComment] = useState('');
        const [submitted, setSubmitted] = useState(false);

        if (submitted || reviewedBorrowIds.has(borrowId)) {
            return (
                <p style={{ fontSize: '13px', color: '#28a745', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                    Review submitted! Thanks.
                </p>
            );
        }

        return (
            <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px', padding: '12px', background: '#fffbea', border: '1px solid #f0e68c', borderRadius: '6px' }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Leave a Review for {revieweeName || 'this user'}</h5>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <span
                            key={star}
                            onClick={() => setRating(star)}
                            style={{ fontSize: '22px', cursor: 'pointer', color: star <= rating ? '#f39c12' : '#ccc' }}
                        >
                            ★
                        </span>
                    ))}
                </div>
                <textarea
                    placeholder="How was your experience?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onFocus={() => { isTypingRef.current = true; }}
                    onBlur={() => { isTypingRef.current = false; }}
                    style={{ width: '100%', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '50px', boxSizing: 'border-box' }}
                    required
                />
                <button
                    onClick={() => {
                        if (!comment.trim()) { alert('Please write a comment'); return; }
                        submitReview(borrowId, revieweeId, rating, comment);
                        setSubmitted(true);
                        if (onComplete) onComplete();
                    }}
                    style={{ marginTop: '6px', padding: '6px 14px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                    Submit Review
                </button>
            </div>
        );
    };

    // Reusable chat UI component
    const ChatSection = ({ borrow, placeholder }) => (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Messages</h5>
            <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f9f9f9', padding: '8px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                {borrow.messages && borrow.messages.length > 0 ? (
                    borrow.messages.map((msg, index) => (
                        <div key={index} style={{ fontSize: '13px', marginBottom: '5px', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <strong style={{ color: '#333' }}>{msg.senderId?.name || 'User'}:</strong>{' '}
                            <span style={{ color: '#555' }}>{msg.text}</span>
                        </div>
                    ))
                ) : (
                    <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', margin: '0' }}>No messages yet.</p>
                )}
            </div>
            <form onSubmit={(e) => {
                e.preventDefault();
                const textInput = e.target.elements.messageText;
                sendMessage(borrow._id, textInput.value);
                textInput.value = '';
            }} style={{ display: 'flex', gap: '5px' }}>
                <input type="text" name="messageText" placeholder={placeholder || 'Type a message...'} onFocus={() => { isTypingRef.current = true; }} onBlur={() => { isTypingRef.current = false; }} style={{ flexGrow: 1, padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ccc' }} required />
                <button type="submit" style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>Send</button>
            </form>
        </div>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
                Welcome to your Dashboard, {profile.name || 'User'}!
            </h2>

            {/* SECTION 1: ACCOUNT & PROFILE */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
                    <img 
                        src={profile.photo || '/default-avatar.png'} 
                        alt="Profile Avatar" 
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px', border: '2px solid #ddd' }}
                        onError={(e) => { e.target.src = '/noimage.jpg'; }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Your Avatar</span>
                </div>

                <div style={{ flexGrow: 1 }}>
                    <h3>Edit Profile Details</h3>
                    {profileMsg && <p style={{ color: 'green', fontWeight: 'bold' }}>{profileMsg}</p>}
                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" placeholder="Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ padding: '8px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ fontSize: '12px', color: '#666' }}>Upload New Avatar Image:</label>
                            <input type="file" ref={avatarFileRef} accept="image/*" style={{ padding: '4px' }} />
                        </div>
                        <input type="text" placeholder="Campus Location" value={profile.campusLocation} onChange={(e) => setProfile({...profile, campusLocation: e.target.value})} style={{ padding: '8px' }} />
                        <textarea placeholder="Bio" value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} style={{ padding: '8px', minHeight: '80px' }} />
                        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Save Profile
                        </button>
                    </form>
                </div>
            </div>

            {/* SECTION 2: INCOMING REQUESTS (FOR THE LENDER) - Click to expand chat */}
            <div style={{ border: '1px solid #17a2b8', padding: '20px', borderRadius: '8px', marginBottom: '20px', background: '#f4fcfe' }}>
                <h3 style={{ color: '#138496' }}>Incoming Borrow Requests</h3>
                {incomingRequests.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>No one has requested to borrow your items yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {incomingRequests.map(req => {
                            const isExpanded = expandedRequestId === req._id;
                            const messageCount = req.messages ? req.messages.length : 0;

                            return (
                                <div 
                                    key={req._id} 
                                    onClick={() => setExpandedRequestId(isExpanded ? null : req._id)}
                                    style={{ 
                                        border: isExpanded ? '2px solid #17a2b8' : '1px solid #bce8f1', 
                                        padding: '15px', 
                                        borderRadius: '4px', 
                                        background: '#fff', 
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0' }}>{req.listingId ? req.listingId.title : 'Item Removed'}</h4>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                                                <strong>Requested by:</strong> {req.borrowerId?.name || 'Unknown User'} <br />
                                                <strong>Status:</strong>{' '}
                                                <span style={{ fontWeight: 'bold', color: req.status === 'Pending' ? '#f39c12' : req.status === 'Approved' ? 'green' : 'red' }}>
                                                    {req.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {messageCount > 0 && (
                                                <span style={{ 
                                                    background: '#17a2b8', 
                                                    color: '#fff', 
                                                    borderRadius: '12px', 
                                                    padding: '2px 8px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold' 
                                                }}>
                                                    {messageCount} msg{messageCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '18px', color: '#888', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Approve/Decline buttons (always visible for pending) */}
                                    {req.status === 'Pending' && (
                                        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <button onClick={() => handleStatusUpdate(req._id, 'Approved')} style={{ padding: '5px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Approve Request</button>
                                            <button onClick={() => handleStatusUpdate(req._id, 'Canceled')} style={{ padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Decline Request</button>
                                        </div>
                                    )}

                                    {/* Mark as Returned button (lender closes the borrow when item is back) */}
                                    {req.status === 'Approved' && (
                                        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px' }}>
                                            <button onClick={() => handleStatusUpdate(req._id, 'Completed')} style={{ padding: '8px 16px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Mark as Returned
                                            </button>
                                        </div>
                                    )}

                                    {/* Review form after completed (lender reviews borrower) */}
                                    {req.status === 'Completed' && (
                                        <ReviewForm
                                            borrowId={req._id}
                                            revieweeId={req.borrowerId?._id}
                                            revieweeName={req.borrowerId?.name}
                                            onComplete={() => setExpandedRequestId(null)}
                                        />
                                    )}

                                    {/* Chat - only visible when expanded */}
                                    {isExpanded && (
                                        <ChatSection borrow={req} placeholder="Type a reply..." />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 3: ITEMS I'M BORROWING - Click to expand chat */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Items I'm Borrowing</h3>
                {borrowedItems.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>You are not currently borrowing any items.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {borrowedItems.map(borrow => {
                            const isExpanded = expandedBorrowId === borrow._id;
                            const messageCount = borrow.messages ? borrow.messages.length : 0;

                            return (
                                <div 
                                    key={borrow._id} 
                                    onClick={() => setExpandedBorrowId(isExpanded ? null : borrow._id)}
                                    style={{ 
                                        border: isExpanded ? '2px solid #007bff' : '1px solid #ddd', 
                                        padding: '15px', 
                                        borderRadius: '4px', 
                                        background: '#fdfdfd', 
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0' }}>{borrow.listingId ? borrow.listingId.title : 'Item Removed'}</h4>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                                                <strong>Status:</strong>{' '}
                                                <span style={{ 
                                                    color: borrow.status === 'Completed' ? '#6f42c1' : borrow.status === 'Approved' ? 'green' : borrow.status === 'Canceled' ? 'red' : '#f39c12',
                                                    fontWeight: 'bold' 
                                                }}>{borrow.status}</span>
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {messageCount > 0 && (
                                                <span style={{ 
                                                    background: '#007bff', 
                                                    color: '#fff', 
                                                    borderRadius: '12px', 
                                                    padding: '2px 8px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold' 
                                                }}>
                                                    {messageCount} msg{messageCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '18px', color: '#888', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>

                                    {/* Review form after completed (borrower reviews lender) */}
                                    {borrow.status === 'Completed' && (
                                        <ReviewForm
                                            borrowId={borrow._id}
                                            revieweeId={borrow.lenderId?._id}
                                            revieweeName={borrow.lenderId?.name}
                                            onComplete={() => setExpandedBorrowId(null)}
                                        />
                                    )}

                                    {/* Chat - only visible when expanded */}
                                    {isExpanded && (
                                        <ChatSection borrow={borrow} placeholder="Type coordination message..." />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 4: MY LISTINGS */}
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
                                            <button type="submit" style={{ background: '#28a745', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>Save</button>
                                            <button type="button" onClick={() => setEditingItem(null)} style={{ background: '#6c757d', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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

            {/* SECTION 5: MY REVIEWS & RATINGS (split by role) */}
            {(() => {
                const lenderReviews = myReviews.filter(r => r.borrowId && String(r.borrowId.lenderId) === String(userId));
                const borrowerReviews = myReviews.filter(r => r.borrowId && String(r.borrowId.borrowerId) === String(userId));

                const avgRating = (reviews) => reviews.length > 0
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : null;

                const ReviewList = ({ reviews, emptyMsg }) => (
                    reviews.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#666', margin: '5px 0 0 0' }}>{emptyMsg}</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                            {reviews.map(review => (
                                <div key={review._id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '4px', background: '#f9f9f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <strong>{review.reviewerId ? review.reviewerId.name : 'Unknown User'}</strong>
                                        <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                    </div>
                                    <p style={{ margin: '0', fontStyle: 'italic', color: '#444' }}>"{review.comment}"</p>
                                </div>
                            ))}
                        </div>
                    )
                );

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Reviews as Lender */}
                        <div style={{ border: '1px solid #6f42c1', padding: '20px', borderRadius: '8px', background: '#f9f5ff' }}>
                            <h3 style={{ color: '#6f42c1', margin: '0 0 5px 0' }}>Reviews as Lender</h3>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                                What borrowers said about you.
                                {avgRating(lenderReviews) && (
                                    <span style={{ marginLeft: '10px', color: '#f39c12', fontWeight: 'bold' }}>
                                        {avgRating(lenderReviews)} / 5.0 ({lenderReviews.length} review{lenderReviews.length !== 1 ? 's' : ''})
                                    </span>
                                )}
                            </p>
                            <ReviewList reviews={lenderReviews} emptyMsg="No lender reviews yet. Lend an item and get reviewed!" />
                        </div>

                        {/* Reviews as Borrower */}
                        <div style={{ border: '1px solid #17a2b8', padding: '20px', borderRadius: '8px', background: '#f4fcfe' }}>
                            <h3 style={{ color: '#138496', margin: '0 0 5px 0' }}>Reviews as Borrower</h3>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                                What lenders said about you.
                                {avgRating(borrowerReviews) && (
                                    <span style={{ marginLeft: '10px', color: '#f39c12', fontWeight: 'bold' }}>
                                        {avgRating(borrowerReviews)} / 5.0 ({borrowerReviews.length} review{borrowerReviews.length !== 1 ? 's' : ''})
                                    </span>
                                )}
                            </p>
                            <ReviewList reviews={borrowerReviews} emptyMsg="No borrower reviews yet. Borrow an item and get reviewed!" />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}