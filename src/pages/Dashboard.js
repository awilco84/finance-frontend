import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TIME_FILTERS = {
  'This Month': () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  },
  'Last 30 Days': () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  },
  All: () => ({ start: null, end: null }),
};

export default function Dashboard() {
  const [totals, setTotals] = useState({ income: 0, expenses: 0, savings: 0, investments: 0 });
  const [topGoals, setTopGoals] = useState([]);
  const [budget, setBudget] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('');
  const [timeframe, setTimeframe] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [goalsRes, budgetRes, txRes] = await Promise.all([
        axios.get('/api/goals'),
        axios.get('/api/budget'),
        axios.get('/api/transactions'),
      ]);

      const goalList = goalsRes.data
        .map(goal => ({
          ...goal,
          progress: goal.target ? (goal.saved || 0) / goal.target : 0,
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 3);

      let start, end;
      if (timeframe === 'Custom') {
        start = customStart ? new Date(customStart) : null;
        end = customEnd ? new Date(customEnd) : null;
      } else {
        ({ start, end } = TIME_FILTERS[timeframe]());
      }

      const filtered = txRes.data.filter(tx => {
        const txDate = new Date(tx.date);
        return (!start || txDate >= start) && (!end || txDate <= end);
      });

      const normalize = (type) => type?.toLowerCase().trim();

      const totalIncome = filtered
        .filter(tx => normalize(tx.type) === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const totalExpenses = filtered
        .filter(tx => ['needs', 'wants'].includes(normalize(tx.type)))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const totalSavings = filtered
        .filter(tx => normalize(tx.type) === 'savings')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const totalInvestments = filtered
        .filter(tx => normalize(tx.type) === 'investments')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const budgetByType = budgetRes.data.reduce((acc, item) => {
        const type = normalize(item.type);
        if (type) {
          acc[type] = (acc[type] || 0) + item.amount;
        }
        return acc;
      }, {});

      const spentByType = filtered.reduce((acc, tx) => {
        const key = normalize(tx.type);
        acc[key] = (acc[key] || 0) + (Number(tx.amount) || 0);
        return acc;
      }, {});

      const allTypes = [...new Set([...Object.keys(budgetByType), ...Object.keys(spentByType)])];
      const barData = allTypes.map(type => ({
        type,
        budget: parseFloat(budgetByType[type]?.toFixed(2) || 0),
        actual: parseFloat(spentByType[type]?.toFixed(2) || 0),
      }));

      setTopGoals(goalList);
      setBudget(barData);
      setTransactions(filtered);
      setTotals({
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSavings,
        investments: totalInvestments,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [timeframe, customStart, customEnd]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredTransactions = filter
    ? transactions.filter(tx => tx.type.toLowerCase() === filter.toLowerCase())
    : transactions;

  const exportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Type', 'Category'],
      ...filteredTransactions.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.amount,
        tx.type,
        tx.category,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };


  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex-col items-center justify-between mb-4 bg-red-800/50 p-4 rounded-md border border-red-900 backdrop-blur-md mx-auto md:flex-row">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Time Filter */}
      <div className="flex gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 rounded">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-red-900 px-4 py-2 bg-red-800 backdrop-blur-2xl hover:bg-red-900 transition duration-300 ease-in text-gray-200"
          >
            {Object.keys(TIME_FILTERS).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
            <option value="Custom">Custom Range</option>
          </select>
        </div>

        {timeframe === 'Custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-200 px-4 py-2">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border px-4 py-2 text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border px-4 py-2 text-gray-200"
              />
            </div>
          </>
        )}
      </div>

      {/* Bar Chart */}
      <div className=" shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-white">Budget vs Actual</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={budget}>
            <XAxis dataKey="type" stroke='lightgray' />
            <YAxis stroke='lightgray'/>
            <Tooltip stroke= "red"/>
            <Legend />
            <Bar dataKey="budget" fill="#201010" name="Budget" />
            <Bar dataKey="actual" fill="#301212" name="Spent/Saved" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ">
        {Object.entries(totals).map(([key, value]) => (
          <div key={key} className="h-full w-full bg-red-900 rounded-md border border-red-900 p-4 hover:bg-red-800 transition duration-300 ease-in-out">
            <div className="text-sm text-gray-200 capitalize">{key}</div>
            <div className="text-lg font-semibold text-white">${value.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Top Goals */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Top Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topGoals.map((goal) => (
            <div key={goal._id} className="h-full w-full bg-red-900 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-40 border border-red-900 p-4">
              <div className="font-medium text-white">{goal.name}</div>
              <div className="text-sm mb-1 text-gray-400">
                ${goal.saved?.toFixed(2) || 0} of ${goal.target?.toFixed(2) || 0}
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-green-600 h-2 rounded"
                  style={{ width: `${Math.min(100, (goal.progress * 100).toFixed(2))}%` }}
                />
              </div>
              <div className="text-xs text-right text-gray-200 mt-1">
                {(goal.progress * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
      {/* Transaction Filter Dropdown */}
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="transaction-filter" className="text-sm font-medium text-gray-200 border-red-900 rounded">Filter by Type:</label>
        <select
          id="transaction-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-2 py-1 w-1/3 border-red-900 text-gray-200 bg-red-900 backdrop-blur-m"
        >
          <option value="">All</option>
          <option value="income">Income</option>
          <option value="needs">Needs</option>
          <option value="wants">Wants</option>
          <option value="savings">Savings</option>
          <option value="investments">Investments</option>
          <option value="credit card payments">Credit Card Payments</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="h-full bg-red-900 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-40 border border-red-900 p-8">
        <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
        <button
          onClick={exportCSV}
          className="mb-4 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 hover:shadow-lg transition duration-300 ease-in-out"
        >
          Export CSV
        </button>
        <table className="w-full text-sm border-red-900 text-gray-200">
          <thead className="bg-red-900 text-gray-200 ">
            <tr>
              <th className="p-2 border border-red-900">Date</th>
              <th className="p-2 border border-red-900">Description</th>
              <th className="p-2 border border-red-900">Amount</th>
              <th className="p-2 border border-red-900">Type</th>
              <th className="p-2 border border-red-900">Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx._id}>
                <td className="p-2 border border-red-900">{new Date(tx.date).toLocaleDateString()}</td>
                <td className="p-2 border border-red-900">{tx.description}</td>
                <td className="p-2 border border-red-900">${tx.amount.toFixed(2)}</td>
                <td className="p-2 border border-red-900 capitalize">{tx.type}</td>
                <td className="p-2 border border-red-900">{tx.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
