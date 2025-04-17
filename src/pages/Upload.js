import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fullData, setFullData] = useState([]);
  const [headers, setHeaders] = useState([]);
  // Updated columnMap to include two amount fields.
  const [columnMap, setColumnMap] = useState({
    date: '',
    description: '',
    amount1: '', // used for credit or the sole amount column
    amount2: '', // optional; used for debit if applicable
    category: ''
  });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('/api/household');
        setMembers(res.data);
      } catch (err) {
        console.error('Failed to fetch members', err);
      }
    };
    fetchMembers();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/transactions/upload', formData);
      // Add a blank member field for each row in the full data
      const enriched = res.data.fullData.map(row => ({ ...row, member: '' }));
      setPreview(res.data.preview);
      setFullData(enriched);
      setTotalRows(res.data.totalRows);

      // Get headers from the first preview row if available
      const firstRow = res.data.preview[0]?.raw || {};
      setHeaders(Object.keys(firstRow));

      setError('');
      setSuccessMessage('');
    } catch (err) {
      console.error(err);
      setError('Upload failed. Check CSV format and try again.');
    }
  };

  const handleMemberChange = (index, memberId) => {
    const updated = [...fullData];
    updated[index].member = memberId;
    setFullData(updated);
  };

  const handleSaveAll = async () => {
    try {
      const res = await axios.post('/api/transactions/batch', {
        transactions: fullData.map(row => {
          // For the amount, we use the following logic:
          // If the user mapped a second amount column (amount2), assume it holds a debit value.
          // Only one of the columns will have a value.
          // Otherwise, use the value from amount1 as is.
          let amount;
          if (columnMap.amount2) {
            const credit = parseFloat(row.raw[columnMap.amount1] || 0);
            const debit = parseFloat(row.raw[columnMap.amount2] || 0);
            // Since only one column should have a number, choose the non-zero value and return its absolute value.
            amount = credit ? Math.abs(credit) : Math.abs(debit);
          } else {
            // Single column: take its absolute value.
            amount = Math.abs(parseFloat(row.raw[columnMap.amount1] || 0));
          }
          
          const tx = {
            date: row.raw[columnMap.date],
            description: row.raw[columnMap.description],
            amount: amount,
            category: row.raw[columnMap.category] || 'Uncategorized',
            // Use row.match for type fallback, defaulting to "Uncategorized"
            type: row.match || 'Uncategorized',
            notes: ''
          };

          // Add member if valid (24-character hex string)
          if (row.member && /^[a-f\d]{24}$/i.test(row.member)) {
            tx.member = row.member;
          }

          return tx;
        })
      });

      setSuccessMessage(res.data.message);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to save transactions.');
      setSuccessMessage('');
    }
  };

  // Check that the mandatory mapping fields are complete.
  const isMappingComplete = columnMap.date && columnMap.description && columnMap.amount1;

  return (
    <div className="text-white flex-col text-center bg-gray-900 p-20 rounded-lg shadow-2xl">
      <div className="flex flex-col gap-8 items-center mb-6">
      <h1 className="text-2xl font-bold mb-4">Upload Transactions</h1>
      <input
        type="file"
        id="csv-upload"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <label
        htmlFor="csv-upload"
        className="inline-block bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded cursor-pointer hover:bg-red-100 transition"
      >
        Choose CSV File
      </label>

      {file && <p className="mt-2 text-sm text-gray-200">{file.name}</p>}
      <button
        onClick={handleUpload}
        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 hover:shadow-lg transition duration-300 ease-in-out"
      >
        Upload & Preview
      </button>
      </div>

      {/* Mapping Fields */}
      {headers.length > 0 && (
        <div className="mt-4 space-y-2">
          <h2 className="font-semibold">Map Columns</h2>
          {/* Map Date, Description, and Category normally */}
          {['date', 'description', 'category'].map((field) => (
            <div key={field} className="flex items-center gap-4">
              <label className="w-24 capitalize">{field}:</label>
              <select
                value={columnMap[field]}
                onChange={(e) => setColumnMap({ ...columnMap, [field]: e.target.value })}
                className="px-2 py-1 rounded border-2 border-red-900 bg-gray-800"
              >
                <option value="">-- Select Column --</option>
                {headers.map((header) => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          ))}
          {/* Mapping for the two amount fields */}
          <div className="flex items-center gap-4">
            <label className="w-24 capitalize">Amount 1:</label>
            <select
              value={columnMap.amount1}
              onChange={(e) => setColumnMap({ ...columnMap, amount1: e.target.value })}
              className="border-2 border-red-900 bg-gray-800 px-2 py-1 rounded"
            >
              <option value="">-- Select Credit Column --</option>
              {headers.map((header) => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="w-24 capitalize">Amount 2:</label>
            <select
              value={columnMap.amount2}
              onChange={(e) => setColumnMap({ ...columnMap, amount2: e.target.value })}
              className="border-2 border-red-900 bg-gray-800 px-2 py-1 rounded"
            >
              <option value="">-- Select Debit Column (Optional) --</option>
              {headers.map((header) => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}

      {preview.length > 0 && (
        <div className="mt-6">
          <p className="font-medium text-gray-700">
            Showing preview of first {preview.length} rows (of {totalRows})
          </p>
          {/* Preview Table with columns: Date, Description, Amount, Category, Matched Type */}
          <table className="w-full mt-2 text-sm">
            <thead className="bg-red-800 text-white text-left">
              <tr>
                <th className="p-2 red-900 border-2 border-red-900">Date</th>
                <th className="p-2 red-900 border-2 border-red-900">Description</th>
                <th className="p-2 red-900 border-2 border-red-900">Amount</th>
                <th className="p-2 red-900 border-2 border-red-900">Category</th>
                <th className="p-2 red-900 border-2 border-red-900">Matched Type</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => {
                const credit = parseFloat(row.raw?.[columnMap.amount1] || 0);
                const debit = parseFloat(row.raw?.[columnMap.amount2] || 0);
                // When two columns are mapped, use the nonzero (absolute) value.
                // If only one column is mapped, take the absolute value.
                const computedAmount = columnMap.amount2
                  ? (credit ? Math.abs(credit) : Math.abs(debit))
                  : Math.abs(parseFloat(row.raw?.[columnMap.amount1] || 0));
                return (
                  <tr key={i}>
                    <td className="p-2 border-2 border-red-900">
                      {row.raw?.[columnMap.date]
                        ? new Date(row.raw[columnMap.date]).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="p-2 border-2 border-red-900">{row.raw?.[columnMap.description] || 'N/A'}</td>
                    <td className="p-2 border-2 border-red-900">
                      {isNaN(computedAmount) ? 'N/A' : computedAmount.toFixed(2)}
                    </td>
                    <td className="p-2 border-2 border-red-900">{row.raw?.[columnMap.category] || 'Uncategorized'}</td>
                    <td className="p-2 border-2 border-red-900">{row.match || 'Uncategorized'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        
        {/* Save Transactions Button */}
          <div className="mt-4">
            <button
              onClick={handleSaveAll}
              disabled={!isMappingComplete}
              className={`px-4 py-2 rounded text-white ${
                isMappingComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Save All Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
