"use client";
import { useState } from "react";
import Image from "next/image";
import ProductImage from "./ProductImage";
export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, Math.max(0, images.length - 1));
  return (
    <div className="gallery">
      <div className="gallery-main">
        <ProductImage
          src={images[active]}
          alt={`${name}, image ${active + 1}`}
          priority
        />
      </div>
      {images.length > 1 && (
        <>
          <p className="gallery-count" aria-live="polite">
            {active + 1} / {images.length} images
          </p>
          <div
            className="gallery-thumbnails"
            role="group"
            aria-label="Product images"
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setSelected(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === active}
                className={i === active ? "active" : ""}
              >
                <Image src={src} alt="" fill unoptimized sizes="72px" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
