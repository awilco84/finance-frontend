import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalSaved, setTotalSaved] = useState(0);
  const [unallocated, setUnallocated] = useState(0);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editedGoal, setEditedGoal] = useState({ name: '', target: '' });

  useEffect(() => {
    fetchGoals();
    fetchSavingsTotal();
  }, []);

  const fetchSavingsTotal = async () => {
    try {
      const res = await axios.get('/api/goals/savings-total');
      setTotalSaved(res.data.total);
      setUnallocated(res.data.unallocated);
    } catch (err) {
      console.error('Failed to fetch savings total');
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await axios.get('/api/goals');
      const sorted = res.data.sort((a, b) => {
        const aProgress = a.target ? (a.saved || 0) / a.target : 0;
        const bProgress = b.target ? (b.saved || 0) / b.target : 0;
        return bProgress - aProgress;
      });
      setGoals(sorted);
    } catch (err) {
      setError('Failed to load goals');
    }
  };

  const handleAddGoal = async () => {
    try {
      await axios.post('/api/goals', { name: newGoal, target: newTarget });
      setNewGoal('');
      setNewTarget('');
      setSuccess('Goal added successfully');
      setError('');
      fetchGoals();
      fetchSavingsTotal();
    } catch (err) {
      setError('Failed to add goal');
      setSuccess('');
    }
  };

  const handleAllocate = async (goalId) => {
    try {
      await axios.post(`/api/goals/${goalId}/allocate`, { amount });
      setAmount('');
      fetchGoals();
      fetchSavingsTotal();
    } catch (err) {
      setError('Failed to allocate amount');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await axios.delete(`/api/goals/${goalId}`);
      fetchGoals();
      fetchSavingsTotal();
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  const handleEditGoal = async (goalId) => {
    try {
      await axios.put(`/api/goals/${goalId}`, editedGoal);
      setEditingGoalId(null);
      setEditedGoal({ name: '', target: '' });
      fetchGoals();
    } catch (err) {
      setError('Failed to update goal');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-red-900/50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Goals</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New goal"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          className="border px-2 py-1 border-red-900 text-gray-200 w-full"
        />
        <input
          type="number"
          placeholder="Target amount"
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
          className="border px-2 py-1 border-red-900 text-gray-200 w-40"
        />
        <button
          onClick={handleAddGoal}
          className="bg-red-900 text-white px-4 py-1 rounded hover:bg-red-800 transition duration-200"
        >
          Add
        </button>
      </div>

      <div className="bg-red-900 text-gray-200 p-3 rounded mb-4">
        <strong>Total Saved:</strong> ${totalSaved.toFixed(2)}<br />
        <small className="text-gray-400">Unallocated: ${unallocated.toFixed(2)}</small>
      </div>

      <ul className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.target ? Math.min(100, ((goal.saved || 0) / goal.target) * 100) : 0;

          return (
            <li key={goal._id} className="border p-4 rounded border-red-900 text-gray-200 bg-red-800/50 hover:bg-red-900 transition duration-200 ease-in-out">
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="text-sm text-gray-300 mb-1 flex justify-between">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {editingGoalId === goal._id ? (
                <div className="mb-2 ">
                  <input
                    type="text"
                    value={editedGoal.name}
                    onChange={(e) => setEditedGoal({ ...editedGoal, name: e.target.value })}
                    className="border px-2 border-red-900 text-gray-300 py-1 mr-2"
                  />
                  <input
                    type="number"
                    value={editedGoal.target}
                    onChange={(e) => setEditedGoal({ ...editedGoal, target: e.target.value })}
                    className="border px-2 border-red-900 text-gray-300 py-1 w-24"
                  />
                  <button
                    onClick={() => handleEditGoal(goal._id)}
                    className="ml-2 px-3 py-1 bg-red-800 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingGoalId(null)}
                    className="ml-2 px-3 py-1 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="font-medium text-lg">{goal.name}</div>
                  <p className="text-sm text-gray-400 mb-2">
                    Saved: ${goal.saved?.toFixed(2) || '0.00'} / ${goal.target?.toFixed(2) || '0.00'}
                  </p>
                </>
              )}

              {/* Allocate Amount */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border px-2 py-1 w-full border-red-800 text-gray-200"
                />
                <button
                  onClick={() => handleAllocate(goal._id)}
                  className="bg-red-800 text-white px-4 py-1 rounded hover:bg-red-800/50 shadow-black/50"
                >
                  Allocate
                </button>
                <button
                  onClick={() => {
                    setEditingGoalId(goal._id);
                    setEditedGoal({ name: goal.name, target: goal.target });
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal._id)}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}