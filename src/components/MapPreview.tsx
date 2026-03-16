import { useEffect, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'

interface MapPreviewProps {
    latitude: number | null
    longitude: number | null
    address?: string
    onCoordinatesChange?: (lat: number, lng: number) => void
}

// 宣告 Google Maps 類型
declare global {
    interface Window {
        google: any
    }
}

export default function MapPreview({ latitude, longitude, address, onCoordinatesChange }: MapPreviewProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<any>(null)
    const [marker, setMarker] = useState<any>(null)
    const [searchAddress, setSearchAddress] = useState(address || '')
    const [isGeocoding, setIsGeocoding] = useState(false)

    // 初始化地圖
    useEffect(() => {
        if (!mapRef.current || !window.google) return

        const defaultCenter = { lat: 25.0330, lng: 121.5654 } // 台北 101
        const center = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter

        const newMap = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: latitude && longitude ? 15 : 12,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: false,
        })

        setMap(newMap)

        // 點擊地圖更新座標
        newMap.addListener('click', (e: any) => {
            const lat = e.latLng.lat()
            const lng = e.latLng.lng()
            onCoordinatesChange?.(lat, lng)
        })
    }, [])

    // 更新標記位置
    useEffect(() => {
        if (!map) return

        if (latitude && longitude) {
            const position = { lat: latitude, lng: longitude }

            if (marker) {
                marker.setPosition(position)
            } else {
                const newMarker = new window.google.maps.Marker({
                    position,
                    map,
                    draggable: true,
                    animation: window.google.maps.Animation.DROP,
                })

                // 拖曳標記更新座標
                newMarker.addListener('dragend', (e: any) => {
                    const lat = e.latLng.lat()
                    const lng = e.latLng.lng()
                    onCoordinatesChange?.(lat, lng)
                })

                setMarker(newMarker)
            }

            map.setCenter(position)
            map.setZoom(15)
        } else if (marker) {
            marker.setMap(null)
            setMarker(null)
        }
    }, [latitude, longitude, map])

    // 地址查詢座標 (Geocoding)
    const handleGeocode = async () => {
        if (!searchAddress || !window.google) return

        setIsGeocoding(true)
        const geocoder = new window.google.maps.Geocoder()

        try {
            const result = await geocoder.geocode({ address: searchAddress })

            if (result.results && result.results.length > 0) {
                const location = result.results[0].geometry.location
                const lat = location.lat()
                const lng = location.lng()
                onCoordinatesChange?.(lat, lng)
            } else {
                alert('找不到該地址的座標,請檢查地址是否正確')
            }
        } catch (error) {
            console.error('Geocoding error:', error)
            alert('查詢座標失敗,請稍後再試')
        } finally {
            setIsGeocoding(false)
        }
    }

    return (
        <div className="space-y-3">
            {/* 地址搜尋 */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="輸入地址查詢座標..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
                />
                <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={isGeocoding || !searchAddress}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Search size={16} />
                    {isGeocoding ? '查詢中...' : '查詢座標'}
                </button>
            </div>

            {/* 地圖容器 */}
            <div
                ref={mapRef}
                className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
            />

            {/* 提示訊息 */}
            <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    點擊地圖或拖曳標記可更新座標位置
                </p>
                {latitude && longitude && (
                    <p className="text-amber-600 font-medium">
                        目前座標: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                )}
            </div>
        </div>
    )
}
