import React, { Suspense, lazy, useState } from 'react';
import { BUILDING_IMAGES } from '../data/salvatoreData';
import { CameroonCity } from '../types/property';

const LazyCameroonGoogleMap = lazy(() =>
  import('./CameroonGoogleMap').then((mod) => ({ default: mod.CameroonGoogleMap }))
);

export function CameroonCoverageMap(props: {
  cities: CameroonCity[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  onRequestCityAssessment?: (cityName: string) => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="relative w-full bg-[#091526] rounded-2xl border border-[#1E3352] overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-[#1A304D] flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3 w-40 rounded bg-[#183154] animate-pulse" />
              <div className="h-3 w-52 rounded bg-[#142947] animate-pulse" />
            </div>
            <div className="h-7 w-24 rounded-lg bg-[#183154] animate-pulse" />
          </div>
          <div className="w-full h-[380px] sm:h-[420px] bg-[#0B192C] flex items-center justify-center text-xs text-slate-400">
            Loading interactive Cameroon operations map…
          </div>
        </div>
      }
    >
      <LazyCameroonGoogleMap {...props} />
    </Suspense>
  );
}

export function SalvatoreLogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 29V15L14 12V29H8Z" fill="currentColor" fillOpacity="0.86" />
      <path d="M16 29V9L23 6V29H16Z" fill="currentColor" />
      <path d="M25 29V13L31 16V29H25Z" fill="currentColor" fillOpacity="0.86" />
      <rect x="18.2" y="12" width="2.2" height="2.6" fill="#C9972C" />
      <rect x="18.2" y="17" width="2.2" height="2.6" fill="#C9972C" />
      <rect x="18.2" y="22" width="2.2" height="2.6" fill="#C9972C" />
      <path
        d="M4 31.5C11.5 28.5 23.5 28.5 36 33.5"
        stroke="#C9972C"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ResilientPropertyImage({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
  fetchPriority = 'auto',
}: {
  src?: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#0F233F] via-[#17345C] to-[#091526] flex flex-col items-center justify-center p-6 text-center text-white">
        <SalvatoreLogoMark className="w-10 h-10 text-[#F4D27A] mb-3" />
        <p className="text-sm font-semibold tracking-tight">{fallbackTitle}</p>
        <p className="mt-1 text-xs text-slate-300">Salvatore Managed Portfolio</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

export function HeroArchitecturalIllustration() {
  return (
    <div className="relative w-full h-full min-h-[340px] lg:min-h-[410px] p-2 bg-[#0F213A] border border-[#27446B] rounded-2xl shadow-2xl flex">
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#071221]">
        <ResilientPropertyImage
          src={BUILDING_IMAGES.twilightResidence}
          alt="Modern multi-story apartment building with rooftop glass terrace at twilight managed by Salvatore Property Management"
          fallbackTitle="Salvatore Coastal & Urban Residences"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover block"
        />

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050D19]/90 via-[#050D19]/45 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 px-5 py-3.5 backdrop-blur-md bg-[#06101E]/82 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-200">
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">
              Full-Spectrum Asset Stewardship
            </p>
            <p className="text-slate-300 mt-0.5">
              Apartments · Private Houses · Multi-Unit Blocks · Commercial Plazas
            </p>
          </div>
          <div className="text-right font-mono tabular-nums font-medium text-[#F4D27A]">
            +237 679 988 242
          </div>
        </div>
      </div>
    </div>
  );
}
