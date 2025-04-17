import { createContext, useState, useContext } from 'react';

const SavingsContext = createContext();

export const SavingsProvider = ({ children }) => {
  const [totalSaved, setTotalSaved] = useState(0);

  const fetchSavingsTotal = async () => {
    try {
      const res = await fetch('/api/goals/savings-total');
      const data = await res.json();
      setTotalSaved(data.total);
    } catch (err) {
      console.error('Failed to fetch savings total');
    }
  };

  return (
    <SavingsContext.Provider value={{ totalSaved, fetchSavingsTotal }}>
      {children}
    </SavingsContext.Provider>
  );
};

export const useSavings = () => useContext(SavingsContext);