// src/pages/Budget.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('needs');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');

  const fetchBudgets = async () => {
    try {
      const res = await axios.get('/api/budget');
      setBudgets(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load budgets');
    }
  };

  const handleAddBudget = async () => {
    if (!newCategory || !newAmount || !newType) return;
    try {
      const res = await axios.post('/api/budget', {
        category: newCategory,
        amount: parseFloat(newAmount),
        type: newType
      });
      setBudgets([...budgets, res.data]);
      setNewCategory('');
      setNewAmount('');
      setNewType('needs');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to add budget');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/budget/${id}`);
      setBudgets(budgets.filter(b => b._id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete budget');
    }
  };

  const handleEditChange = (id, field, value) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'amount' ? parseFloat(value) : value
      }
    }));
  };

  const handleSaveEdit = async (id) => {
    try {
      const updated = editData[id];
      const res = await axios.put(`/api/budget/${id}`, updated);
      setBudgets(budgets.map(b => (b._id === id ? res.data : b)));
      setEditingId(null);
      setEditData(prev => ({ ...prev, [id]: {} }));
    } catch (err) {
      console.error(err);
      setError('Failed to update budget');
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (budgets.length > 0) {
      setError('');
    }
  }, [budgets]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monthly Budget</h1>
      {/* Add Budget Form */}
      <div className="mb-6 flex gap-2 bg-red-800/50 backdrop-blur-m p-4 rounded-lg shadow-md">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Category"
          className="border rounded px-2 py-1 w-1/3 border-red-900 text-red-900 bg-red-900 backdrop-blur-m"
        />
        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Amount"
          className="border rounded px-2 py-1 w-1/3 border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="border rounded px-2 py-1 w-1/3 border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
        >
          <option value="needs">Needs</option>
          <option value="wants">Wants</option>
          <option value="savings">Savings</option>
          <option value="investments">Investments</option>
        </select>
        <button
          onClick={handleAddBudget}
          className="bg-red-900 text-white px-4 py-1 rounded hover:bg-red-800 transition duration-200"
        >
          Add
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
        {/* Budget Table */}
      <table className="w-full border text-sm border-red-900 text-gray-200 p-4 bg-red-800/50 backdrop-blur-m">
        <thead className="border-red-900 bg-red-800/50 text-gray-200">
          <tr>
            <th className="border p-2 border-red-900 bg-red-800/50 backdrop-blur-m">Category</th>
            <th className="border p-2 border-red-900 bg-red-800/50 backdrop-blur-m">Amount</th>
            <th className="border p-2 border-red-900 bg-red-800/50 backdrop-blur-m">Type</th>
            <th className="border p-2 border-red-900 bg-red-800/50 backdrop-blur-m">Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((b) => (
            <tr key={b._id}>
              <td className="border p-2 border-red-900 ">
                {editingId === b._id ? (
                  <input
                    value={editData[b._id]?.category || b.category}
                    onChange={(e) => handleEditChange(b._id, 'category', e.target.value)}
                    className="border px-1 py-0.5 w-full"
                  />
                ) : (
                  b.category
                )}
              </td>
              <td className="border p-2 border-red-900 ">
                {editingId === b._id ? (
                  <input
                    type="number"
                    value={editData[b._id]?.amount || b.amount}
                    onChange={(e) => handleEditChange(b._id, 'amount', e.target.value)}
                    className="border px-1 py-0.5 w-full"
                  />
                ) : (
                  `$${b.amount.toFixed(2)}`
                )}
              </td>
              <td className="border p-2 border-red-900">
                {editingId === b._id ? (
                  <select
                    value={editData[b._id]?.type || b.type}
                    onChange={(e) => handleEditChange(b._id, 'type', e.target.value)}
                    className="border px-1 py-0.5 w-full"
                  >
                    <option value="needs">Needs</option>
                    <option value="wants">Wants</option>
                    <option value="savings">Savings</option>
                    <option value="investments">Investments</option>
                  </select>
                ) : (
                  b.type
                )}
              </td>
              <td className="border p-2 border-red-900 ">
                {editingId === b._id ? (
                  <button
                    onClick={() => handleSaveEdit(b._id)}
                    className="text-green-600 hover:underline mr-2"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingId(b._id)}
                    className="text-gray-500 hover:underline mr-2"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(b._id)}
                  className="text-gray-200 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
