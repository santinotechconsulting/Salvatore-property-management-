import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  FileText,
  Headset,
  Lock,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import {
  CAMEROON_CITIES,
  MANAGEMENT_SERVICES,
  OWNER_OUTCOMES,
  PORTFOLIO_ASSET_SHOWCASE,
  SALVATORE_CONTACT,
  formatXaf,
} from '../data/salvatoreData';
import {
  ConsultationRequest,
  PropertyType,
  ServiceCategory,
} from '../types/property';
import {
  CameroonCoverageMap,
  HeroArchitecturalIllustration,
  ResilientPropertyImage,
  SalvatoreLogoMark,
} from './ArchitecturalVisuals';

interface PublicWebsiteProps {
  onOpenPortal: () => void;
  onSubmitConsultation: (request: Omit<ConsultationRequest, 'id' | 'submittedAt'>) => void;
  consultationsCount: number;
  onOpenCookieSettings?: () => void;
}

type CurrencyCode = 'XAF' | 'EUR' | 'USD';

const CURRENCY_RATES: Record<CurrencyCode, { factor: number; symbol: string }> = {
  XAF: { factor: 1, symbol: 'FCFA' },
  EUR: { factor: 1 / 655.957, symbol: '€' },
  USD: { factor: 1 / 605, symbol: '$' },
};

const PROPERTY_TYPES: PropertyType[] = [
  'Apartment Building',
  'Residential House',
  'Multi-Unit Block',
  'Commercial Property',
];

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  supervision: ClipboardCheck,
  'tenant-screening': UserCheck,
  'rent-collection': Wallet,
  'cleaning-supervision': Sparkles,
  'repairs-coordination': Wrench,
  'tenant-complaints': Headset,
  'asset-classes': Building2,
  'owner-reports': Camera,
  'investment-monitoring': ShieldCheck,
};

const SERVICE_SUBMENU_ITEMS: Array<{
  id: string;
  label: string;
  description: string;
  filter: ServiceCategory;
  targetId: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'sub-supervision',
    label: 'Supervision & Reporting',
    description: 'Walkthrough checklists, photo dossiers & owner reports',
    filter: 'supervision',
    targetId: 'services',
    icon: ClipboardCheck,
  },
  {
    id: 'sub-tenants',
    label: 'Tenants & Rent Collection',
    description: 'Screening, monthly remittance & tenant desk',
    filter: 'tenants',
    targetId: 'services',
    icon: Wallet,
  },
  {
    id: 'sub-maintenance',
    label: 'Maintenance & Assets',
    description: 'Repairs, sanitation supervision & yield protection',
    filter: 'maintenance',
    targetId: 'services',
    icon: Wrench,
  },
  {
    id: 'sub-portfolio',
    label: 'Managed Building Portfolio',
    description: 'Apartments, villas, multi-unit & commercial blocks',
    filter: 'all',
    targetId: 'managed-portfolio',
    icon: Building2,
  },
];

