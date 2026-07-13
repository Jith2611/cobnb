import React from 'react';
import { Coffee, Trees, Tent, Castle, Palmtree, Waves, Mountain, Snowflake, Building2 } from 'lucide-react';
import './Categories.css';

const categories = [
  { label: 'Beachfront', icon: Waves },
  { label: 'Cabins', icon: Trees },
  { label: 'Trending', icon: Coffee },
  { label: 'Camping', icon: Tent },
  { label: 'Castles', icon: Castle },
  { label: 'Tropical', icon: Palmtree },
  { label: 'Amazing views', icon: Mountain },
  { label: 'Arctic', icon: Snowflake },
  { label: 'Design', icon: Building2 },
];

const Categories = () => {
  return (
    <div className="categories-wrapper">
      <div className="container categories-container">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div 
              key={index} 
              className={`category-item ${index === 0 ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span className="category-label">{category.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
