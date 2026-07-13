import React, { useState } from 'react';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './PropertyCard.css';

const PropertyCard = ({ property }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <motion.div 
      className="property-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="card-image-container">
        <button className="favorite-btn">
          <Heart size={24} className="heart-icon" />
        </button>
        
        <div className="carousel">
          <img 
            src={property.images[currentImageIndex]} 
            alt={property.title} 
            className="property-image" 
          />
          
          {property.images.length > 1 && (
            <>
              <button className="carousel-btn prev" onClick={prevImage}>
                <ChevronLeft size={16} />
              </button>
              <button className="carousel-btn next" onClick={nextImage}>
                <ChevronRight size={16} />
              </button>
              
              <div className="dots">
                {property.images.map((_, index) => (
                  <span 
                    key={index} 
                    className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card-info">
        <div className="card-header">
          <h3 className="property-location">{property.location}</h3>
          <div className="property-rating">
            <Star size={14} className="star-icon" fill="currentColor" />
            <span>{property.rating}</span>
          </div>
        </div>
        <p className="property-title">{property.title}</p>
        <p className="property-date">{property.date}</p>
        <div className="property-price">
          <span className="price-amount">${property.price}</span> 
          <span className="price-unit">night</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
