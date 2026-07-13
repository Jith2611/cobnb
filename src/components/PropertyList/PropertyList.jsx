import React from 'react';
import PropertyCard from '../PropertyCard/PropertyCard';
import './PropertyList.css';

const mockProperties = [
  {
    id: 1,
    location: 'Bali, Indonesia',
    title: 'Luxury Villa with Private Pool',
    date: 'Oct 15 - 22',
    price: 350,
    rating: 4.95,
    images: [
      'https://images.unsplash.com/photo-1570213489059-0aac6626cade?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613490908236-f72ba05e7303?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 2,
    location: 'Santorini, Greece',
    title: 'Cave House with Caldera View',
    date: 'Sep 10 - 15',
    price: 450,
    rating: 4.98,
    images: [
      'https://images.unsplash.com/photo-1601581875039-e899893d520c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 3,
    location: 'Swiss Alps, Switzerland',
    title: 'Modern Chalet near Ski Lifts',
    date: 'Dec 20 - 27',
    price: 600,
    rating: 4.85,
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 4,
    location: 'Malibu, California',
    title: 'Oceanfront Glass House',
    date: 'Nov 5 - 10',
    price: 850,
    rating: 4.99,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 5,
    location: 'Kyoto, Japan',
    title: 'Traditional Machiya',
    date: 'Apr 1 - 8',
    price: 250,
    rating: 4.92,
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 6,
    location: 'Tulum, Mexico',
    title: 'Eco-Friendly Treehouse',
    date: 'Jan 10 - 17',
    price: 320,
    rating: 4.88,
    images: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 7,
    location: 'Amalfi Coast, Italy',
    title: 'Cliffside Villa with Sea Views',
    date: 'May 15 - 22',
    price: 550,
    rating: 4.97,
    images: [
      'https://images.unsplash.com/photo-1583396954207-69530db804f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 8,
    location: 'Queenstown, New Zealand',
    title: 'Lakeside Alpine Retreat',
    date: 'Aug 5 - 12',
    price: 400,
    rating: 4.91,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c15e8222621?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-c6a4d1421013?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
  }
];

const PropertyList = () => {
  return (
    <div className="container property-list-container">
      <div className="property-grid">
        {mockProperties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
