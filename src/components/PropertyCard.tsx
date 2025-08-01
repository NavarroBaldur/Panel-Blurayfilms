import Image from "next/image";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  image: string;
  title: string;
  location: string;
  price: string;
  rating: number;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  image,
  title,
  location,
  price,
  rating,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48">
        <Image
          src={image}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-2">{location}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-gray-900">{price}</span>
          <span className="text-yellow-500 text-sm font-medium">
            ★ {rating.toFixed(1)}
          </span>
        </div>
        <Button className="w-full">View Details</Button>
      </div>
    </div>
  );
};

export default PropertyCard;