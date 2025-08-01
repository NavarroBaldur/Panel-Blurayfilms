import PropertyCard from "./PropertyCard";

interface Property {
  id: string;
  image: string;
  title: string;
  location: string;
  price: string;
  rating: number;
}

interface PropertyGridProps {
  properties: Property[];
}

const PropertyGrid: React.FC<PropertyGridProps> = ({ properties }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          image={property.image}
          title={property.title}
          location={property.location}
          price={property.price}
          rating={property.rating}
        />
      ))}
    </div>
  );
};

export default PropertyGrid;