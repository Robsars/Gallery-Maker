import { Link } from 'react-router-dom';

function Pagination({ currentPage, totalPages, baseUrl }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-4 mt-12">
      {currentPage > 1 && (
        <Link to={`${baseUrl}/page/${currentPage - 1}`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          &larr; Previous
        </Link>
      )}
      <span className="text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link to={`${baseUrl}/page/${currentPage + 1}`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Next &rarr;
        </Link>
      )}
    </div>
  );
}

export default Pagination;