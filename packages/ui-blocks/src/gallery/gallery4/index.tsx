import { cn } from "../../lib/utils";
import defaults from "./default.json";

export interface Gallery4Props {
  title?: string;
  subtitle?: string;
  featuredImage?: string;
  featuredCaption?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  backgroundColor?: string;
  accentColor?: string;
}

const Gallery4 = ({
  title = defaults.title,
  subtitle = defaults.subtitle,
  featuredImage = defaults.featuredImage,
  featuredCaption = defaults.featuredCaption,
  image1 = defaults.image1,
  image2 = defaults.image2,
  image3 = defaults.image3,
  image4 = defaults.image4,
  backgroundColor = defaults.backgroundColor,
  accentColor = defaults.accentColor,
}: Gallery4Props) => {
  const thumbnails = [image1, image2, image3, image4];

  return (
    <div className="w-full py-12 px-6" style={{ backgroundColor }}>
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-3xl font-bold tracking-tight mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
        {/* Featured image */}
        <div className="relative overflow-hidden rounded-xl group aspect-[4/3] bg-muted">
          <img
            src={featuredImage}
            alt="Featured gallery image"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {featuredCaption && (
            <div
              className="absolute bottom-0 left-0 right-0 px-5 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              style={{ backgroundColor: accentColor }}
            >
              <p className="text-white text-sm font-medium">{featuredCaption}</p>
            </div>
          )}
        </div>

        {/* 2×2 thumbnail grid */}
        <div className="grid grid-cols-2 gap-4">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-xl bg-muted aspect-square"
              )}
            >
              {src && (
                <img
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery4;
