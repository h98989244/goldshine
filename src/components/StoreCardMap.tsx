import { useEffect, useRef } from 'react'

interface StoreCardMapProps {
    latitude: number | null
    longitude: number | null
    storeName: string
}

export default function StoreCardMap({ latitude, longitude, storeName }: StoreCardMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!mapRef.current || !window.google || !latitude || !longitude) return

        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: latitude, lng: longitude },
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'none',
        })

        new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map,
            title: storeName,
        })
    }, [latitude, longitude, storeName])

    if (!latitude || !longitude) {
        return (
            <div className="h-48 bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center relative">
                <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded">營業中</span>
            </div>
        )
    }

    return (
        <div className="h-48 relative">
            <div ref={mapRef} className="w-full h-full" />
            <span className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-md z-10">營業中</span>
        </div>
    )
}
