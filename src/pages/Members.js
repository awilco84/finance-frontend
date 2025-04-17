import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMembers = async () => {
    setError('');
    try {
      const res = await axios.get('/api/household');
      setMembers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load members');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    setError('');
    setSuccessMessage('');
    try {
      const res = await axios.post('/api/household', { name: newMemberName });
      setMembers([...members, res.data]);
      setNewMemberName('');
      setSuccessMessage('Member added successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to add member');
    }
  };

  const handleDeleteMember = async (id) => {
    setError('');
    setSuccessMessage('');
    try {
      await axios.delete(`/api/household/${id}`);
      setMembers(members.filter(m => m._id !== id));
      setSuccessMessage('Member deleted');
    } catch (err) {
      console.error(err);
      setError('Failed to delete member');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Household Members</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          placeholder="New member name"
          className="border rounded px-2 py-1 w-full border-red-900 text-gray-200"
        />
        <button
          onClick={handleAddMember}
          className="bg-red-900 text-white px-4 py-1 rounded hover:bg-red-800"
        >
          Add
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

      <ul className="space-y-2">
        {members.map(member => (
          <li key={member._id} className="flex justify-between items-center border p-2 rounded border-red-900 text-gray-200 bg-red-800 hover:bg-red-900 transition duration-200 ease-in-out">
            <span>{member.name}</span>
            <button
              onClick={() => handleDeleteMember(member._id)}
              className="text-sm text-gray-200 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}