export function PublicWebsite({
  onOpenPortal,
  onSubmitConsultation,
  consultationsCount,
  onOpenCookieSettings,
}: PublicWebsiteProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<'services' | 'coverage' | null>(null);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<'services' | 'coverage' | null>(null);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const closeMenuTimerRef = useRef<number | null>(null);
  const [serviceFilter, setServiceFilter] = useState<ServiceCategory>('all');
  const [activeServiceId, setActiveServiceId] = useState<string>(MANAGEMENT_SERVICES[0].id);
  const [selectedCityId, setSelectedCityId] = useState<string>('douala');
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState<number>(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [flyerModalOpen, setFlyerModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const clearMenuCloseTimer = () => {
    if (closeMenuTimerRef.current !== null) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
  };

  const openMenuWithCancel = (menu: 'services' | 'coverage') => {
    clearMenuCloseTimer();
    setOpenDesktopMenu(menu);
    setHoveredNavId(menu);
  };

  const scheduleMenuClose = () => {
    clearMenuCloseTimer();
    closeMenuTimerRef.current = window.setTimeout(() => {
      setOpenDesktopMenu(null);
      setHoveredNavId(null);
    }, 140);
  };

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDesktopMenu(null);
        setHoveredNavId(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDesktopMenu(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      clearMenuCloseTimer();
      document.removeEventListener('mousedown', handleDocClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    setOpenDesktopMenu(null);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setShowScrollTop(y > 320);
      setScrollProgress(docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (!flyerModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFlyerModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flyerModalOpen]);

  // Estimator state
  const [estType, setEstType] = useState<PropertyType>('Apartment Building');
  const [estCity, setEstCity] = useState<string>('Douala');
  const [estUnits, setEstUnits] = useState<number>(6);
  const [estRentXaf, setEstRentXaf] = useState<number>(220000);
  const [estPlan, setEstPlan] = useState<'local' | 'diaspora'>('diaspora');
  const [currency, setCurrency] = useState<CurrencyCode>('XAF');

  // Consultation Form state
  const [ownerName, setOwnerName] = useState('');
  const [locationMode, setLocationMode] = useState<'In Cameroon' | 'Living Abroad'>('Living Abroad');
  const [countryOrCity, setCountryOrCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyCity, setPropertyCity] = useState('Douala');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment Building');
  const [unitsCount, setUnitsCount] = useState('4');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    if (serviceFilter === 'all') return MANAGEMENT_SERVICES;
    return MANAGEMENT_SERVICES.filter((item) => item.category === serviceFilter);
  }, [serviceFilter]);

  const activeService = useMemo(
    () =>
      filteredServices.find((s) => s.id === activeServiceId) ||
      filteredServices[0] ||
      MANAGEMENT_SERVICES[0],
    [filteredServices, activeServiceId]
  );

  const selectedCity = useMemo(
    () => CAMEROON_CITIES.find((c) => c.id === selectedCityId) || CAMEROON_CITIES[0],
    [selectedCityId]
  );

  const formatEstimatorAmount = (amountXaf: number) => {
    if (currency === 'XAF') {
      return formatXaf(Math.round(amountXaf));
    }
    const converted = amountXaf * CURRENCY_RATES[currency].factor;
    return `${CURRENCY_RATES[currency].symbol}${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(Math.round(converted))}`;
  };

  const grossMonthlyXaf = estUnits * estRentXaf;
  const grossAnnualXaf = grossMonthlyXaf * 12;
  const feeRate = estPlan === 'diaspora' ? 0.1 : 0.08;
  const managementFeeMonthlyXaf = grossMonthlyXaf * feeRate;
  const netMonthlyOwnerXaf = grossMonthlyXaf - managementFeeMonthlyXaf;
  const netAnnualOwnerXaf = grossAnnualXaf * (1 - feeRate);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(SALVATORE_CONTACT.phoneInternational);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2400);
    } catch {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2400);
    }
  };

  const scrollToConsultation = (options?: {
    fromEstimator?: boolean;
    cityOverride?: string;
    propertyTypeOverride?: PropertyType;
    serviceNote?: string;
  }) => {
    if (options?.fromEstimator) {
      setPropertyCity(estCity);
      setPropertyType(estType);
      setUnitsCount(String(estUnits));
      setLocationMode(estPlan === 'diaspora' ? 'Living Abroad' : 'In Cameroon');
    }
    if (options?.cityOverride) {
      setPropertyCity(options.cityOverride);
    }
    if (options?.propertyTypeOverride) {
      setPropertyType(options.propertyTypeOverride);
    }
    if (options?.serviceNote) {
      setNotes(options.serviceNote);
    }
    const target = document.getElementById('consultation');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (ownerName.trim().length < 2) {
      errors.ownerName = 'Please enter your full name.';
    }
    if (countryOrCity.trim().length < 2) {
      errors.countryOrCity =
        locationMode === 'Living Abroad'
          ? 'Please enter your country or city of residence.'
          : 'Please enter your current town in Cameroon.';
    }
    const cleanedPhone = phone.replace(/[\s()-]/g, '');
    if (cleanedPhone.length < 8) {
      errors.phone = 'Enter a valid phone or WhatsApp number (at least 8 digits).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address for monthly reporting.';
    }
    const parsedUnits = parseInt(unitsCount, 10);
    if (Number.isNaN(parsedUnits) || parsedUnits < 1) {
      errors.unitsCount = 'Enter at least 1 unit.';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmitConsultation({
      ownerName: ownerName.trim(),
      locationMode,
      countryOrCity: countryOrCity.trim(),
      phone: phone.trim(),
      email: email.trim(),
      propertyCity,
      propertyType,
      unitsCount: parsedUnits,
      notes: notes.trim(),
    });

    setSubmittedConfirmation(
      `Consultation logged for ${ownerName.trim()} (${parsedUnits} ${
        parsedUnits === 1 ? 'unit' : 'units'
      } in ${propertyCity}). Our regional coordinator will reach out on ${phone.trim()} within 24 hours.`
    );
    setOwnerName('');
    setCountryOrCity('');
    setPhone('');
    setEmail('');
    setNotes('');
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0B192C]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-[#091526]/95 backdrop-blur-md border-b border-[#1A2F4D]"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Clean single-line brand wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2.5 font-editorial text-xl font-semibold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4D27A]"
          >
            <SalvatoreLogoMark className="w-7 h-7 text-white shrink-0" />
            <span>Salvatore</span>
          </a>

          {/* Zone 2: 5 concise single-line nav links with animated indicator & sub-menus */}
          <nav
            aria-label="Primary"
            onMouseLeave={scheduleMenuClose}
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
          >
            {/* Services + Animated Sub-Menu */}
            <div
              className="relative py-2"
              onMouseEnter={() => openMenuWithCancel('services')}
            >
              <button
                type="button"
                aria-expanded={openDesktopMenu === 'services'}
                aria-haspopup="true"
                onClick={() =>
                  setOpenDesktopMenu((prev) => (prev === 'services' ? null : 'services'))
                }
                onFocus={() => setHoveredNavId('services')}
                className="relative inline-flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Services</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#F4D27A] transition-transform duration-200 ${
                    openDesktopMenu === 'services' ? 'rotate-180' : ''
                  }`}
                />
                {hoveredNavId === 'services' && (
                  <motion.span
                    layoutId="desktop-nav-highlight"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-[#F4D27A]"
                  />
                )}
              </button>

              <AnimatePresence>
                {openDesktopMenu === 'services' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                    onMouseEnter={() => openMenuWithCancel('services')}
                    className="absolute left-0 top-full mt-1.5 w-80 bg-[#091526] border border-[#243E63] rounded-xl shadow-2xl p-2 z-50"
                  >
                    <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#F4D27A]">
                      Property Management Services
                    </p>
                    <div className="space-y-0.5">
                      {SERVICE_SUBMENU_ITEMS.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setServiceFilter(sub.filter);
                              scrollToSection(sub.targetId);
                            }}
                            className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#132642] transition-colors group cursor-pointer"
                          >
                            <span className="mt-0.5 w-8 h-8 rounded-lg bg-[#13294B] border border-[#274675] flex items-center justify-center text-[#F4D27A] group-hover:bg-[#F4D27A] group-hover:text-[#091526] transition-colors shrink-0">
                              <SubIcon className="w-4 h-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-white">
                                {sub.label}
                              </span>
                              <span className="block text-[11px] text-slate-400 leading-snug mt-0.5">
                                {sub.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Coverage + Animated Sub-Menu */}
            <div
              className="relative py-2"
              onMouseEnter={() => openMenuWithCancel('coverage')}
            >
              <button
                type="button"
                aria-expanded={openDesktopMenu === 'coverage'}
                aria-haspopup="true"
                onClick={() =>
                  setOpenDesktopMenu((prev) => (prev === 'coverage' ? null : 'coverage'))
                }
                onFocus={() => setHoveredNavId('coverage')}
                className="relative inline-flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Coverage</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#F4D27A] transition-transform duration-200 ${
                    openDesktopMenu === 'coverage' ? 'rotate-180' : ''
                  }`}
                />
                {hoveredNavId === 'coverage' && (
                  <motion.span
                    layoutId="desktop-nav-highlight"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-[#F4D27A]"
                  />
                )}
              </button>

              <AnimatePresence>
                {openDesktopMenu === 'coverage' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                    onMouseEnter={() => openMenuWithCancel('coverage')}
                    className="absolute left-0 top-full mt-1.5 w-80 bg-[#091526] border border-[#243E63] rounded-xl shadow-2xl p-3 z-50"
                  >
                    <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#F4D27A]">
                      Active Cameroon City Hubs
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CAMEROON_CITIES.map((city) => {
                        const active = city.id === selectedCityId;
                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => {
                              setSelectedCityId(city.id);
                              scrollToSection('coverage');
                            }}
                            className={`text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              active
                                ? 'bg-[#173259] text-[#F4D27A] font-semibold border border-[#2E5488]'
                                : 'text-slate-200 hover:bg-[#132642]'
                            }`}
                          >
                            <span className="truncate">{city.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {city.managedUnits}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollToSection('coverage')}
                      className="mt-2.5 w-full py-2 px-3 rounded-lg bg-[#132642] hover:bg-[#1A355C] text-[11px] font-semibold text-[#F4D27A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View All 8 Hubs on Google Map</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="#estimator"
              onMouseEnter={() => {
                setOpenDesktopMenu(null);
                setHoveredNavId('estimator');
              }}
              className="relative py-2 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>Estimator</span>
              {hoveredNavId === 'estimator' && (
                <motion.span
                  layoutId="desktop-nav-highlight"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-[#F4D27A]"
                />
              )}
            </a>

            <button
              type="button"
              onClick={onOpenPortal}
              onMouseEnter={() => {
                setOpenDesktopMenu(null);
                setHoveredNavId('portal');
              }}
              className="relative py-2 hover:text-[#F4D27A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Owner Portal</span>
              {hoveredNavId === 'portal' && (
                <motion.span
                  layoutId="desktop-nav-highlight"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-[#F4D27A]"
                />
              )}
            </button>

            <a
              href="#consultation"
              onMouseEnter={() => {
                setOpenDesktopMenu(null);
                setHoveredNavId('contact');
              }}
              className="relative py-2 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>Contact</span>
              {hoveredNavId === 'contact' && (
                <motion.span
                  layoutId="desktop-nav-highlight"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-[#F4D27A]"
                />
              )}
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollToConsultation()}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D27A]"
            >
              Request Management
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#243E63] text-white hover:bg-[#132642] cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Animated Mobile Navigation Drawer + Collapsible Sub-Menus */}
        <AnimatePresence initial={false}>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
              className="md:hidden overflow-hidden border-t border-[#1A2F4D] bg-[#091526]"
            >
              <div className="px-6 py-4 space-y-2 text-slate-200">
                {/* Mobile Services Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileSubmenu((prev) => (prev === 'services' ? null : 'services'))
                    }
                    className="w-full flex items-center justify-between py-2 text-sm font-medium hover:text-white cursor-pointer"
                  >
                    <span>Services</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#F4D27A] transition-transform duration-200 ${
                        mobileSubmenu === 'services' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileSubmenu === 'services' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden pl-3 border-l border-[#243E63] space-y-1 pb-2"
                      >
                        {SERVICE_SUBMENU_ITEMS.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setServiceFilter(sub.filter);
                                scrollToSection(sub.targetId);
                              }}
                              className="w-full flex items-center gap-2.5 py-1.5 text-left text-xs text-slate-300 hover:text-[#F4D27A] cursor-pointer"
                            >
                              <SubIcon className="w-3.5 h-3.5 text-[#F4D27A] shrink-0" />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Coverage Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileSubmenu((prev) => (prev === 'coverage' ? null : 'coverage'))
                    }
                    className="w-full flex items-center justify-between py-2 text-sm font-medium hover:text-white cursor-pointer"
                  >
                    <span>Cameroon Coverage</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#F4D27A] transition-transform duration-200 ${
                        mobileSubmenu === 'coverage' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileSubmenu === 'coverage' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden pl-3 border-l border-[#243E63] pb-2"
                      >
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {CAMEROON_CITIES.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                setSelectedCityId(city.id);
                                scrollToSection('coverage');
                              }}
                              className="text-left px-2.5 py-1.5 rounded-md bg-[#11233D] text-xs text-slate-200 hover:text-[#F4D27A] cursor-pointer"
                            >
                              {city.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <a
                  href="#estimator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium hover:text-white"
                >
                  Estimator
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPortal();
                  }}
                  className="block w-full text-left py-2 text-sm font-medium text-[#F4D27A] cursor-pointer"
                >
                  Owner Portal
                </button>
                <a
                  href="#consultation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium hover:text-white"
                >
                  Contact
                </a>
                <button
                  type="button"
                  onClick={() => scrollToConsultation()}
                  className="mt-2 w-full py-2.5 px-4 text-sm font-semibold text-[#091526] bg-[#F4D27A] rounded-lg cursor-pointer"
                >
                  Request Management
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        {/* Executive Dark Architectural Hero Section */}
        <section
          className="relative bg-[#091526] text-white border-b border-[#1A2F4D] overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 75% 60% at 75% 20%, rgba(201, 151, 44, 0.12), transparent 70%)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-8 lg:py-11">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="lg:col-span-6 flex flex-col justify-between py-1"
              >
                <div>
                  <p className="text-sm font-medium text-[#F4D27A] tracking-wide">
                    Salvatore Property Management · Across Towns &amp; Cities in Cameroon
                  </p>

                  <h1 className="mt-3 font-editorial text-[clamp(2.2rem,3.8vw,3.45rem)] font-semibold tracking-tight text-white leading-[1.08] [text-wrap:balance]">
                    We manage your property, so you don&apos;t have to.
                  </h1>

                  <p className="mt-3.5 font-editorial italic text-xl text-[#F7E7B8] leading-snug">
                    Your Property. Our Responsibility. Your Peace of Mind.
                  </p>

                  <p className="mt-4 text-[15px] text-slate-300 leading-relaxed max-w-[56ch]">
                    Whether you live abroad, reside in another town, or have a demanding schedule, we supervise your houses, apartments, residential buildings, and commercial properties across Cameroon—protecting your investment with full monthly visibility.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => scrollToConsultation()}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D27A]"
                    >
                      <span>Schedule Property Consultation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={onOpenPortal}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-[#2C486F] rounded-lg hover:bg-[#132642] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Open Owner System</span>
                    </button>
                  </div>
                </div>

                {/* Direct Contact & Brochure Trigger */}
                <div className="mt-6 pt-4 border-t border-[#1A2F4D] flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#F4D27A] shrink-0" />
                    <span>Direct Owner Desk:</span>
                    <a
                      href={SALVATORE_CONTACT.phoneTel}
                      className="font-mono tabular-nums font-semibold text-[#F4D27A] hover:underline"
                    >
                      +237 {SALVATORE_CONTACT.phoneDisplay}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlyerModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#F4D27A]" />
                    <span>View Official Service Flyer</span>
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_EXPO }}
                className="lg:col-span-6 flex"
              >
                <HeroArchitecturalIllustration />
              </motion.div>
            </div>

            {/* Full-Width 4-Column KPI / Proof Strip below Hero Split */}
            <div className="mt-8 pt-6 border-t border-[#1A2F4D] grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#1A2F4D]">
              <div className="lg:pr-8">
                <p className="font-editorial text-2xl sm:text-3xl font-semibold tabular-nums text-[#F4D27A]">
                  542 Units
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-snug">
                  Residential, apartment &amp; commercial spaces actively supervised
                </p>
              </div>
              <div className="lg:px-8">
                <p className="font-editorial text-2xl sm:text-3xl font-semibold tabular-nums text-[#F4D27A]">
                  8 Cities
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-snug">
                  Douala, Yaoundé, Buea, Limbe, Kribi, Bafoussam, Bamenda &amp; Garoua
                </p>
              </div>
              <div className="lg:px-8">
                <p className="font-editorial text-2xl sm:text-3xl font-semibold tabular-nums text-[#F4D27A]">
                  1st of Month
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-snug">
                  Guaranteed rent remittance statements &amp; timestamped photo dossiers
                </p>
              </div>
              <div className="lg:pl-8">
                <p className="font-editorial text-2xl sm:text-3xl font-semibold tabular-nums text-[#F4D27A]">
                  95.2% Occupied
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-snug">
                  Average portfolio occupancy via vetted tenant &amp; guarantor screening
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Core Services (01 - 09) & Managed Building Portfolio */}
        <section id="services" className="py-10 lg:py-12 bg-[#F8F9FB] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8C650B]">
                  Core Management Scope
                </p>
                <h2 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B192C] [text-wrap:balance]">
                  Nine operational pillars protecting your Cameroonian asset
                </h2>
              </div>

              {/* Interactive Service Category Filter */}
              <div
                role="tablist"
                aria-label="Filter management services"
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start lg:self-auto"
              >
                {[
                  { id: 'all', label: 'All Services (9)' },
                  { id: 'supervision', label: 'Supervision & Reporting' },
                  { id: 'tenants', label: 'Tenants & Rent' },
                  { id: 'maintenance', label: 'Maintenance & Assets' },
                ].map((tab) => {
                  const active = serviceFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setServiceFilter(tab.id as ServiceCategory)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-[#0B192C] shadow-xs'
                          : 'text-slate-600 hover:text-[#0B192C]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Interactive Active Service Brief Bar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeService.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                className="mt-5 bg-[#0B192C] text-white rounded-xl p-5 border border-[#1E3352] grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
              >
                <div className="lg:col-span-7 flex items-start gap-4">
                  {(() => {
                    const ActiveIcon = SERVICE_ICONS[activeService.id] || Building2;
                    return (
                      <div className="hidden sm:flex w-11 h-11 rounded-xl bg-[#13294B] border border-[#274675] items-center justify-center text-[#F4D27A] shrink-0 mt-0.5">
                        <ActiveIcon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-3 text-xs text-[#F4D27A] font-mono tabular-nums">
                      <span>Selected Service {activeService.index}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeService.cadence}</span>
                    </div>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold tracking-tight">
                      {activeService.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                      {activeService.summary}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-[#1E3352] pt-3.5 lg:pt-0 lg:pl-6">
                  <ul className="space-y-1 text-xs text-slate-200 w-full">
                    {activeService.deliverables.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#F4D27A] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      scrollToConsultation({
                        serviceNote: `Interested in Service ${activeService.index}: ${activeService.title}.`,
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Inquire About This Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Compact 3x3 Service Grid with Modern Service Iconography */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredServices.map((service) => {
                const isSelected = activeService.id === service.id;
                const ServiceIcon = SERVICE_ICONS[service.id] || Building2;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setActiveServiceId(service.id)}
                    className={`group text-left rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? 'bg-white border-[#0B192C] ring-1 ring-[#0B192C]/15 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#0B192C] border-[#0B192C] text-[#F4D27A]'
                                : 'bg-slate-50 border-slate-200 text-[#0B192C] group-hover:bg-[#0B192C] group-hover:border-[#0B192C] group-hover:text-[#F4D27A]'
                            }`}
                          >
                            <ServiceIcon className="w-4 h-4" />
                          </span>
                          <span className="font-editorial text-xl font-semibold text-[#C9972C] tabular-nums leading-none">
                            {service.index}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 text-right">
                          {service.cadence}
                        </span>
                      </div>

                      <h3 className="mt-3 text-sm font-bold text-[#0B192C] tracking-tight leading-snug">
                        {service.title}
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {service.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 truncate">{service.deliverables[0]}</span>
                      <span
                        className={`font-semibold whitespace-nowrap shrink-0 ${
                          isSelected ? 'text-[#8C650B]' : 'text-[#0B192C]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Inspect →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Real Building Portfolio Showcase across Asset Classes */}
            <div id="managed-portfolio" className="mt-9 pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8C650B]">
                    Managed Building Portfolio
                  </p>
                  <h3 className="mt-1 font-editorial text-2xl font-semibold tracking-tight text-[#0B192C]">
                    Residential, multi-unit &amp; commercial properties we supervise
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="text-xs font-semibold text-[#0B192C] hover:text-[#8C650B] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  Inspect Live Portfolio in Owner Portal →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PORTFOLIO_ASSET_SHOWCASE.map((asset) => (
                  <article
                    key={asset.id}
                    className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                        <ResilientPropertyImage
                          src={asset.imageUrl}
                          alt={`${asset.title} managed by Salvatore Property Management`}
                          fallbackTitle={asset.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050D19]/80 via-transparent to-transparent pointer-events-none" />
                        <p className="absolute bottom-2.5 left-3.5 right-3.5 text-xs font-medium text-[#F4D27A]">
                          {asset.cities}
                        </p>
                      </div>

                      <div className="p-4">
                        <h4 className="text-base font-bold text-[#0B192C] tracking-tight">
                          {asset.title}
                        </h4>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                          {asset.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-3.5 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          scrollToConsultation({
                            propertyTypeOverride: asset.propertyType,
                            serviceNote: `Requesting management proposal for a ${asset.propertyType}.`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:text-[#8C650B] transition-colors cursor-pointer"
                      >
                        <span>Request {asset.propertyType} Management</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Nationwide Cameroon Google Map Coverage & Verifiable Diaspora Proof */}
        <section id="coverage" className="py-10 lg:py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8C650B]">
                  Cameroon &amp; Diaspora Confidence
                </p>
                <h2 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B192C] [text-wrap:balance]">
                  Whether you are in Cameroon or abroad, manage with confidence
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                Click any hub pin on the Google Map or select a city below to inspect active neighborhoods, turnaround times, and unit counts.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Interactive Google Map */}
              <div className="lg:col-span-6">
                <CameroonCoverageMap
                  cities={CAMEROON_CITIES}
                  selectedCityId={selectedCityId}
                  onSelectCity={setSelectedCityId}
                  onRequestCityAssessment={(cityName) =>
                    scrollToConsultation({ cityOverride: cityName })
                  }
                />
              </div>

              {/* City Hub Details & Compact Outcomes Switcher */}
              <div className="lg:col-span-6 space-y-5">
                <div className="flex flex-wrap gap-1.5">
                  {CAMEROON_CITIES.map((city) => {
                    const active = city.id === selectedCityId;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => setSelectedCityId(city.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#0B192C] text-white border-[#0B192C]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {city.name}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCity.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                    className="bg-[#F8F9FB] border border-slate-200 rounded-xl p-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500">
                          {selectedCity.region} · Active Operations Hub
                        </p>
                        <h3 className="mt-0.5 text-xl font-bold text-[#0B192C]">
                          {selectedCity.name} Property Management
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-medium text-[#8C650B] tabular-nums">
                        {selectedCity.inspectionTurnaround}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] text-slate-500">Managed Units</p>
                        <p className="mt-0.5 text-xl font-bold font-mono tabular-nums text-[#0B192C]">
                          {selectedCity.managedUnits}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Avg Occupancy</p>
                        <p className="mt-0.5 text-xl font-bold font-mono tabular-nums text-[#0B192C]">
                          {selectedCity.avgOccupancy}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Primary Focus</p>
                        <p className="mt-0.5 text-xs font-medium text-[#0B192C] leading-snug">
                          {selectedCity.propertyFocus}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-500">
                          Key Supervised Neighborhoods
                        </p>
                        <p className="mt-0.5 text-xs text-[#0B192C] font-medium">
                          {selectedCity.neighborhoods.join(' · ')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => scrollToConsultation({ cityOverride: selectedCity.name })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Request {selectedCity.name} Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Compact Tabbed Documented Owner Outcomes */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8C650B]">
                      Documented Owner Outcomes
                    </h4>
                    <div className="flex items-center gap-1">
                      {OWNER_OUTCOMES.map((item, idx) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedOutcomeIdx(idx)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                            selectedOutcomeIdx === idx
                              ? 'bg-[#0B192C] text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-[#0B192C]'
                          }`}
                        >
                          {item.owner.split(' ').slice(-1)[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const currentOutcome = OWNER_OUTCOMES[selectedOutcomeIdx] || OWNER_OUTCOMES[0];
                    return (
                      <div className="mt-3 text-xs leading-relaxed space-y-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-bold text-[#0B192C]">{currentOutcome.owner}</p>
                          <p className="text-[11px] text-slate-500">{currentOutcome.context}</p>
                        </div>
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">Before:</span>{' '}
                          {currentOutcome.before}
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-[#8C650B]">Outcome:</span>{' '}
                          {currentOutcome.outcome}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Interactive Yield Estimator + Live Monthly Owner Statement Preview */}
        <section id="estimator" className="py-10 lg:py-12 bg-[#F8F9FB] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Interactive Calculator */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
                    <div>
                      <p className="text-xs font-medium text-[#8C650B]">
                        Transparent Management Planning
                      </p>
                      <h2 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                        Rental Income &amp; Management Estimator
                      </h2>
                    </div>

                    {/* Currency Display Selector */}
                    <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      {(['XAF', 'EUR', 'USD'] as CurrencyCode[]).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setCurrency(code)}
                          className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                            currency === code
                              ? 'bg-white text-[#0B192C] shadow-xs'
                              : 'text-slate-600 hover:text-[#0B192C]'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="est-type"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Property Classification
                      </label>
                      <select
                        id="est-type"
                        value={estType}
                        onChange={(e) => setEstType(e.target.value as PropertyType)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="est-city"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        City / Town in Cameroon
                      </label>
                      <select
                        id="est-city"
                        value={estCity}
                        onChange={(e) => setEstCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      >
                        {CAMEROON_CITIES.map((city) => (
                          <option key={city.id} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                        <label htmlFor="est-units">Number of Units</label>
                        <span className="font-mono tabular-nums font-semibold text-[#0B192C]">
                          {estUnits} {estUnits === 1 ? 'unit' : 'units'}
                        </span>
                      </div>
                      <input
                        id="est-units"
                        type="range"
                        min={1}
                        max={30}
                        value={estUnits}
                        onChange={(e) => setEstUnits(Number(e.target.value))}
                        className="w-full accent-[#0B192C] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                        <label htmlFor="est-rent">Average Monthly Rent / Unit</label>
                        <span className="font-mono tabular-nums font-semibold text-[#0B192C]">
                          {formatXaf(estRentXaf)}
                        </span>
                      </div>
                      <input
                        id="est-rent"
                        type="range"
                        min={50000}
                        max={1500000}
                        step={10000}
                        value={estRentXaf}
                        onChange={(e) => setEstRentXaf(Number(e.target.value))}
                        className="w-full accent-[#0B192C] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Plan Mode Selector */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEstPlan('local')}
                      className={`p-4 text-left rounded-xl border transition-colors cursor-pointer ${
                        estPlan === 'local'
                          ? 'border-[#0B192C] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#0B192C]">
                          In-Country Oversight
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#8C650B]">8% Fee</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        For owners in Cameroon needing rent collection, tenant handling, and monthly inspections.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEstPlan('diaspora')}
                      className={`p-4 text-left rounded-xl border transition-colors cursor-pointer ${
                        estPlan === 'diaspora'
                          ? 'border-[#0B192C] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#0B192C]">
                          Full Diaspora Stewardship
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#8C650B]">10% Fee</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        For owners abroad requiring bi-weekly photo audits, full repair coordination, and international remittance.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Projected figures update your sample monthly owner statement on the right.
                  </p>
                  <button
                    type="button"
                    onClick={() => scrollToConsultation({ fromEstimator: true })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Use Estimate in Consultation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Live Executive Owner Statement + Portal Bridge */}
              <div className="lg:col-span-5 bg-[#091526] text-white rounded-2xl p-6 sm:p-8 border border-[#1E3352] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#1A2F4D]">
                    <div>
                      <p className="text-xs font-medium text-[#F4D27A]">
                        Salvatore Monthly Disbursement Brief
                      </p>
                      <h3 className="mt-1 font-editorial text-xl font-semibold tracking-tight">
                        {estUnits}-Unit {estType} · {estCity}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-300">
                      {estPlan === 'diaspora' ? 'Diaspora Plan' : 'Local Plan'}
                    </span>
                  </div>

                  {/* Line-by-Line Live Statement */}
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-[#152844]">
                      <span className="text-slate-300">Gross Monthly Rent ({estUnits} units)</span>
                      <span className="font-mono tabular-nums font-medium text-white">
                        {formatEstimatorAmount(grossMonthlyXaf)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#152844]">
                      <span className="text-slate-300">
                        Salvatore Fee ({estPlan === 'diaspora' ? '10%' : '8%'})
                      </span>
                      <span className="font-mono tabular-nums text-slate-300">
                        − {formatEstimatorAmount(managementFeeMonthlyXaf)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#152844]">
                      <span className="font-medium text-white">Net Monthly Owner Payout</span>
                      <span className="font-mono tabular-nums text-lg font-bold text-[#F4D27A]">
                        {formatEstimatorAmount(netMonthlyOwnerXaf)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-300">Projected Annual Net Income</span>
                      <span className="font-mono tabular-nums font-semibold text-emerald-400">
                        {formatEstimatorAmount(netAnnualOwnerXaf)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#1A2F4D] space-y-2 text-xs text-slate-300">
                    <p className="font-medium text-white">
                      Included in Every Salvatore Owner Account:
                    </p>
                    <p>· Monthly rent ledger &amp; remittance confirmation on the 1st</p>
                    <p>· Timestamped field inspection photo dossier &amp; repair receipts</p>
                    <p>· Live access to the Owner Operations System ({consultationsCount} active inquiries)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors cursor-pointer"
                >
                  <span>Open Live Owner Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Consultation & Onboarding Form */}
        <section id="consultation" className="py-10 lg:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Contact Column */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8C650B]">
                    Speak With Our Team
                  </p>
                  <h2 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B192C] [text-wrap:balance]">
                    Discuss your property management needs today
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Share basic details about your house, apartment block, or commercial building. Our regional lead will arrange an initial physical assessment and send a tailored proposal.
                  </p>
                </div>

                <div className="bg-[#091526] text-white rounded-2xl p-5 space-y-3.5 border border-[#1E3352]">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#F4D27A] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-300">Direct Telephone &amp; WhatsApp Desk</p>
                      <p className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#F4D27A]">
                        +237 {SALVATORE_CONTACT.phoneDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <a
                      href={SALVATORE_CONTACT.phoneTel}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#091526] bg-[#F4D27A] rounded-lg hover:bg-[#F7DE99] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                    <a
                      href={SALVATORE_CONTACT.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#128C7E] rounded-lg hover:bg-[#0F766E] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>WhatsApp Chat</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white border border-[#2B466D] rounded-lg hover:bg-[#132642] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedPhone ? (
                        <Check className="w-3.5 h-3.5 text-[#F4D27A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-5 space-y-3.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#8C650B] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0B192C]">Nationwide Coverage</p>
                      <p className="mt-0.5">
                        Operating across Douala, Yaoundé, Buea, Limbe, Kribi, Bafoussam, Bamenda, Garoua, and neighboring towns.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#8C650B] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0B192C]">Diaspora Onboarding Protocol</p>
                      <p className="mt-0.5">
                        Video walkthroughs, verified lease agreements, and transparent monthly statements sent wherever you live.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Onboarding Form */}
              <div className="lg:col-span-7 bg-[#F8F9FB] border border-slate-200 rounded-2xl p-5 sm:p-6">
                <h3 className="text-xl font-bold text-[#0B192C]">
                  Request Property Assessment &amp; Proposal
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Completed requests appear immediately in the Owner System consultation queue.
                </p>

                {submittedConfirmation && (
                  <div
                    role="status"
                    className="mt-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3"
                  >
                    <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Property Assessment Request Received</p>
                      <p className="mt-1 text-emerald-800">{submittedConfirmation}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} noValidate className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="owner-name"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Owner Full Name
                      </label>
                      <input
                        id="owner-name"
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Jean-Paul Mbarga"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      />
                      {formErrors.ownerName && (
                        <p className="mt-1 text-xs text-red-700">{formErrors.ownerName}</p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-slate-700 mb-1.5">
                        Where Are You Currently Based?
                      </span>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-lg">
                        {(['Living Abroad', 'In Cameroon'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setLocationMode(mode)}
                            className={`py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                              locationMode === mode
                                ? 'bg-white text-[#0B192C] shadow-xs'
                                : 'text-slate-600 hover:text-[#0B192C]'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="country-city"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        {locationMode === 'Living Abroad'
                          ? 'Country & City of Residence'
                          : 'Your Current Town in Cameroon'}
                      </label>
                      <input
                        id="country-city"
                        type="text"
                        value={countryOrCity}
                        onChange={(e) => setCountryOrCity(e.target.value)}
                        placeholder={
                          locationMode === 'Living Abroad'
                            ? 'e.g. Paris, France / Houston, USA'
                            : 'e.g. Yaoundé'
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      />
                      {formErrors.countryOrCity && (
                        <p className="mt-1 text-xs text-red-700">{formErrors.countryOrCity}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="owner-phone"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Phone or WhatsApp Number
                      </label>
                      <input
                        id="owner-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +237 679 988 242 or +33 6 ..."
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-xs text-red-700">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <label
                        htmlFor="owner-email"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="owner-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@example.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-xs text-red-700">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="prop-city"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Property City in Cameroon
                      </label>
                      <select
                        id="prop-city"
                        value={propertyCity}
                        onChange={(e) => setPropertyCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      >
                        {CAMEROON_CITIES.map((city) => (
                          <option key={city.id} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                        <option value="Other Cameroon Town">Other Cameroon Town</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="prop-units"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Total Units
                      </label>
                      <input
                        id="prop-units"
                        type="number"
                        min={1}
                        value={unitsCount}
                        onChange={(e) => setUnitsCount(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                      />
                      {formErrors.unitsCount && (
                        <p className="mt-1 text-xs text-red-700">{formErrors.unitsCount}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="prop-type"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Property Type
                    </label>
                    <select
                      id="prop-type"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                    >
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prop-notes"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Neighborhood &amp; Current Priorities (Optional)
                    </label>
                    <textarea
                      id="prop-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Share neighborhood, occupancy status, tenant transition, or inspection needs..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Submit Property Management Request</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer with Santino Tech Consulting Credit */}
      <footer className="bg-[#091526] text-slate-300 border-t border-[#1A2F4D]">
        <div className="max-w-7xl mx-auto px-6 py-9">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#1A2F4D]">
            <div>
              <div className="flex items-center gap-2.5 text-white font-editorial font-semibold text-xl">
                <SalvatoreLogoMark className="w-7 h-7 text-white" />
                <span>Salvatore Property Management</span>
              </div>
              <p className="mt-1.5 font-editorial italic text-base text-[#F4D27A]">
                Professional Management. Reliable Service. Peace of Mind.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#services" className="hover:text-white transition-colors">
                Services
              </a>
              <a href="#coverage" className="hover:text-white transition-colors">
                Cameroon Coverage
              </a>
              <a href="#estimator" className="hover:text-white transition-colors">
                Fee Estimator
              </a>
              <button
                type="button"
                onClick={onOpenPortal}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Owner Portal
              </button>
              <a
                href={SALVATORE_CONTACT.phoneTel}
                className="font-mono tabular-nums font-semibold text-[#F4D27A] hover:underline"
              >
                +237 {SALVATORE_CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="pt-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs text-slate-400">
            <p>
              Operating across towns and cities in Cameroon: Douala · Yaoundé · Buea · Limbe · Kribi · Bafoussam · Bamenda · Garoua
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p>© {new Date().getFullYear()} Salvatore Property Management</p>
              <span aria-hidden="true" className="hidden sm:inline text-slate-600">
                |
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>SSL Secured</span>
              </span>
              {onOpenCookieSettings && (
                <>
                  <span aria-hidden="true" className="hidden sm:inline text-slate-600">
                    |
                  </span>
                  <button
                    type="button"
                    onClick={onOpenCookieSettings}
                    className="text-slate-300 hover:text-[#F4D27A] underline underline-offset-4 cursor-pointer"
                  >
                    Cookie Preferences
                  </button>
                </>
              )}
              <span aria-hidden="true" className="hidden sm:inline text-slate-600">
                |
              </span>
              <p>
                Designed by{' '}
                <span className="text-slate-200 font-medium">
                  {SALVATORE_CONTACT.designerCredit}
                </span>{' '}
                ·{' '}
                <a
                  href={SALVATORE_CONTACT.designerTel}
                  className="font-mono tabular-nums text-[#F4D27A] hover:underline"
                >
                  {SALVATORE_CONTACT.designerPhone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Side Action Dock: Animated Back-to-Top + WhatsApp Desk */}
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 z-40 flex flex-col items-end gap-2.5 pointer-events-none">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 18, scale: 0.84 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.84 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -3, scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Back to top of page"
              title="Back to top"
              className="pointer-events-auto group relative w-11 h-11 rounded-full bg-[#091526] text-[#F4D27A] shadow-lg border border-[#243E63] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D27A]"
            >
              {/* Circular scroll progress ring */}
              <svg
                viewBox="0 0 44 44"
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                aria-hidden="true"
              >
                <circle
                  cx="22"
                  cy="22"
                  r="19.5"
                  fill="none"
                  stroke="rgba(244, 210, 122, 0.16)"
                  strokeWidth="2"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="19.5"
                  fill="none"
                  stroke="#F4D27A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 19.5}
                  strokeDashoffset={2 * Math.PI * 19.5 * (1 - scrollProgress)}
                />
              </svg>
              <ArrowUp className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5" />
            </motion.button>
          )}
        </AnimatePresence>

        <a
          href={SALVATORE_CONTACT.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with Salvatore Property Management on WhatsApp (${SALVATORE_CONTACT.phoneDisplay})`}
          className="pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#128C7E] hover:bg-[#0F766E] text-white shadow-lg border border-white/15 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D27A]"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current shrink-0"
            aria-hidden="true"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2Zm5.76 14.01c-.24.68-1.42 1.3-1.97 1.38-.5.07-1.15.1-1.85-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.04.9 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.06 1.14 1.01 2.1 1.33 2.4 1.48.3.15.47.12.65-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.72.81 2.02.96.3.15.49.22.56.34.07.12.07.72-.17 1.4Z" />
          </svg>
          <div className="leading-tight text-left">
            <span className="block text-xs font-semibold whitespace-nowrap">WhatsApp Desk</span>
            <span className="hidden sm:block font-mono tabular-nums text-[11px] text-emerald-100 whitespace-nowrap">
              {SALVATORE_CONTACT.phoneDisplay}
            </span>
          </div>
        </a>
      </div>

      {/* User-triggered Official Service Flyer Reference Modal */}
      {flyerModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Salvatore Property Management Official Flyer"
          onClick={() => setFlyerModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[#0B192C]">
                Official Salvatore Property Management Flyer
              </p>
              <button
                type="button"
                onClick={() => setFlyerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B192C] hover:bg-slate-100 cursor-pointer"
                aria-label="Close flyer preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex justify-center max-h-[70vh] overflow-auto">
              <img
                src={SALVATORE_CONTACT.flyerAssetPath}
                alt="Salvatore Property Management official flyer listing 9 services and phone 679 988 242"
                referrerPolicy="no-referrer"
                className="max-h-[64vh] w-auto rounded-lg object-contain shadow-sm"
              />
            </div>
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <a
                href={SALVATORE_CONTACT.phoneTel}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:text-[#8C650B]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">+237 {SALVATORE_CONTACT.phoneDisplay}</span>
              </a>
              <a
                href={SALVATORE_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#0F766E] rounded-lg transition-colors"
              >
                <span>Message on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
