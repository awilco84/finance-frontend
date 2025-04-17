import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-900 text-white flex-col text-center">
      <div className="mb-4 text-2xl font-bold">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mx-auto w-96 rounded-lg bg-black p-8 shadow-2xl">
        <input className="w-full border p-2" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border p-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-all duration-500" type="submit">Login</button>
      </form>
      </div>
    </div>
  );
}