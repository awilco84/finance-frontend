import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filterType, setFilterType] = useState('');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkMember, setBulkMember] = useState('');
  const [bulkType, setBulkType] = useState('');
  const [selected, setSelected] = useState({});

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTransactions();
    fetchMembers();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions');
      setTransactions(res.data.reverse());
    } catch (err) {
      setError('Failed to load transactions');
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get('/api/household');
      setMembers(res.data);
    } catch (err) {
      setError('Failed to load members');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const dateMatch = (!startDate || txDate >= new Date(startDate)) && (!endDate || txDate <= new Date(endDate));
    const memberMatch = !selectedMember || (tx.member && tx.member._id === selectedMember);
    const searchMatch = !searchTerm || tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const amountMatch = (!minAmount || tx.amount >= Number(minAmount)) && (!maxAmount || tx.amount <= Number(maxAmount));
    const typeMatch = !filterType || tx.type.toLowerCase() === filterType.toLowerCase();
    return dateMatch && memberMatch && searchMatch && amountMatch && typeMatch;
  });

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);

  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSelect = id => {
    setSelected(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    if (paginatedTransactions.every(tx => selected[tx._id])) {
      setSelected({});
    } else {
      const newSelected = {};
      paginatedTransactions.forEach(tx => {
        newSelected[tx._id] = true;
      });
      setSelected(newSelected);
    }
  };

  const handleSave = async id => {
    const updated = editing[id];
    try {
      await axios.put(`/api/transactions/${id}`, updated);
      setSuccess('Saved successfully');
      setError('');
      setEditing(prev => ({ ...prev, [id]: undefined }));
      fetchTransactions();
    } catch (err) {
      setError('Failed to save changes');
      setSuccess('');
    }
  };

  const handleBulkApply = async () => {
    if (!bulkMember && !bulkType) {
      setError('Please select at least a member or a type to apply.');
      return;
    }
    const updateObj = {};
    if (bulkMember) updateObj.member = bulkMember;
    if (bulkType) updateObj.type = bulkType;
    try {
      const bulkUpdates = Object.keys(selected)
        .filter(id => selected[id])
        .map(id => axios.put(`/api/transactions/${id}`, updateObj));
      await Promise.all(bulkUpdates);
      setSuccess('Bulk update successful');
      setError('');
      setSelected({});
      setBulkMember('');
      setBulkType('');
      fetchTransactions();
    } catch (err) {
      setError('Bulk update failed');
      setSuccess('');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deleteUpdates = Object.keys(selected)
        .filter(id => selected[id])
        .map(id => axios.delete(`/api/transactions/${id}`));
      await Promise.all(deleteUpdates);
      setSuccess('Bulk delete successful');
      setError('');
      setSelected({});
      fetchTransactions();
    } catch (err) {
      setError('Bulk delete failed');
      setSuccess('');
    }
  };

  const handleSaveSelected = async () => {
    try {
      const updates = Object.keys(selected)
        .filter(id => selected[id] && editing[id])
        .map(id => axios.put(`/api/transactions/${id}`, editing[id]));
      await Promise.all(updates);
      setSuccess('Bulk save successful');
      setError('');
      setSelected({});
      setEditing({});
      fetchTransactions();
    } catch (err) {
      setError('Bulk save failed');
      setSuccess('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      {/* FILTER CONTROLS */}
      <div className="border-2 border-red-900 p-4 mb-4 bg-red-800/50 rounded-lg shadow-lg backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-2">Filter Your Transactions By:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-red-900 px-2 py-1 w-full text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-red-900 px-2 py-1 w-full text-gray-200"
            />
          </div>
          {/* Member Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200">Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="border rounded px-2 py-1 w-full border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
            >
              <option value="">All Members</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {/* Description Search */}
          <div>
            <label className="block text-sm font-medium text-gray-200">Search Description</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter a keyword..."
              className="border border-red-900 px-2 py-1 w-full text-gray-200"
            />
          </div>
          {/* Amount Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="border border-red-900 px-2 py-1 w-full text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200">Max Amount</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="border border-red-900 px-2 py-1 w-full text-gray-200"
            />
          </div>
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded px-2 py-1 w-1/3 border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
            >
              <option value="">All Types</option>
              <option value="uncategorized">Uncategorized</option>
              <option value="income">Income</option>
              <option value="needs">Needs</option>
              <option value="wants">Wants</option>
              <option value="savings">Savings</option>
              <option value="investments">Investments</option>
              <option value="credit card payments">Credit Card Payments</option>
            </select>
          </div>
        </div>
      </div>

      {/* BULK MODE TOGGLE AND ACTIONS */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
        <button
          onClick={() => {
            setIsBulkMode(prev => !prev);
            setSelected({});
          }}
          className="bg-red-800/50 text-white px-4 py-2 rounded hover:bg-red-900"
        >
          {isBulkMode ? 'Exit Bulk Mode' : 'Enable Bulk Mode'}
        </button>
        {isBulkMode && (
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="bulkMember" className="text-sm font-medium text-gray-300">Member:</label>
              <select
                id="bulkMember"
                value={bulkMember}
                onChange={(e) => setBulkMember(e.target.value)}
                className="border rounded px-2 py-1 border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
              >
                <option value="">-- None --</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="bulkType" className="text-sm font-medium text-gray-300">Type:</label>
              <select
                id="bulkType"
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value)}
                className="border rounded px-2 py-1 w-1/3 border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
              >
                <option value="">-- None --</option>
                <option value="uncategorized">Uncategorized</option>
                <option value="income">Income</option>
                <option value="needs">Needs</option>
                <option value="wants">Wants</option>
                <option value="savings">Savings</option>
                <option value="investments">Investments</option>
                <option value="credit card payments">Credit Card Payments</option>
              </select>
            </div>
            <button
              onClick={handleBulkApply}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Apply Bulk Changes
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* TRANSACTIONS TABLE */}
      <table className="w-full border border-red-900 text-gray-200 text-sm">
  <thead className="bg-red-800/50 roulded-lg shadow-lg backdrop-blur-md border-red-900">
    <tr>
      {isBulkMode && (
        <th className="p-2 border text-center border-red-900">
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={
              paginatedTransactions.length > 0 &&
              paginatedTransactions.every(tx => selected[tx._id])
            }
          />
        </th>
      )}
      <th className="p-2 border border-red-900">Date</th>
      <th className="p-2 border border-red-900">Description</th>
      <th className="p-2 border border-red-900">Amount</th>
      <th className="p-2 border border-red-900">Type</th>
      <th className="p-2 border border-red-900">Category</th>
      <th className="p-2 border border-red-900">Member</th>
      <th className="p-2 border border-red-900">Actions</th>
    </tr>
  </thead>
  {/* Table Body */}
  <tbody>
    {paginatedTransactions.map(tx => (
      <tr key={tx._id}>
        {isBulkMode && (
          <td className="p-2 border border-red-900 text-center">
            <input
              type="checkbox"
              checked={!!selected[tx._id]}
              onChange={() => handleSelect(tx._id)}
            />
          </td>
        )}
        <td className="p-2 border border-red-900">{new Date(tx.date).toLocaleDateString()}</td>
        <td className="p-2 border border-red-900">
          <input
            type="text"
            value={editing[tx._id]?.description ?? tx.description}
            onChange={(e) => handleChange(tx._id, 'description', e.target.value)}
            className="w-full border px-1 py-0.5 border-red-900"
          />
        </td>
        <td className="p-2 border border-red-900">
          <input
            type="number"
            value={editing[tx._id]?.amount ?? tx.amount}
            onChange={(e) => handleChange(tx._id, 'amount', e.target.value)}
            className="w-full border px-1 py-0.5 border-red-900"
          />
        </td>
        <td className="p-2 border border-red-900">
          <select
            value={editing[tx._id]?.type ?? tx.type}
            onChange={(e) => handleChange(tx._id, 'type', e.target.value)}
            className="border px-1 py-0.5 border-red-900"
          >
            <option value="uncategorized">Uncategorized</option>
            <option value="income">Income</option>
            <option value="needs">Needs</option>
            <option value="wants">Wants</option>
            <option value="savings">Savings</option>
            <option value="investments">Investments</option>
            <option value="credit card payments">Credit Card Payments</option>
          </select>
        </td>
        <td className="p-2 border border-red-900">
          <input
            type="text"
            value={editing[tx._id]?.category ?? tx.category}
            onChange={(e) => handleChange(tx._id, 'category', e.target.value)}
            className="w-full border px-1 py-0.5 border-red-900"
          />
        </td>
        <td className="p-2 border border-red-900">
          <select
            value={editing[tx._id]?.member ?? tx.member?._id ?? ''}
            onChange={(e) => handleChange(tx._id, 'member', e.target.value)}
            className="border px-1 py-0.5 border-red-900"
          >
            <option value="">-- None --</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </td>
        <td className="p-2 border border-red-900">
          <button
            onClick={() => handleSave(tx._id)}
            className="bg-red-800/50 text-white px-3 py-1 rounded text-sm hover:bg-red-900"
          >
            Save
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>



    {/* Pagination Controls */}
    <div className="flex justify-between items-center mt-6">
        <div className="flex items-center gap-2">
          <label htmlFor="rowsPerPage" className="text-sm text-gray-200">Rows per page:</label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border px-2 py-1 rounded bg-red-800 text-white border-red-900"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="px-3 py-1 rounded bg-gray-600 text-white disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-200">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="px-3 py-1 rounded bg-gray-600 text-gray-200 border-red-900 disabled:opacity-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
