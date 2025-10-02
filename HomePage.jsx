import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

function HomePage() {
  const { images, loading, error } = useData();

  const galleryIndex = useMemo(() => {
    if (!images || images.length === 0) return {};

    const index = {};
    images.forEach(image => {
      const year = image.year;
      const month = String(image.month).padStart(2, '0');
      if (!index[year]) {
        index[year] = {};
      }
      if (!index[year][month]) {
        index[year][month] = 0;
      }
      index[year][month]++;
    });
    return index;
  }, [images]);

  if (loading) return <div>Loading gallery...</div>;
  if (error) return <div>Error loading gallery data. Make sure 'data.json' exists.</div>;

  const sortedYears = Object.keys(galleryIndex).sort((a, b) => b - a);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Photo Gallery</h1>
      {sortedYears.map(year => (
        <div key={year} className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">{year}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.keys(galleryIndex[year]).sort((a, b) => b - a).map(month => (
              <Link key={month} to={`/months/${year}/${month}`} className="p-4 bg-gray-100 rounded-lg text-center hover:bg-blue-100 transition-colors">
                <div className="text-lg font-medium">{new Date(0, month - 1).toLocaleString('default', { month: 'long' })}</div>
                <div className="text-sm text-gray-500">{galleryIndex[year][month]} photos</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HomePage;