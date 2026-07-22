import { useState } from 'react';

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // <-- Add this line

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:3001/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save the ID and trigger the screen swap in App.js
                localStorage.setItem('campusBorrow_token', data.token);
                localStorage.setItem('campusBorrow_userId', data.userId);
                setSuccess('Login successful!');
                setTimeout(() => {
                    onLoginSuccess(data.userId);
                }, 1500);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Server connection failed.');
        }
    };

    return (
        <div className="login-container" style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <h2>Login to CampusBorrow</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <button type="submit" style={{ padding: '10px', fontSize: '16px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                    Sign In
                </button>
            </form>
        </div>
    );
}