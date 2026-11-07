"use client";
import Image from "next/image";
import { useState } from "react";
import Icon from "./Icon";
export default function ProductImage({
  src,
  alt,
  priority = false,
}: {
  src?: string;
  alt: string;
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className="product-image">
      {src && failedSrc !== src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="missing-image">
          <Icon name="photo" size={38} />
          <span>No image available</span>
        </div>
      )}
    </div>
  );
}
