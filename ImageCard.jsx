import { useMemo } from 'react';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateStableGradient(seed) {
  const hue1 = seed % 360;
  const hue2 = (seed * 31) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 50%, 80%), hsl(${hue2}, 60%, 85%))`;
}

function ImageCard({ image, onClick }) {
  const gradient = useMemo(() => generateStableGradient(simpleHash(image.hash)), [image.hash]);

  const cardWidth = image.thumbWidth + 50;
  const cardHeight = image.thumbHeight + 50;

  return (
    <div
      className="flex items-center justify-center rounded-lg shadow-lg cursor-pointer transition-transform duration-200 hover:scale-105"
      style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, background: gradient }}
      onClick={onClick}
      role="button"
      aria-label={`View image ${image.sourcePath}`}
    >
      <picture>
        <source srcSet={image.thumbSrc} type="image/webp" />
        <img src={image.thumbSrc_fallback} alt={`Thumbnail for ${image.sourcePath}`} width={image.thumbWidth} height={image.thumbHeight} className="max-w-full max-h-full object-contain rounded-sm" loading="lazy" />
      </picture>
    </div>
  );
}

export default ImageCard;