import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ImageCard from '../components/ImageCard';
import Lightbox from '../components/Lightbox';
import Pagination from '../components/Pagination';

function MonthPage() {
  const { images, settings, loading, error } = useData();
  const { year, month, page = '1' } = useParams();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const currentPage = parseInt(page, 10);
  const itemsPerPage = settings.paginate;

  const monthImages = useMemo(() => {
    return images.filter(img => img.year == year && img.month == month);
  }, [images, year, month]);

  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return monthImages.slice(startIndex, startIndex + itemsPerPage);
  }, [monthImages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(monthImages.length / itemsPerPage);

  if (loading) return <div>Loading images...</div>;
  if (error) return <div>Error loading image data.</div>;

  const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:underline">Home</Link> &gt; {year}
      </nav>
      <h1 className="text-3xl font-bold mb-8">{monthName} {year}</h1>

      <div className="flex flex-wrap justify-center gap-4">
        {paginatedImages.map((image, index) => (
          <ImageCard
            key={image.hash}
            image={image}
            onClick={() => setLightboxIndex(index)}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/months/${year}/${month}`}
      />

      {lightboxIndex !== null && (
        <Lightbox
          images={paginatedImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

export default MonthPage;