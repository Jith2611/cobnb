import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import zohoAxios from '../../../utility/axiosInstance';
import { ArrowLeft, Search, Users, Bed, Check, ChevronLeft, ChevronRight, X, Sparkles, Building2, AlertCircle } from 'lucide-react';

const ImageSlider = ({ images, mobileAppImage, hotelImage, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const fallback = mobileAppImage || hotelImage || '';

  // Extract valid image URLs from images array
  const validImages = Array.isArray(images)
    ? images.map(img => img?.image || (typeof img === 'string' ? img : '')).filter(url => Boolean(url && typeof url === 'string' && url.trim()))
    : [];

  const effectiveImages = validImages.length > 0 ? validImages : (fallback ? [fallback] : []);
  const safeIndex = currentIndex < effectiveImages.length ? currentIndex : 0;
  const currentImg = effectiveImages[safeIndex] || fallback || '';

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === effectiveImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? effectiveImages.length - 1 : prev - 1));
  };

  return (
    <div
      onClick={() => onImageClick && onImageClick(effectiveImages, safeIndex)}
      style={{
        height: '220px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        background: 'var(--color-bg-secondary)'
      }}
    >
      <img
        src={currentImg || fallback}
        alt="Room"
        loading="lazy"
        onError={(e) => {
          if (fallback && e.target.src !== fallback) {
            e.target.src = fallback;
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.4s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      />

      {effectiveImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0, zIndex: 2 }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0, zIndex: 2 }}
          >
            <ChevronRight size={20} />
          </button>
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: '12px', zIndex: 2 }}>
            <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{safeIndex + 1} / {effectiveImages.length}</span>
          </div>
        </>
      )}
    </div>
  );
};

