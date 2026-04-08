import { cn } from "../../lib/utils";
import defaults from "./default.json";

export interface Gallery1Props {
  title?: string;
  subtitle?: string;
  columns?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  backgroundColor?: string;
}

const columnsClass: Record<string, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const Gallery1 = ({
  title = defaults.title,
  subtitle = defaults.subtitle,
  columns = defaults.columns,
  image1 = defaults.image1,
  image2 = defaults.image2,
  image3 = defaults.image3,
  image4 = defaults.image4,
  image5 = defaults.image5,
  image6 = defaults.image6,
  backgroundColor = defaults.backgroundColor,
}: Gallery1Props) => {
  const images = [image1, image2, image3, image4, image5, image6].filter(Boolean);
  const gridClass = columnsClass[columns] ?? columnsClass["3"];

  return (
    <div
      className="w-full py-12 px-6"
      style={{ backgroundColor }}
    >
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
      <div className={cn("grid gap-4", gridClass)}>
        {images.map((src, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg aspect-video bg-muted"
          >
            <img
              src={src}
              alt={`Gallery image ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery1;
