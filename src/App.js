import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Members from './pages/Members';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Layout from './components/Layout';

function App() {
  const { token, loading, user } = useContext(AuthContext);

  // Prevent routes from rendering before auth check is done
  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budget" element={<Budget />} />
          <Route path="goals" element={<Goals />} />
          <Route path="members" element={<Members />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

      {/* Display logged in user's name for debug */}
      {user && (
        <div className="fixed bottom-2 right-2 bg-gray-100 border px-3 py-1 text-sm text-gray-800 rounded shadow">
          Logged in as: <strong>{user.username}</strong>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
