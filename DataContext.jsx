import { createContext, useState, useEffect, useContext, useMemo } from 'react';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({ images: [], settings: { paginate: 200 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('./data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const value = useMemo(() => ({
    images: data.images,
    settings: data.settings,
    loading,
    error,
  }), [data, loading, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}