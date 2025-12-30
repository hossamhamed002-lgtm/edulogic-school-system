import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DeveloperLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dev/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.status === 401 || !res.ok) {
        setError('بيانات غير صحيحة');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data?.token) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dev/dashboard';
        return;
      }
      setError('بيانات غير صحيحة');
    } catch {
      setError('بيانات غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Developer Login</h1>
        {error && <div className="text-red-600 text-sm font-bold">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="PRO-2025-ADMIN-MASTER"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="•••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default DeveloperLogin;
