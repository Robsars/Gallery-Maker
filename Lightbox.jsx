import { useState, useEffect, useCallback } from 'react';

function Lightbox({ images, startIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentImage = images[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setIsZoomed(false);
    setIsLoaded(false);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setIsZoomed(false);
    setIsLoaded(false);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Swipe detection
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) {
        goToNext();
      }
      if (touchEndX - touchStartX > 50) {
        goToPrev();
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrev]);

  const handleImageClick = () => {
    setIsZoomed(prev => !prev);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      {/* Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-4xl font-bold z-50" aria-label="Close lightbox">&times;</button>

      {/* Prev Button */}
      <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold z-50" aria-label="Previous image">&#8249;</button>

      {/* Next Button */}
      <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold z-50" aria-label="Next image">&#8250;</button>

      <div className="relative w-full h-full flex items-center justify-center" onClick={handleImageClick}>
        {!isLoaded && <div className="text-white">Loading...</div>}
        <img
          key={currentImage.hash}
          src={isZoomed ? currentImage.src : currentImage.thumbSrc}
          alt={`Full view of ${currentImage.sourcePath}`}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isZoomed ? 'max-w-none max-h-none cursor-zoom-out' : 'max-w-full max-h-full object-contain cursor-zoom-in'}`}
          onLoad={() => setIsLoaded(true)}
        />
        {/* Preload full image when showing thumbnail view */}
        {!isZoomed && <img src={currentImage.src} alt="" className="hidden" />}
      </div>
    </div>
  );
}

export default Lightbox;