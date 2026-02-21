'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent() {
    // Default center (London coordinates as example)
    const defaultCenter: [number, number] = [51.5074, -0.1278];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
        </MapContainer>
    );
}
