/// <reference types="google.maps" />
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Compass, Layers, MapPin, RotateCcw } from 'lucide-react';
import { CameroonCity } from '../types/property';

interface ResolvedCityHub {
  cityId: string;
  location: { lat: number; lng: number };
  formattedAddress: string;
  placeId: string;
  cachedAt: number;
}

const CACHE_KEY = 'salvatore_cm_hubs_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (within 30-day ToS geospatial caching rule)
const ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];

function readCachedHubs(): Record<string, ResolvedCityHub> {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ResolvedCityHub>;
    const now = Date.now();
    const valid: Record<string, ResolvedCityHub> = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (
        entry &&
        typeof entry.location?.lat === 'number' &&
        typeof entry.location?.lng === 'number' &&
        now - entry.cachedAt < CACHE_TTL_MS
      ) {
        valid[id] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

function writeCachedHubs(hubs: Record<string, ResolvedCityHub>) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(hubs));
  } catch {
    // Ignore storage quota errors
  }
}

function CityMarkerNode({
  city,
  hub,
  isSelected,
  showInfoWindow,
  onSelect,
  onCloseInfoWindow,
  onRequestCityAssessment,
}: {
  city: CameroonCity;
  hub: ResolvedCityHub;
  isSelected: boolean;
  showInfoWindow: boolean;
  onSelect: (cityId: string) => void;
  onCloseInfoWindow: () => void;
  onRequestCityAssessment?: (cityName: string) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={hub.location}
        title={`${city.name} · ${city.managedUnits} managed units`}
        zIndex={isSelected ? 20 : 1}
        onClick={() => onSelect(city.id)}
      >
        <Pin
          background={isSelected ? '#F4D27A' : '#0F2A4D'}
          borderColor={isSelected ? '#8C650B' : '#8DB4DF'}
          glyphColor={isSelected ? '#091526' : '#FFFFFF'}
          scale={isSelected ? 1.18 : 0.94}
        />
      </AdvancedMarker>

      {showInfoWindow && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={onCloseInfoWindow}
        >
          <div className="p-1 text-[#0B192C]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8C650B]">
              {city.region}
            </p>
            <h4 className="text-sm font-bold text-[#0B192C] mt-0.5">
              {city.name} Operations Hub
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {hub.formattedAddress || city.placeQuery}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Managed</span>
                <span className="font-mono font-bold text-[#0B192C]">
                  {city.managedUnits} units
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Occupancy</span>
                <span className="font-mono font-bold text-emerald-700">
                  {city.avgOccupancy}
                </span>
              </div>
            </div>
            {onRequestCityAssessment && (
              <button
                type="button"
                onClick={() => onRequestCityAssessment(city.name)}
                className="mt-2.5 w-full py-1.5 px-2.5 text-[11px] font-semibold text-white bg-[#0B192C] rounded hover:bg-[#162D4C] transition-colors cursor-pointer"
              >
                Assess Property in {city.name}
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function CameroonMapScene({
  cities,
  selectedCityId,
  onSelectCity,
  onRequestCityAssessment,
  mapTypeId,
  overviewTrigger,
  onResolvedCountChange,
}: {
  cities: CameroonCity[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  onRequestCityAssessment?: (cityName: string) => void;
  mapTypeId: 'roadmap' | 'hybrid';
  overviewTrigger: number;
  onResolvedCountChange: (count: number, loading: boolean) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const coreLib = useMapsLibrary('core');
  const apiStatus = useApiLoadingStatus();

  const [resolvedHubs, setResolvedHubs] = useState<Record<string, ResolvedCityHub>>(() =>
    readCachedHubs()
  );
  const [infoOpenCityId, setInfoOpenCityId] = useState<string | null>(null);
  const initialBoundsFittedRef = useRef(false);
  const userSelectedRef = useRef(false);

  // Check API loading failures without emitting false positives on empty results
  useEffect(() => {
    if (apiStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [apiStatus]);

  // Fetch Cameroon hub locations via Places API (New) Text Search
  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    const cached = readCachedHubs();
    const missingCities = cities.filter((c) => !cached[c.id]);

    onResolvedCountChange(Object.keys(cached).length, missingCities.length > 0);
    if (missingCities.length === 0) {
      setResolvedHubs(cached);
      return;
    }

    const resolveCities = async () => {
      const updated = { ...cached };

      for (const city of missingCities) {
        if (cancelled) break;
        try {
          const request = {
            textQuery: city.placeQuery,
            fields: ['id', 'displayName', 'location', 'formattedAddress'],
            region: 'cm',
            language: 'en',
            maxResultCount: 1,
            internalUsageAttributionIds: ATTRIBUTION_IDS,
          } as google.maps.places.SearchByTextRequest;

          const { places } = await placesLib.Place.searchByText(request);
          const place = places?.[0];
          if (place?.location) {
            updated[city.id] = {
              cityId: city.id,
              location: {
                lat: place.location.lat(),
                lng: place.location.lng(),
              },
              formattedAddress: place.formattedAddress || city.placeQuery,
              placeId: place.id || city.id,
              cachedAt: Date.now(),
            };
          }
        } catch (err) {
          const errStr = String(err);
          if (
            errStr.includes('RESOURCE_EXHAUSTED') ||
            errStr.includes('OVER_QUERY_LIMIT') ||
            errStr.includes('QuotaExceeded') ||
            errStr.includes('429')
          ) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
            break;
          }
        }
      }

      if (!cancelled) {
        writeCachedHubs(updated);
        setResolvedHubs(updated);
        onResolvedCountChange(Object.keys(updated).length, false);
      }
    };

    void resolveCities();

    return () => {
      cancelled = true;
    };
  }, [placesLib, cities, onResolvedCountChange]);

  // Fit bounds across all resolved Cameroon hubs on initial load or when user clicks "All Cameroon"
  const fitAllHubs = useCallback(() => {
    if (!map || !coreLib) return;
    const entries = Object.values(resolvedHubs);
    if (entries.length === 0) return;

    const bounds = new coreLib.LatLngBounds();
    entries.forEach((hub) => bounds.extend(hub.location));
    map.fitBounds(bounds, { top: 44, right: 36, bottom: 36, left: 36 });
  }, [map, coreLib, resolvedHubs]);

  useEffect(() => {
    if (!initialBoundsFittedRef.current && Object.keys(resolvedHubs).length > 0 && map && coreLib) {
      fitAllHubs();
      initialBoundsFittedRef.current = true;
    }
  }, [resolvedHubs, map, coreLib, fitAllHubs]);

  useEffect(() => {
    if (overviewTrigger > 0) {
      setInfoOpenCityId(null);
      fitAllHubs();
    }
  }, [overviewTrigger, fitAllHubs]);

  // Pan smoothly to the selected city when changed from city buttons or markers
  useEffect(() => {
    if (!map || !selectedCityId) return;
    const targetHub = resolvedHubs[selectedCityId];
    if (!targetHub) return;

    if (!userSelectedRef.current) {
      userSelectedRef.current = true;
      return;
    }

    map.panTo(targetHub.location);
    const currentZoom = map.getZoom() ?? 6;
    if (currentZoom < 11) {
      map.setZoom(11);
    }
    setInfoOpenCityId(selectedCityId);
  }, [selectedCityId, resolvedHubs, map]);

  const handleMarkerSelect = (cityId: string) => {
    userSelectedRef.current = true;
    onSelectCity(cityId);
    setInfoOpenCityId(cityId);
    const hub = resolvedHubs[cityId];
    if (map && hub) {
      map.panTo(hub.location);
      const currentZoom = map.getZoom() ?? 6;
      if (currentZoom < 11) {
        map.setZoom(11);
      }
    }
  };

  return (
    <GoogleMap
      mapId="DEMO_MAP_ID"
      defaultCenter={{ lat: 5.8, lng: 12.2 }}
      defaultZoom={5}
      mapTypeId={mapTypeId}
      gestureHandling="cooperative"
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl={true}
      internalUsageAttributionIds={ATTRIBUTION_IDS}
      style={{ width: '100%', height: '100%' }}
    >
      {cities.map((city) => {
        const hub = resolvedHubs[city.id];
        if (!hub) return null;
        return (
          <CityMarkerNode
            key={city.id}
            city={city}
            hub={hub}
            isSelected={selectedCityId === city.id}
            showInfoWindow={infoOpenCityId === city.id}
            onSelect={handleMarkerSelect}
            onCloseInfoWindow={() => setInfoOpenCityId(null)}
            onRequestCityAssessment={onRequestCityAssessment}
          />
        );
      })}
    </GoogleMap>
  );
}

export function CameroonGoogleMap({
  cities,
  selectedCityId,
  onSelectCity,
  onRequestCityAssessment,
}: {
  cities: CameroonCity[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  onRequestCityAssessment?: (cityName: string) => void;
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [overviewTrigger, setOverviewTrigger] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolvedCountChange = useCallback((count: number, loading: boolean) => {
    setResolvedCount(count);
    setIsResolving(loading);
  }, []);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) || cities[0],
    [cities, selectedCityId]
  );

  return (
    <div className="relative w-full bg-[#091526] rounded-2xl border border-[#1E3352] overflow-hidden shadow-lg">
      {/* Compact Architectural Map Header */}
      <div className="px-4 py-3 border-b border-[#1A304D] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#F4D27A] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Cameroon Live Operations Map</span>
          </p>
          <p className="text-xs text-slate-300 mt-0.5">
            Focused on <span className="font-semibold text-white">{selectedCity.name}</span> ·{' '}
            {isResolving ? 'Syncing Google Places hubs…' : `${resolvedCount || cities.length} cities mapped`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOverviewTrigger((prev) => prev + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 bg-[#122642] border border-[#244269] rounded-lg hover:bg-[#19355C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Show all 8 Cameroonian hubs"
          >
            <RotateCcw className="w-3 h-3 text-[#F4D27A]" />
            <span>All 8 Cities</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 bg-[#122642] border border-[#244269] rounded-lg hover:bg-[#19355C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-[#F4D27A]" />
            <span>{mapTypeId === 'roadmap' ? 'Satellite' : 'Map'}</span>
          </button>
        </div>
      </div>

      {/* Explicit Container Height (CF2) */}
      <div className="relative w-full h-[380px] sm:h-[420px] bg-[#0B192C]">
        {apiKey ? (
          <APIProvider
            apiKey={apiKey}
            language="en"
            region="CM"
            libraries={['places', 'marker']}
          >
            <CameroonMapScene
              cities={cities}
              selectedCityId={selectedCityId}
              onSelectCity={onSelectCity}
              onRequestCityAssessment={onRequestCityAssessment}
              mapTypeId={mapTypeId}
              overviewTrigger={overviewTrigger}
              onResolvedCountChange={handleResolvedCountChange}
            />
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-gradient-to-br from-[#0B192C] to-[#122947]">
            <MapPin className="w-8 h-8 text-[#F4D27A] mb-2.5" />
            <p className="text-base font-semibold text-white">
              {selectedCity.name} · {selectedCity.region}
            </p>
            <p className="mt-1 text-xs text-slate-300 max-w-xs leading-relaxed">
              {selectedCity.managedUnits} managed units ({selectedCity.avgOccupancy} occupancy) across{' '}
              {selectedCity.neighborhoods.slice(0, 4).join(', ')}.
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                selectedCity.placeQuery
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors"
            >
              <span>Open {selectedCity.name} in Google Maps</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
