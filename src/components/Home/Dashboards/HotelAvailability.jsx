import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, Users, Bed, Info, Check, DollarSign, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ImageSlider = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div style={{ height: '220px', background: 'var(--color-bg-main)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bed size={48} color="var(--color-border)" />
      </div>
    );
  }

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div style={{ height: '220px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
      <div 
        onClick={() => onImageClick(images[currentIndex].image)}
        style={{
          width: '100%', height: '100%',
          backgroundImage: `url(${images[currentIndex].image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
          transition: 'background-image 0.3s ease-in-out'
        }}
      />
      
      {images.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0 }}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0 }}
          >
            <ChevronRight size={20} />
          </button>
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '12px' }}>
            <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{currentIndex + 1} / {images.length}</span>
          </div>
        </>
      )}
    </div>
  );
};

const HotelAvailability = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { hotelCode, apiKey, hotelName } = state;

  const [searchParams, setSearchParams] = useState({
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    number_adults: 1,
    number_children: 0,
    num_rooms: 1,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [amenitiesModalData, setAmenitiesModalData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const checkAvailability = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const { check_in_date, check_out_date, number_adults, number_children, num_rooms } = searchParams;
    const url = `/ezee-api/booking/reservation_api/listing.php?request_type=RoomList&HotelCode=${hotelCode}&APIKey=${apiKey}&check_in_date=${check_in_date}&check_out_date=${check_out_date}&number_adults=${number_adults}&number_children=${number_children}&num_rooms=${num_rooms}&property_configuration_info=0&showtax=1&show_only_available_rooms=1&language=en&packagefor=DESKTOP&promotionfor=DESKTOP`;

    try {
      const response = await axios.get(url);
      const data = response.data;
      
      if (Array.isArray(data) && data.length > 0 && data[0]['Error Details']) {
        setResults([]);
        setError(data[0]['Error Details'].Error_Message || 'An error occurred fetching availability.');
      } else if (Array.isArray(data)) {
        setResults(data);
      } else if (data && data[0]) {
        // Sometimes APIs wrap in object or array
        setResults(Array.isArray(data) ? data : [data]);
      } else {
        setResults([]);
        setError('No rooms available or invalid response format.');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to fetch availability. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelCode && apiKey) {
      checkAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelCode, apiKey]);

  if (!hotelCode || !apiKey) {
    return (
      <div style={{ minHeight: '100vh', padding: '100px 24px', textAlign: 'center' }}>
        <p>Invalid access. Please select a property from the Online Booking page.</p>
        <button onClick={() => navigate('/online-booking')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '100px 24px 60px', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} color="var(--color-text-main)" />
          </button>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', margin: 0, fontSize: '28px' }}>
              Check Availability
            </h2>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              {hotelName || 'Property'} (Code: {hotelCode})
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '40px', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={checkAvailability} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 150px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Check-in</label>
              <input type="date" name="check_in_date" value={searchParams.check_in_date} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 150px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Check-out</label>
              <input type="date" name="check_out_date" value={searchParams.check_out_date} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 100px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Adults</label>
              <input type="number" min="1" name="number_adults" value={searchParams.number_adults} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 100px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Children</label>
              <input type="number" min="0" name="number_children" value={searchParams.number_children} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 100px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Rooms</label>
              <input type="number" min="1" name="num_rooms" value={searchParams.num_rooms} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} required />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                {loading ? <div className="spinner-light" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <><Search size={18} /> Search Rooms</>}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {/* Hotel Overview (from the first result) */}
        {results.length > 0 && results[0].Hotel_amenitiesNew && (
          <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', margin: '0 0 16px 0', fontSize: '20px' }}>Property Highlights</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {results[0].Hotel_amenitiesNew.map((amenity, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--color-bg-main)', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>{amenity.amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
          {results.map((room, idx) => {
            const imageUrl = room.room_main_image || (Array.isArray(room.RoomImages) && room.RoomImages.length > 0 ? room.RoomImages[0].image : null);
            const amenities = Array.isArray(room.NewRoomAmenities) ? room.NewRoomAmenities : [];
            const price = room.room_rates_info?.totalprice_inclusive_all || room.room_rates_info?.rack_rate || 'N/A';
            const availableRooms = room.min_ava_rooms || 0;

            return (
              <div key={idx} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }}>
                
                {/* Room Image Slider */}
                <ImageSlider images={room.RoomImages} onImageClick={setFullScreenImage} />
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1, paddingRight: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-text-main)', margin: '0 0 6px 0', lineHeight: 1.3 }}>{room.Room_Name || room.Roomtype_Name}</h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0, fontWeight: 500 }}>{room.Roomtype_Short_code}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-accent)', fontFamily: 'var(--font-heading)' }}>
                        {room.currency_sign || 'RM'} {price}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Total Price</div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0', flex: 1 }}>
                    {room.Room_Description || 'No description available for this room.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', background: 'var(--color-bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500 }}>
                      <Users size={16} color="var(--color-text-muted)" /> Adults: {room.max_adult_occupancy || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500 }}>
                      <Users size={16} color="var(--color-text-muted)" /> Children: {room.max_child_occupancy || '0'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500, gridColumn: 'span 2' }}>
                      <Check size={16} color="#22c55e" /> Available: <strong style={{ color: availableRooms > 0 ? '#22c55e' : '#ef4444' }}>{availableRooms} Rooms</strong>
                    </div>
                  </div>

                  {amenities.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Room Amenities</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {amenities.slice(0, 5).map((amenityObj, i) => (
                          <span key={i} style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                            {amenityObj.amenity}
                          </span>
                        ))}
                        {amenities.length > 5 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setAmenitiesModalData({ name: room.Room_Name || room.Roomtype_Name, items: amenities }); }}
                            style={{ background: 'transparent', border: '1px solid var(--color-accent)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                          >
                            +{amenities.length - 5} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button style={{ width: '100%', padding: '14px', background: availableRooms > 0 ? 'var(--color-accent)' : 'var(--color-bg-main)', color: availableRooms > 0 ? '#fff' : 'var(--color-text-muted)', border: availableRooms > 0 ? 'none' : '1px solid var(--color-border)', borderRadius: '8px', fontWeight: '600', cursor: availableRooms > 0 ? 'pointer' : 'not-allowed', marginTop: '24px', transition: 'all 0.2s', textAlign: 'center' }}
                    disabled={availableRooms === 0}
                    onClick={() => {
                      if (availableRooms > 0) {
                        const start = new Date(searchParams.check_in_date);
                        const end = new Date(searchParams.check_out_date);
                        const nightCount = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
                        
                        navigate('/hotel-checkout', {
                          state: {
                            room: room,
                            hotelName: results[0]?.Hotel_amenitiesNew ? 'Skylon Residences' : 'Hotel', // or proper hotel name
                            checkInDate: searchParams.check_in_date,
                            checkOutDate: searchParams.check_out_date,
                            adults: searchParams.number_adults,
                            children: searchParams.number_children,
                            numRooms: searchParams.num_rooms,
                            nightCount: nightCount
                          }
                        });
                      }
                    }}
                    onMouseEnter={e => { if (availableRooms > 0) { e.currentTarget.style.transform = 'scale(1.02)'; } }}
                    onMouseLeave={e => { if (availableRooms > 0) { e.currentTarget.style.transform = 'scale(1)'; } }}>
                    {availableRooms > 0 ? 'Book Room' : 'Sold Out'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Fullscreen Image Modal */}
      {fullScreenImage && (
        <div 
          onClick={() => setFullScreenImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={32} />
          </button>
          <img 
            src={fullScreenImage} 
            alt="Fullscreen Room" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Amenities Modal */}
      {amenitiesModalData && (
        <div 
          onClick={() => setAmenitiesModalData(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ background: 'var(--color-bg-main)', width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', margin: 0, fontSize: '18px' }}>
                Amenities for {amenitiesModalData.name}
              </h3>
              <button 
                onClick={() => setAmenitiesModalData(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {amenitiesModalData.items.map((amenityObj, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '14px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                  {amenityObj.amenity}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default HotelAvailability;