const HotelAvailability = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state or restore from sessionStorage
  const navState = location.state || {};
  const [savedHotelInfo, setSavedHotelInfo] = useState(() => {
    if (navState.hotelCode && navState.apiKey) {
      const info = {
        hotelCode: navState.hotelCode,
        apiKey: navState.apiKey,
        hotelName: navState.hotelName || '',
        buildingImage: navState.buildingImage || '',
        buildingId: navState.buildingId || ''
      };
      try {
        sessionStorage.setItem('cobnb_hotel_selection', JSON.stringify(info));
      } catch (e) {
        /* ignore */
      }
      return info;
    }
    try {
      const stored = sessionStorage.getItem('cobnb_hotel_selection');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      /* ignore */
    }
    return {};
  });

  const { hotelCode, apiKey, hotelName, buildingImage, buildingId } = savedHotelInfo;

  // Search parameters
  const [searchParams, setSearchParams] = useState(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return {
      check_in_date: today.toISOString().split('T')[0],
      check_out_date: tomorrow.toISOString().split('T')[0],
      number_adults: 1,
      number_children: 0,
      num_rooms: 1,
    };
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [propertyHighlights, setPropertyHighlights] = useState([]);
  const [error, setError] = useState(null);
  const [previewGallery, setPreviewGallery] = useState(null);
  const [previewImageLoading, setPreviewImageLoading] = useState(true);
  const [effectiveHotelImage, setEffectiveHotelImage] = useState(
    buildingImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
  );
  const [amenitiesModalData, setAmenitiesModalData] = useState(null);
  const [unitImagesData, setUnitImagesData] = useState([]);

  const handleOpenPreview = (images, index, title) => {
    if (!images || images.length === 0) {
      if (effectiveHotelImage) {
        images = [{ image: effectiveHotelImage }];
      } else {
        return;
      }
    }
    const formatted = images.map(img => img?.image || (typeof img === 'string' ? img : '')).filter(Boolean);
    if (formatted.length === 0 && effectiveHotelImage) {
      formatted.push(effectiveHotelImage);
    }
    setPreviewImageLoading(true);
    setPreviewGallery({
      images: formatted,
      index: typeof index === 'number' && index < formatted.length ? index : 0,
      title: title || ''
    });
  };

  const handleNextPreview = (e) => {
    if (e) e.stopPropagation();
    setPreviewGallery(prev => {
      if (!prev || !prev.images || prev.images.length <= 1) return prev;
      setPreviewImageLoading(true);
      return {
        ...prev,
        index: prev.index === prev.images.length - 1 ? 0 : prev.index + 1
      };
    });
  };

  const handlePrevPreview = (e) => {
    if (e) e.stopPropagation();
    setPreviewGallery(prev => {
      if (!prev || !prev.images || prev.images.length <= 1) return prev;
      setPreviewImageLoading(true);
      return {
        ...prev,
        index: prev.index === 0 ? prev.images.length - 1 : prev.index - 1
      };
    });
  };

  // Preload adjacent images in preview gallery so switching slides is instant
  useEffect(() => {
    if (!previewGallery || !previewGallery.images || previewGallery.images.length <= 1) return;
    const { images, index } = previewGallery;
    const nextIdx = (index + 1) % images.length;
    const prevIdx = (index - 1 + images.length) % images.length;

    if (images[nextIdx]) {
      const imgNext = new Image();
      imgNext.src = images[nextIdx];
    }
    if (images[prevIdx]) {
      const imgPrev = new Image();
      imgPrev.src = images[prevIdx];
    }
  }, [previewGallery]);

  // Preload first images of rooms in background
  useEffect(() => {
    if (Array.isArray(results) && results.length > 0) {
      results.slice(0, 10).forEach(r => {
        const firstImg = r.RoomImages?.[0]?.image || r.RoomImages?.[0] || r.room_main_image;
        if (firstImg) {
          const img = new Image();
          img.src = firstImg;
        }
      });
    }
  }, [results]);

  // Keyboard navigation for image preview
  useEffect(() => {
    if (!previewGallery) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNextPreview();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPreview();
      } else if (e.key === 'Escape') {
        setPreviewGallery(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewGallery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const checkAvailability = async (e) => {
    if (e) e.preventDefault();
    if (!hotelCode || !apiKey) return;

    setLoading(true);
    setError(null);

    const { check_in_date, check_out_date, number_adults, number_children, num_rooms } = searchParams;
    const ezeeUrl = `/ezee-api/booking/reservation_api/listing.php?request_type=RoomList&HotelCode=${hotelCode}&APIKey=${apiKey}&check_in_date=${check_in_date}&check_out_date=${check_out_date}&number_adults=${number_adults}&number_children=${number_children}&num_rooms=${num_rooms}&property_configuration_info=0&showtax=1&show_only_available_rooms=1&language=en&packagefor=DESKTOP&promotionfor=DESKTOP`;
    const zohoReportUrl = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Room_Type_Mapping_Report`;
    const buildingReportUrl = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/All_Building_Report?Active=Active`;

    try {
      // Fetch eZee (availability & price), Zoho room mapping, and Zoho building report concurrently
      const [ezeeRes, zohoRes, buildingRes] = await Promise.allSettled([
        axios.get(ezeeUrl),
        zohoAxios.get(zohoReportUrl),
        zohoAxios.get(buildingReportUrl)
      ]);

      // Resolve Mobile App Image from All_Building_Report or navigation state
      let mobileAppImage = buildingImage || '';
      if (buildingRes.status === 'fulfilled' && Array.isArray(buildingRes.value?.data?.data)) {
        const allBuildings = buildingRes.value.data.data;
        const currentB = allBuildings.find(b =>
          (buildingId && String(b.ID) === String(buildingId)) ||
          (hotelCode && String(b.Ezee_Hotel_ID).trim() === String(hotelCode).trim()) ||
          (hotelName && b.Building_Name && (
            b.Building_Name.toLowerCase().includes(hotelName.toLowerCase()) ||
            hotelName.toLowerCase().includes(b.Building_Name.toLowerCase())
          ))
        );
        if (currentB?.Mobile_App_Image) {
          const imgVal = currentB.Mobile_App_Image.url || currentB.Mobile_App_Image.value || (typeof currentB.Mobile_App_Image === 'string' ? currentB.Mobile_App_Image : '');
          if (imgVal) mobileAppImage = imgVal;
        }
      }
      if (!mobileAppImage) {
        mobileAppImage = buildingImage || effectiveHotelImage;
      }
      setEffectiveHotelImage(mobileAppImage);
      try {
        const currentStored = JSON.parse(sessionStorage.getItem('cobnb_hotel_selection') || '{}');
        sessionStorage.setItem('cobnb_hotel_selection', JSON.stringify({ ...currentStored, buildingImage: mobileAppImage }));
      } catch (_) {}

      // Parse eZee data
      let ezeeRooms = [];
      if (ezeeRes.status === 'fulfilled' && ezeeRes.value?.data) {
        const d = ezeeRes.value.data;
        if (Array.isArray(d)) {
          if (d.length > 0 && d[0]['Error Details']) {
            console.warn('[eZee] Error Details:', d[0]['Error Details']);
          } else {
            ezeeRooms = d;
          }
        } else if (d && !d.Errors) {
          ezeeRooms = [d];
        }
      } else if (ezeeRes.status === 'rejected') {
        console.error('[eZee] Fetch error:', ezeeRes.reason);
      }

      // Pull and log all rate plans from eZee to console
      if (ezeeRooms.length > 0) {
        const ratePlans = ezeeRooms.map((item, idx) => {
          const planName = item.Package_Name || (item.Room_Name && item.Room_Name !== item.Roomtype_Name ? item.Room_Name : 'Standard Rate');
          return {
            '#': idx + 1,
            'Rate Plan Name': planName,
            'Room Name': item.Room_Name || '',
            'Room Type': item.Roomtype_Name || '',
            'Package Name': item.Package_Name || 'None',
            'Promotion': item.Promotion_Name && item.Promotion_Name !== 'null' ? item.Promotion_Name : 'None',
            'Price': `${item.currency_sign || 'RM'} ${item.room_rates_info?.totalprice_inclusive_all || item.room_rates_info?.rack_rate || 'N/A'}`,
            'Rate Type ID': item.ratetypeunkid || '',
            'Room Rate ID': item.roomrateunkid || '',
            'Room Type ID': item.roomtypeunkid || ''
          };
        });

        const uniqueRatePlanNames = [...new Set(ratePlans.map(r => r['Rate Plan Name']).filter(Boolean))];

        console.group('%c🏨 eZee Rate Plans', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
        console.log('%cRate Plan Names (' + uniqueRatePlanNames.length + ' unique):', 'color: #10b981; font-weight: bold;', uniqueRatePlanNames);
        console.table(ratePlans);
        console.log('Raw eZee room data:', ezeeRooms);
        console.groupEnd();
      }

      // Parse Zoho Creator Room_Type_Mapping_Report
      let zohoMappings = [];
      if (zohoRes.status === 'fulfilled' && zohoRes.value?.data?.data) {
        const allMappings = zohoRes.value.data.data;

        // Filter mappings relevant to this building/hotel:
        // 1. Match by Building_Name.ID
        // 2. Match by Ezee_Room_Type_ID starting with hotelCode
        // 3. Match by Building_Name display_value containing hotelName
        zohoMappings = allMappings.filter(item => {
          if (buildingId && String(item['Building_Name.ID']) === String(buildingId)) {
            return true;
          }
          if (item?.Building_Name && typeof item.Building_Name === 'object' && buildingId && String(item.Building_Name.ID) === String(buildingId)) {
            return true;
          }
          if (hotelCode && item.Ezee_Room_Type_ID && String(item.Ezee_Room_Type_ID).startsWith(String(hotelCode))) {
            return true;
          }
          if (hotelName && item.Building_Name) {
            const bName = typeof item.Building_Name === 'object' ? item.Building_Name.display_value : String(item.Building_Name);
            if (bName && bName.toLowerCase().includes(hotelName.toLowerCase())) {
              return true;
            }
          }
          return false;
        });
      } else if (zohoRes.status === 'rejected') {
        console.error('[Zoho] Room_Type_Mapping_Report fetch error:', zohoRes.reason);
      }

      // Extract Property Highlights strictly from Zoho Creator mapping records (never from eZee)
      const allZohoAmenities = [...new Set(
        zohoMappings.flatMap(z => {
          const raw = z['Amenities.Aminities'] || z.Amenities || z.Aminities || '';
          return typeof raw === 'string' ? raw.split(/[,;\n]/).map(a => a.trim()).filter(Boolean) : [];
        })
      )].map(a => ({ amenity: a }));
      setPropertyHighlights(allZohoAmenities);

      // ── Fetch Unit_Images_by_Building_by_Room_Type_Report filtered by Building_Name.ID ──
      // Extract the Building ID from the Room_Type_Mapping_Report response
      const matchedMapping = zohoMappings[0];
      const mappingBuildingId = matchedMapping?.['Building_Name.ID']
        || (typeof matchedMapping?.Building_Name === 'object' ? matchedMapping?.Building_Name?.ID : null)
        || buildingId
        || matchedMapping?.ID;

      console.group('%c🏢 [Room_Type_Mapping_Report] Matched Building ID', 'color: #3b82f6; font-size: 13px; font-weight: bold;');
      console.log('Matched Record from Room_Type_Mapping_Report:', matchedMapping);
      console.log('Extracted Building_Name.ID:', mappingBuildingId);
      console.groupEnd();

      let buildingUnitImages = [];
      if (mappingBuildingId) {
        try {
          const unitImagesUrl = `/zoho-api/api/v2/brandontan18/housekeeping-system/report/Unit_Images_by_Building_by_Room_Type_Report?Building_Name.ID=${mappingBuildingId}`;
          console.log(`📡 [HotelAvailability] Calling: report/Unit_Images_by_Building_by_Room_Type_Report?Building_Name.ID=${mappingBuildingId}`);
          const unitImagesRes = await zohoAxios.get(unitImagesUrl);
          buildingUnitImages = Array.isArray(unitImagesRes?.data?.data) ? unitImagesRes.data.data : [];
          console.group('%c📸 [Unit_Images_by_Building_by_Room_Type_Report] Filtered Data', 'color: #10b981; font-size: 14px; font-weight: bold;');
          console.log('Query Parameter Building_Name.ID:', mappingBuildingId);
          console.log('API URL:', unitImagesUrl);
          console.log('Full Axios Response:', unitImagesRes);
          console.log('Response Data (data):', unitImagesRes?.data);
          console.log('Unit Images Records (data.data):', buildingUnitImages);
          if (buildingUnitImages.length > 0) {
            console.log(`Total Unit Images Count: ${buildingUnitImages.length}`);
            console.log('Sample Unit Image Record:', buildingUnitImages[0]);
          }
          console.groupEnd();
          setUnitImagesData(buildingUnitImages);
        } catch (unitErr) {
          console.group('%c❌ [Unit_Images_by_Building_by_Room_Type_Report] Filtered Error', 'color: #ef4444; font-size: 14px; font-weight: bold;');
          console.error('Error fetching filtered unit images:', unitErr);
          console.groupEnd();
        }
      }

      // Now combine the rooms:
      // Show room information from Zoho Creator report/Room_Type_Mapping_Report,
      // and only pull room availability and price from eZee!
      let combinedRooms = [];

      if (zohoMappings.length > 0) {
        // Base room list is determined by Zoho Creator mapping records
        combinedRooms = await Promise.all(zohoMappings.map(async (zRoom) => {
          // Find matching eZee room entry for availability and price
          const matchedEzee = ezeeRooms.find(e => {
            const idMatch = zRoom.Ezee_Room_Type_ID && String(e.roomtypeunkid) === String(zRoom.Ezee_Room_Type_ID);
            const nameMatch = zRoom.Ezee_Room_Type && e.Roomtype_Name && e.Roomtype_Name.trim().toLowerCase() === zRoom.Ezee_Room_Type.trim().toLowerCase();
            return idMatch || nameMatch;
          });

          // 1. Availability from eZee
          const availableRooms = matchedEzee ? (Number(matchedEzee.min_ava_rooms) || 0) : 0;

          // 2. Price from eZee
          const price = matchedEzee?.room_rates_info?.totalprice_inclusive_all || matchedEzee?.room_rates_info?.rack_rate || null;
          const currencySign = matchedEzee?.currency_sign || 'RM';

          // 3. Room Information strictly from Zoho Creator:
          // Title / Room Name from Zoho
          const roomName = zRoom.Title?.trim() || zRoom.Room_Type?.trim() || zRoom.Ezee_Room_Type?.trim() || matchedEzee?.Roomtype_Name || 'CoBnb Suite';
          const roomCategory = zRoom.Room_Type?.trim() || '';
          const roomCode = zRoom.Ezee_Room_Type?.trim() || matchedEzee?.Roomtype_Short_code || '';

          // Description from Zoho
          const roomDescription = zRoom.Description?.trim() || (matchedEzee?.Room_Description || 'Comfortable and elegantly appointed accommodation designed with contemporary furnishings and modern essentials.');

          // Amenities strictly from Zoho Creator (Amenities.Aminities) - never from eZee
          const zohoAmenitiesRaw = zRoom['Amenities.Aminities'] || zRoom.Amenities || zRoom.Aminities || '';
          let amenities = [];
          if (Array.isArray(zohoAmenitiesRaw)) {
            amenities = zohoAmenitiesRaw.map(a => ({
              amenity: typeof a === 'object' ? (a.amenity || a.name || a.display_value || '') : String(a).trim()
            })).filter(a => Boolean(a.amenity));
          } else if (typeof zohoAmenitiesRaw === 'string' && zohoAmenitiesRaw.trim()) {
            amenities = zohoAmenitiesRaw
              .split(/[,;\n]/)
              .map(a => a.trim())
              .filter(Boolean)
              .map(a => ({ amenity: a }));
          } else if (zohoAmenitiesRaw && typeof zohoAmenitiesRaw === 'object') {
            const val = zohoAmenitiesRaw.Aminities || zohoAmenitiesRaw.display_value || zohoAmenitiesRaw.value || '';
            if (typeof val === 'string' && val.trim()) {
              amenities = val.split(/[,;\n]/).map(a => a.trim()).filter(Boolean).map(a => ({ amenity: a }));
            }
          }

          // Images strictly from Zoho Creator Unit_Images_by_Building_by_Room_Type_Report - never from eZee
          const matchedUnitImages = buildingUnitImages.filter(img => {
            const imgRoomTypeId = img['Ezee_Room_Type.ID'] || img?.Ezee_Room_Type?.ID || (typeof img.Ezee_Room_Type === 'string' ? img.Ezee_Room_Type : '');
            const imgRoomTypeName = img?.Ezee_Room_Type?.display_value || (typeof img.Ezee_Room_Type === 'string' ? img.Ezee_Room_Type : '');

            // 1. Match by Zoho Room Type record ID
            if (imgRoomTypeId && String(imgRoomTypeId).trim() === String(zRoom.ID).trim()) {
              return true;
            }
            // 2. Match by eZee Room Type ID
            if (imgRoomTypeId && zRoom.Ezee_Room_Type_ID && String(imgRoomTypeId).trim() === String(zRoom.Ezee_Room_Type_ID).trim()) {
              return true;
            }
            // 3. Match by name
            if (imgRoomTypeName && zRoom.Ezee_Room_Type && imgRoomTypeName.trim().toLowerCase() === zRoom.Ezee_Room_Type.trim().toLowerCase()) {
              return true;
            }
            if (imgRoomTypeName && zRoom.Room_Type && imgRoomTypeName.trim().toLowerCase() === zRoom.Room_Type.trim().toLowerCase()) {
              return true;
            }
            if (imgRoomTypeName && zRoom.Title && imgRoomTypeName.trim().toLowerCase() === zRoom.Title.trim().toLowerCase()) {
              return true;
            }
            return false;
          });

          let roomImages = matchedUnitImages.map(img => {
            let imageName = '';
            const rawImg = img?.Image;
            if (typeof rawImg === 'string') {
              if (rawImg.includes('filepath=')) {
                imageName = rawImg.split('filepath=')[1].split('&')[0];
              } else {
                imageName = rawImg.split('/').pop().split('?')[0];
              }
            } else if (rawImg?.url) {
              if (rawImg.url.includes('filepath=')) {
                imageName = rawImg.url.split('filepath=')[1].split('&')[0];
              } else {
                imageName = rawImg.url.split('/').pop().split('?')[0];
              }
            }
            if (imageName.startsWith('/')) {
              imageName = imageName.substring(1);
            }
            // Public image link format:
            // "https://creatorapp.zohopublic.com/file" + zoho.appuri + "Unit_Images_by_Building_by_Room_Type_Report/" + img.ID + "/Image/image-download/AeFrT9vBX78Rh15vHXTq23ntJ1bZpAfjFK2XAfGqVQhSjxRar4b9TSyJCk1mDbjSmT8h4Pjgun29bnGyvskBv7TYGSD6DS6dUd27?filepath=/" + image_name
            const public_image_link = `https://creatorapp.zohopublic.com/file/brandontan18/housekeeping-system/Unit_Images_by_Building_by_Room_Type_Report/${img.ID}/Image/image-download/AeFrT9vBX78Rh15vHXTq23ntJ1bZpAfjFK2XAfGqVQhSjxRar4b9TSyJCk1mDbjSmT8h4Pjgun29bnGyvskBv7TYGSD6DS6dUd27?filepath=/${imageName}`;
            return {
              image: public_image_link,
              id: img.ID,
              name: imageName
            };
          });

          // Fallback to building image from Zoho All_Building_Report if no unit images exist for this room
          if (roomImages.length === 0 && mobileAppImage) {
            roomImages = [{ image: mobileAppImage }];
          } else if (roomImages.length === 0 && effectiveHotelImage) {
            roomImages = [{ image: effectiveHotelImage }];
          }

          // Occupancy info (eZee occupancy or estimated based on room type)
          let adults = matchedEzee?.max_adult_occupancy || matchedEzee?.Room_Max_adult;
          let children = matchedEzee?.max_child_occupancy || matchedEzee?.Room_Max_child || 0;
          if (!adults) {
            const rtLower = roomCategory.toLowerCase();
            if (rtLower.includes('3 bed')) adults = 6;
            else if (rtLower.includes('2 bed')) adults = 4;
            else if (rtLower.includes('1 bed') || rtLower.includes('studio')) adults = 2;
            else adults = 2;
          }

          return {
            zohoId: zRoom.ID,
            Room_Name: roomName,
            Roomtype_Name: roomName,
            Roomtype_Short_code: roomCode,
            Room_Description: roomDescription,
            Room_Type: roomCategory,
            RoomImages: roomImages,
            room_main_image: roomImages[0]?.image || mobileAppImage,
            NewRoomAmenities: amenities,
            min_ava_rooms: availableRooms,
            price: price,
            currency_sign: currencySign,
            max_adult_occupancy: adults,
            max_child_occupancy: children,
            room_rates_info: matchedEzee?.room_rates_info || (price ? { totalprice_inclusive_all: price } : null),
            rawZoho: zRoom,
            rawEzee: matchedEzee
          };
        }));
      } else if (ezeeRooms.length > 0) {
        // Fallback: If no Zoho mappings found for this property, show eZee rooms (without eZee images/amenities)
        combinedRooms = ezeeRooms.map((room) => {
          let roomImages = [];
          if (mobileAppImage) {
            roomImages = [{ image: mobileAppImage }];
          } else if (effectiveHotelImage) {
            roomImages = [{ image: effectiveHotelImage }];
          }
          return {
            ...room,
            RoomImages: roomImages,
            room_main_image: roomImages[0]?.image || mobileAppImage,
            NewRoomAmenities: [],
            price: room.room_rates_info?.totalprice_inclusive_all || room.room_rates_info?.rack_rate || null
          };
        });
      }

      // Sort: Rooms that are available and have price show first
      combinedRooms.sort((a, b) => {
        const aAvail = (Number(a.min_ava_rooms) || 0) > 0;
        const bAvail = (Number(b.min_ava_rooms) || 0) > 0;
        const aHasPrice = a.price !== null && a.price !== undefined && parseFloat(a.price) > 0;
        const bHasPrice = b.price !== null && b.price !== undefined && parseFloat(b.price) > 0;

        // Rank 3: Both available and has price
        // Rank 2: Available
        // Rank 1: Has price
        // Rank 0: Unavailable / No price
        const aRank = (aAvail && aHasPrice) ? 3 : (aAvail ? 2 : (aHasPrice ? 1 : 0));
        const bRank = (bAvail && bHasPrice) ? 3 : (bAvail ? 2 : (bHasPrice ? 1 : 0));

        if (aRank !== bRank) {
          return bRank - aRank;
        }

        // If both have prices, sort by lowest price first
        if (aHasPrice && bHasPrice) {
          return parseFloat(a.price) - parseFloat(b.price);
        }

        return 0;
      });

      setResults(combinedRooms);

      if (combinedRooms.length === 0) {
        setError('No rooms available for the selected dates and guest count.');
      }
    } catch (err) {
      console.error('Error fetching room availability:', err);
      setError('Failed to fetch room information and availability: ' + (err.message || ''));
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
      <div style={{ minHeight: '100vh', padding: '120px 24px', textAlign: 'center', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: 'var(--color-bg-secondary)', padding: '36px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <AlertCircle size={48} color="var(--color-accent)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 12px 0', fontSize: '22px' }}>No Hotel Selected</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            Please select a property from the Online Booking page to check live availability and room information.
          </p>
          <button
            onClick={() => navigate('/online-booking')}
            style={{ width: '100%', padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Go to Online Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '100px 24px 60px', position: 'relative', background: 'var(--color-bg-main)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Navigation / Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/online-booking')}
              style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '10px', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              title="Back to Online Booking"
            >
              <ArrowLeft size={20} color="var(--color-text-main)" />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building2 size={16} color="var(--color-accent)" />
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-accent)' }}>Live Room Availability</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', margin: 0, fontSize: '26px', fontWeight: 800 }}>
                {hotelName || 'Property Rooms'}
              </h2>
              {/* <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0', fontSize: '13px' }}>
                eZee Hotel Code: {hotelCode}
              </p> */}
            </div>
          </div>

          <button
            onClick={() => navigate('/online-booking')}
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Change Property
          </button>
        </div>

        {/* Search Parameters Form */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '36px', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={checkAvailability} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 155px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-in</label>
              <input
                type="date"
                name="check_in_date"
                value={searchParams.check_in_date}
                onChange={handleInputChange}
                onClick={(e) => { try { e.target.showPicker(); } catch (_) {} }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-main)',
                  color: 'var(--color-text-main)',
                  outline: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 155px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-out</label>
              <input
                type="date"
                name="check_out_date"
                value={searchParams.check_out_date}
                onChange={handleInputChange}
                onClick={(e) => { try { e.target.showPicker(); } catch (_) {} }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-main)',
                  color: 'var(--color-text-main)',
                  outline: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 90px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adults</label>
              <input type="number" min="1" name="number_adults" value={searchParams.number_adults} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)', outline: 'none' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 90px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Children</label>
              <input type="number" min="0" name="number_children" value={searchParams.number_children} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)', outline: 'none' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 90px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rooms</label>
              <input type="number" min="1" name="num_rooms" value={searchParams.num_rooms} onChange={handleInputChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)', outline: 'none' }} required />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
              >
                {loading ? (
                  <div className="spinner-light" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <Search size={18} /> Search Rates
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Property Highlights */}
        {propertyHighlights.length > 0 && (
          <div style={{ background: 'var(--color-bg-secondary)', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} color="var(--color-accent)" />
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', margin: 0, fontSize: '17px', fontWeight: 700 }}>Property Highlights</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {propertyHighlights.map((amenity, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'var(--color-bg-main)', borderRadius: '20px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-main)' }}>
                  <span>{amenity.amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {results.map((room, idx) => {
            const amenities = Array.isArray(room.NewRoomAmenities) ? room.NewRoomAmenities : [];
            const price = room.price;
            const availableRooms = Number(room.min_ava_rooms) || 0;
            const isAvailable = availableRooms > 0;

            return (
              <div
                key={room.zohoId || idx}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Room Image Carousel */}
                <ImageSlider
                  images={room.RoomImages}
                  mobileAppImage={effectiveHotelImage}
                  hotelImage={effectiveHotelImage}
                  onImageClick={(imgs, index) => handleOpenPreview(imgs && imgs.length > 0 ? imgs : [{ image: effectiveHotelImage }], index, room.Room_Name || room.Roomtype_Name)}
                />

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Category badge */}
                  {room.Room_Type && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '3px 10px', borderRadius: '12px' }}>
                        {room.Room_Type}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-text-main)', margin: '0 0 4px 0', lineHeight: 1.3, fontWeight: 700 }}>
                        {room.Roomtype_Short_code}
                      </h3>
                      {room.Roomtype_Short_code && (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: 0, fontWeight: 500 }}>

                          {room.Room_Name || room.Roomtype_Name}
                        </p>
                      )}
                    </div>

                    {/* Live Price from eZee */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-accent)', fontFamily: 'var(--font-heading)' }}>
                        {price ? `${room.currency_sign || 'RM'} ${price}` : 'Price on request'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>
                        {price ? 'Total Price' : 'Rates'}
                      </div>
                    </div>
                  </div>

                  {/* Description from Zoho */}
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px 0', flex: 1 }}>
                    {room.Room_Description}
                  </p>

                  {/* Room Key Stats (Availability from eZee) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: 'var(--color-bg-main)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500 }}>
                      <Users size={16} color="var(--color-text-muted)" /> Adults: {room.max_adult_occupancy || '2'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500 }}>
                      <Users size={16} color="var(--color-text-muted)" /> Children: {room.max_child_occupancy || '0'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px', fontWeight: 500, gridColumn: 'span 2' }}>
                      <Check size={16} color={isAvailable ? '#22c55e' : '#ef4444'} />
                      <span>Availability: </span>
                      <strong style={{ color: isAvailable ? '#22c55e' : '#ef4444' }}>
                        {isAvailable ? `${availableRooms} Room${availableRooms > 1 ? 's' : ''} Left` : 'Sold Out for Dates'}
                      </strong>
                    </div>
                  </div>

                  {/* Amenities from Zoho Creator */}
                  {amenities.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Room Amenities ({amenities.length})
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {amenities.slice(0, 4).map((amenityObj, i) => (
                          <span key={i} style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                            {amenityObj.amenity}
                          </span>
                        ))}
                        {amenities.length > 4 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setAmenitiesModalData({ name: room.Room_Name, items: amenities }); }}
                            style={{ background: 'transparent', border: '1px solid var(--color-accent)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            +{amenities.length - 4} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: isAvailable ? 'var(--color-accent)' : 'var(--color-bg-main)',
                      color: isAvailable ? '#fff' : 'var(--color-text-muted)',
                      border: isAvailable ? 'none' : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      marginTop: '20px',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    disabled={!isAvailable}
                    onClick={() => {
                      if (isAvailable) {
                        const start = new Date(searchParams.check_in_date);
                        const end = new Date(searchParams.check_out_date);
                        const nightCount = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

                        navigate('/hotel-checkout', {
                          state: {
                            room: {
                              ...room,
                              Room_Name: room.Room_Name,
                              Roomtype_Name: room.Roomtype_Name,
                              room_main_image: room.room_main_image,
                              RoomImages: room.RoomImages,
                              room_rates_info: room.room_rates_info || { totalprice_inclusive_all: price },
                              currency_sign: room.currency_sign
                            },
                            hotelName: hotelName || 'Hotel',
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
                  >
                    {isAvailable ? 'Book Room' : 'Sold Out'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Image Preview Modal with Left/Right Arrows */}
      {previewGallery && previewGallery.images && previewGallery.images.length > 0 && (
        <div
          onClick={() => setPreviewGallery(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewGallery(null);
            }}
            title="Close Preview (Esc)"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              zIndex: 10001,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            <X size={24} />
          </button>

          {/* Title on top */}
          {previewGallery.title && (
            <div
              style={{
                position: 'absolute',
                top: '28px',
                left: '32px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                zIndex: 10001
              }}
            >
              {previewGallery.title}
            </div>
          )}

          {/* Left Arrow Button */}
          {previewGallery.images.length > 1 && (
            <button
              type="button"
              onClick={handlePrevPreview}
              title="Previous Image (Left Arrow)"
              style={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '50%',
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                zIndex: 10001,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                transition: 'transform 0.2s, background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Preview Image Container with Spinner */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '88vw',
              maxHeight: '84vh',
              minWidth: '300px',
              minHeight: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default'
            }}
          >
            {/* High-Resolution Image Loading State */}
            {previewImageLoading && (
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  zIndex: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: '#38bdf8',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Loading image...
                </span>
              </div>
            )}

            <img
              key={previewGallery.images[previewGallery.index]}
              src={previewGallery.images[previewGallery.index] || effectiveHotelImage}
              alt={previewGallery.title || `Room view ${previewGallery.index + 1}`}
              onLoad={() => setPreviewImageLoading(false)}
              onError={(e) => {
                setPreviewImageLoading(false);
                if (effectiveHotelImage && e.target.src !== effectiveHotelImage) {
                  e.target.src = effectiveHotelImage;
                }
              }}
              style={{
                maxWidth: '88vw',
                maxHeight: '84vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                userSelect: 'none',
                opacity: previewImageLoading ? 0.35 : 1,
                transform: previewImageLoading ? 'scale(0.98)' : 'scale(1)',
                transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
              }}
            />
          </div>

          {/* Right Arrow Button */}
          {previewGallery.images.length > 1 && (
            <button
              type="button"
              onClick={handleNextPreview}
              title="Next Image (Right Arrow)"
              style={{
                position: 'absolute',
                right: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '50%',
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                zIndex: 10001,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                transition: 'transform 0.2s, background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Counter at Bottom */}
          {previewGallery.images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '6px 16px',
                borderRadius: '20px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                letterSpacing: '0.5px'
              }}
            >
              {previewGallery.index + 1} / {previewGallery.images.length}
            </div>
          )}
        </div>
      )}

      {/* Amenities Modal */}
      {amenitiesModalData && (
        <div
          onClick={() => setAmenitiesModalData(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-bg-main)', width: '90%', maxWidth: '540px', maxHeight: '80vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid var(--color-border)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  Room Amenities
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {amenitiesModalData.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAmenitiesModalData(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {amenitiesModalData.items.map((amenityObj, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '13px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  <span>{amenityObj.amenity}</span>
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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        input[type="date"] {
          color-scheme: light dark;
        }
        [data-theme='dark'] input[type="date"] {
          color-scheme: dark !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.85;
          transition: opacity 0.2s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        [data-theme='dark'] input[type="date"]::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          opacity: 0.95 !important;
        }
      `}} />
    </div>
  );
};

export default HotelAvailability;
