import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMapEvents, Popup } from 'react-leaflet';
import { Grid, TextField, Button, Alert } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

const { BaseLayer } = LayersControl;

const MyMap = ({ setFormData, searchCoordinates }) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
    if (searchCoordinates.lat && searchCoordinates.lng) {
      setSelectedPoint({ lat: searchCoordinates.lat, lng: searchCoordinates.lng });
    }
  }, [searchCoordinates]);

  const reverseGeocode = async (lat, lng) => {
    // Always update coordinates first, even if geocoding fails
    setFormData((prevData) => ({
      ...prevData,
      lat,
      lon: lng,
    }));

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || 'af85006391dc49f8b68717cb9c1d0e60';
      if (!apiKey) {
        console.warn('OpenCageData API key is not set. Location selected but address will need to be entered manually.');
        return;
      }
      
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
      );
      
      const data = response.data;
      if (data.results && data.results.length > 0) {
        const { formatted, components } = data.results[0];
        const city = components?.city || components?.town || components?.village || '';
        const address = formatted || '';

        setFormData((prevData) => ({
          ...prevData,
          adress: address || prevData.adress,
          ville: city || prevData.ville,
          lat,
          lon: lng,
        }));
      }
    } catch (error) {
      // Handle API errors gracefully - coordinates are already set above
      if (error.response?.status === 401) {
        console.warn('OpenCageData API key is invalid or expired. Location selected but address will need to be entered manually.');
      } else if (error.response?.status === 402) {
        console.warn('OpenCageData API quota exceeded. Location selected but address will need to be entered manually.');
      } else {
        console.warn('Geocoding service unavailable. Location selected but address will need to be entered manually.');
      }
      // Don't throw error - coordinates are already set, user can manually enter address
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setSelectedPoint({ lat, lng });
        reverseGeocode(lat, lng); // Call reverse geocoding when a point is clicked
      },
    });

    return selectedPoint ? (
      <Marker position={[selectedPoint.lat, selectedPoint.lng]}>
        <Popup>
          Selected Point: ({selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)})
        </Popup>
      </Marker>
    ) : null;
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      setErrors({ search: 'Please enter an address to search' });
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || 'af85006391dc49f8b68717cb9c1d0e60';
      if (!apiKey) {
        setErrors({ search: 'Geocoding API key is not configured. Please select location on map instead.' });
        return;
      }
      
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(searchAddress)}&key=${apiKey}`
      );
      
      const data = response.data;
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        setFormData((prevData) => ({
          ...prevData,
          lat,
          lon: lng,
          adress: searchAddress, // Use searched address
        }));
        setSelectedPoint({ lat, lng }); // Update map position
        setErrors({});
        setSearchAddress(''); // Clear search field
      } else {
        setErrors({ search: 'Address not found. Please try a different address or click on the map.' });
      }
    } catch (error) {
      // Provide helpful error messages based on error type
      if (error.response?.status === 401) {
        setErrors({ search: 'Geocoding API key is invalid. Please click on the map to select location instead.' });
      } else if (error.response?.status === 402) {
        setErrors({ search: 'Geocoding service quota exceeded. Please click on the map to select location instead.' });
      } else {
        setErrors({ search: 'Unable to search address. Please click on the map to select location instead.' });
      }
      console.warn('Geocoding search failed:', error.message);
    }
  };
  return (
    <div>
      {/* Input for address search */}
      <div>
  <Grid container spacing={2} alignItems="center">
    <Grid item xs={10} mb={2}>
      <TextField
        label="Search by Address"
        fullWidth
        value={searchAddress}
        onChange={(e) => setSearchAddress(e.target.value)}
      />
    </Grid>
    <Grid item xs={2} mb={2}>
      <Button variant="contained" onClick={handleSearch} fullWidth >
        Search
      </Button>
    </Grid>
  </Grid>
  {errors.search && (
    <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
      {errors.search}
    </Alert>
  )}
</div>


      {/* Map Component with LayersControl for switching views */}
      <MapContainer
        center={[31.7917, -7.0926]} // Default map center
        zoom={6}
        style={{ height: '400px', width: '100%' }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.opentopomap.org/copyright">OpenTopoMap</a> contributors'
            />
          </BaseLayer>
        </LayersControl>
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default MyMap;
