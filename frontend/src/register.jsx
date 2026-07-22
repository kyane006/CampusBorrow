import { useState } from 'react';

export default function Register({ onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await fetch('http://localhost:3001/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Account created! Redirecting to login...');
                
                // Wait 1.5 seconds so they can see the success message, then switch screens
                setTimeout(() => {
                    onSwitchToLogin();
                }, 1500);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Server connection failed.');
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <h2>Create an Account</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    style={{ padding: '10px', fontSize: '16px' }}
                />
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
                <button type="submit" style={{ padding: '10px', fontSize: '16px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                    Sign Up
                </button>
            </form>
            
            <button 
                onClick={onSwitchToLogin} 
                style={{ marginTop: '20px', background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
            >
                Already have an account? Log in here.
            </button>
        </div>
    );
}