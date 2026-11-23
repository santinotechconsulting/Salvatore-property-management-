import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { BUILDING_IMAGES, CAMEROON_CITIES, formatXaf } from '../data/salvatoreData';
import {
  ConsultationRequest,
  InspectionReport,
  MaintenanceStatus,
  MaintenanceTicket,
  ManagedProperty,
  PropertyType,
  RentLedgerEntry,
  RentStatus,
  TenantApplicant,
} from '../types/property';
import { ResilientPropertyImage, SalvatoreLogoMark } from './ArchitecturalVisuals';

type PortalTab =
  | 'overview'
  | 'properties'
  | 'rent'
  | 'inspections'
  | 'maintenance'
  | 'tenants';

interface OwnerPortalProps {
  onBackToWebsite: () => void;
  properties: ManagedProperty[];
  onAddProperty: (prop: Omit<ManagedProperty, 'id' | 'lastInspectionDate' | 'conditionRating'>) => void;
  rentLedger: RentLedgerEntry[];
  onRecordPayment: (entryId: string) => void;
  onSendReminder: (entryId: string) => string;
  inspections: InspectionReport[];
  onAddInspection: (report: Omit<InspectionReport, 'id'>) => void;
  maintenanceTickets: MaintenanceTicket[];
  onAdvanceTicket: (ticketId: string) => void;
  onAddTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'reportedDate' | 'status'>) => void;
  applicants: TenantApplicant[];
  onApproveApplicant: (applicantId: string) => void;
  consultations: ConsultationRequest[];
}

const TAB_META: Record<PortalTab, { label: string; ctaLabel?: string }> = {
  overview: { label: 'Portfolio Overview', ctaLabel: 'Add Property' },
  properties: { label: 'Managed Properties', ctaLabel: 'Add Property' },
  rent: { label: 'Rent Collection & Ledger' },
  inspections: { label: 'Inspections & Photo Reports', ctaLabel: 'Log Inspection' },
  maintenance: { label: 'Maintenance & Repairs', ctaLabel: 'Create Work Order' },
  tenants: { label: 'Tenant Screening & Inquiries' },
};

export function OwnerPortal({
  onBackToWebsite,
  properties,
  onAddProperty,
  rentLedger,
  onRecordPayment,
  onSendReminder,
  inspections,
  onAddInspection,
  maintenanceTickets,
  onAdvanceTicket,
  onAddTicket,
  applicants,
  onApproveApplicant,
  consultations,
}: OwnerPortalProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rentStatusFilter, setRentStatusFilter] = useState<'All' | RentStatus>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Modals & View Modes
  const [propertyViewMode, setPropertyViewMode] = useState<'gallery' | 'table'>('gallery');
  const [modalKind, setModalKind] = useState<'property' | 'inspection' | 'ticket' | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionReport | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop((window.scrollY || 0) > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  // Add Property Form
  const [newPropName, setNewPropName] = useState('');
  const [newPropCity, setNewPropCity] = useState('Douala');
  const [newPropNeighborhood, setNewPropNeighborhood] = useState('');
  const [newPropType, setNewPropType] = useState<PropertyType>('Apartment Building');
  const [newPropUnits, setNewPropUnits] = useState('6');
  const [newPropOccupied, setNewPropOccupied] = useState('5');
  const [newPropRent, setNewPropRent] = useState('250000');
  const [newPropOwner, setNewPropOwner] = useState('');
  const [newPropOwnerLoc, setNewPropOwnerLoc] = useState('');

  // Add Inspection Form
  const [inspPropId, setInspPropId] = useState(properties[0]?.id || '');
  const [inspInspector, setInspInspector] = useState('Brice Kamga');
  const [inspStatus, setInspStatus] = useState<'Passed' | 'Follow-Up Required'>('Passed');
  const [inspChecklist, setInspChecklist] = useState('Structural facade, plumbing lines, electrical meters & perimeter cleanliness.');
  const [inspNotes, setInspNotes] = useState('');
  const [inspPhotos, setInspPhotos] = useState('16');

  // Add Maintenance Ticket Form
  const [tktPropId, setTktPropId] = useState(properties[0]?.id || '');
  const [tktUnit, setTktUnit] = useState('');
  const [tktIssue, setTktIssue] = useState('');
  const [tktTrade, setTktTrade] = useState<MaintenanceTicket['trade']>('Plumbing');
  const [tktPriority, setTktPriority] = useState<MaintenanceTicket['priority']>('Standard');
  const [tktCost, setTktCost] = useState('40000');
  const [tktContractor, setTktContractor] = useState('Douala Pro Maintenance');

  const notify = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => setActionBanner(null), 4000);
  };

  // Derived Portfolio KPIs
  const totalUnits = properties.reduce((sum, p) => sum + p.unitsTotal, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.unitsOccupied, 0);
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0';
  const collectedRentXaf = rentLedger
    .filter((r) => r.status === 'Paid')
    .reduce((sum, r) => sum + r.amountXaf, 0);
  const outstandingRentXaf = rentLedger
    .filter((r) => r.status !== 'Paid')
    .reduce((sum, r) => sum + r.amountXaf, 0);
  const openTicketsCount = maintenanceTickets.filter((t) => t.status !== 'Completed').length;

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesCity = cityFilter === 'All' || p.city === cityFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q);
      return matchesCity && matchesSearch;
    });
  }, [properties, cityFilter, searchQuery]);

  const filteredRent = useMemo(() => {
    return rentLedger.filter((r) => {
      const matchesStatus = rentStatusFilter === 'All' || r.status === rentStatusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.propertyName.toLowerCase().includes(q) ||
        r.tenantName.toLowerCase().includes(q) ||
        r.unitLabel.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rentLedger, rentStatusFilter, searchQuery]);

  const cityBreakdown = useMemo(() => {
    const map = new Map<string, { city: string; unitsTotal: number; unitsOccupied: number; monthlyPotentialXaf: number }>();
    properties.forEach((p) => {
      const existing = map.get(p.city) || {
        city: p.city,
        unitsTotal: 0,
        unitsOccupied: 0,
        monthlyPotentialXaf: 0,
      };
      existing.unitsTotal += p.unitsTotal;
      existing.unitsOccupied += p.unitsOccupied;
      existing.monthlyPotentialXaf += p.unitsOccupied * p.monthlyRentPerUnitXaf;
      map.set(p.city, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.monthlyPotentialXaf - a.monthlyPotentialXaf);
  }, [properties]);

  const maxCityRevenue = Math.max(1, ...cityBreakdown.map((c) => c.monthlyPotentialXaf));

  const handleExportRentCsv = () => {
    const headers = ['Reference', 'Property', 'Unit', 'City', 'Tenant', 'Due Date', 'Amount (XAF)', 'Status', 'Method'];
    const rows = filteredRent.map((r) => [
      r.id,
      `"${r.propertyName.replace(/"/g, '""')}"`,
      `"${r.unitLabel}"`,
      r.city,
      `"${r.tenantName}"`,
      r.dueDate,
      String(r.amountXaf),
      r.status,
      `"${r.paymentMethod}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salvatore-rent-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredRent.length} rent ledger entries to CSV.`);
  };

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim() || !newPropNeighborhood.trim() || !newPropOwner.trim()) return;
    const total = Math.max(1, parseInt(newPropUnits, 10) || 1);
    const occupied = Math.min(total, Math.max(0, parseInt(newPropOccupied, 10) || 0));
    const rent = Math.max(10000, parseInt(newPropRent, 10) || 100000);
    const imageByType: Record<PropertyType, string> = {
      'Apartment Building': BUILDING_IMAGES.twilightResidence,
      'Residential House': BUILDING_IMAGES.diplomaticVilla,
      'Multi-Unit Block': BUILDING_IMAGES.executiveApartments,
      'Commercial Property': BUILDING_IMAGES.commercialPlaza,
    };
    onAddProperty({
      name: newPropName.trim(),
      city: newPropCity,
      neighborhood: newPropNeighborhood.trim(),
      type: newPropType,
      unitsTotal: total,
      unitsOccupied: occupied,
      monthlyRentPerUnitXaf: rent,
      ownerName: newPropOwner.trim(),
      ownerLocation: newPropOwnerLoc.trim() || 'Cameroon / Diaspora',
      imageUrl: imageByType[newPropType],
    });
    setModalKind(null);
    setNewPropName('');
    setNewPropNeighborhood('');
    setNewPropOwner('');
    setNewPropOwnerLoc('');
    notify(`Added "${newPropName.trim()}" (${newPropCity}) to managed portfolio.`);
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProp = properties.find((p) => p.id === inspPropId) || properties[0];
    if (!targetProp || !inspNotes.trim()) return;
    onAddInspection({
      propertyId: targetProp.id,
      propertyName: targetProp.name,
      city: targetProp.city,
      date: new Date().toISOString().slice(0, 10),
      inspector: inspInspector.trim() || 'Salvatore Field Inspector',
      overallStatus: inspStatus,
      checklistSummary: inspChecklist.trim(),
      notes: inspNotes.trim(),
      photosCount: Math.max(1, parseInt(inspPhotos, 10) || 12),
    });
    setModalKind(null);
    setInspNotes('');
    notify(`Inspection report logged for ${targetProp.name}.`);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProp = properties.find((p) => p.id === tktPropId) || properties[0];
    if (!targetProp || !tktIssue.trim()) return;
    onAddTicket({
      propertyId: targetProp.id,
      propertyName: targetProp.name,
      unitLabel: tktUnit.trim() || 'Common Area',
      city: targetProp.city,
      issue: tktIssue.trim(),
      trade: tktTrade,
      priority: tktPriority,
      estimatedCostXaf: Math.max(5000, parseInt(tktCost, 10) || 25000),
      contractor: tktContractor.trim() || 'Salvatore Vetted Vendor',
    });
    setModalKind(null);
    setTktUnit('');
    setTktIssue('');
    notify(`Work order created for ${targetProp.name}.`);
  };

  const openPrimaryModal = () => {
    if (activeTab === 'inspections') {
      setModalKind('inspection');
    } else if (activeTab === 'maintenance') {
      setModalKind('ticket');
    } else {
      setModalKind('property');
    }
  };

  const navItems: { id: PortalTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'properties', label: 'Properties', icon: <Building2 className="w-4 h-4" />, count: properties.length },
    { id: 'rent', label: 'Rent Ledger', icon: <FileSpreadsheet className="w-4 h-4" />, count: rentLedger.length },
    { id: 'inspections', label: 'Inspections', icon: <ClipboardCheck className="w-4 h-4" />, count: inspections.length },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" />, count: openTicketsCount },
    {
      id: 'tenants',
      label: 'Tenants & Inquiries',
      icon: <UserCheck className="w-4 h-4" />,
      count: applicants.length + consultations.length,
    },
  ];

  const renderRentStatus = (status: RentStatus) => {
    if (status === 'Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Paid</span>
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Overdue</span>
      </span>
    );
  };

  const renderTicketStatus = (status: MaintenanceStatus) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Completed</span>
        </span>
      );
    }
    if (status === 'Dispatched') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>Dispatched</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Reported</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0B192C] flex">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex lg:flex-col w-[260px] shrink-0 bg-[#0B192C] text-slate-200 border-r border-[#1E3352]">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-[#1E3352]">
          <SalvatoreLogoMark className="w-7 h-7 text-white shrink-0" />
          <span className="font-editorial text-lg font-semibold tracking-tight text-white whitespace-nowrap">
            Salvatore System
          </span>
        </div>

        <nav aria-label="Owner System Modules" className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#162D4C] text-white'
                    : 'text-slate-300 hover:text-white hover:bg-[#132642]'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span className="font-mono text-xs tabular-nums text-slate-400">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1E3352]">
          <button
            type="button"
            onClick={onBackToWebsite}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 border border-[#2B466D] rounded-lg hover:bg-[#132642] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[260px] bg-[#0B192C] text-slate-200 flex flex-col h-full">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#1E3352]">
              <span className="text-base font-bold text-white">Salvatore System</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white"
                aria-label="Close portal menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg ${
                    activeTab === item.id ? 'bg-[#162D4C] text-white' : 'text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span className="font-mono text-xs tabular-nums text-slate-400">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-[#1E3352]">
              <button
                type="button"
                onClick={onBackToWebsite}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white border border-[#2B466D] rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Public Website</span>
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              aria-label="Open portal navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-500 whitespace-nowrap">Owner Portal</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-[#0B192C] truncate">
                {TAB_META[activeTab].label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBackToWebsite}
              className="hidden sm:inline-flex lg:hidden items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>
            {TAB_META[activeTab].ctaLabel && (
              <button
                type="button"
                onClick={openPrimaryModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{TAB_META[activeTab].ctaLabel}</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
          {actionBanner && (
            <div
              role="status"
              className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{actionBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => setActionBanner(null)}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                aria-label="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4-column flat stat grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Portfolio Occupancy</p>
                  <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0B192C]">
                    {occupancyRate}%
                  </p>
                  <p className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
                    {occupiedUnits} of {totalUnits} units leased
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Monthly Rent Collected</p>
                  <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0B192C]">
                    {formatXaf(collectedRentXaf)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">Remitted &amp; reconciled</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Pending / Overdue Follow-Up</p>
                  <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0B192C]">
                    {formatXaf(outstandingRentXaf)}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">Active collection workflow</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Open Repair Work Orders</p>
                  <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0B192C]">
                    {openTicketsCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {inspections.length} inspection dossiers filed
                  </p>
                </div>
              </div>

              {/* City Occupancy & Revenue Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-semibold text-[#0B192C]">
                      Portfolio Distribution by Cameroon Hub
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Occupied units and projected monthly rent roll across active cities
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {cityBreakdown.length} Active Cities
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {cityBreakdown.map((item) => {
                    const widthPct = Math.round((item.monthlyPotentialXaf / maxCityRevenue) * 100);
                    return (
                      <div key={item.city} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0B192C]">
                            {item.city}{' '}
                            <span className="font-normal text-slate-500 font-mono tabular-nums">
                              ({item.unitsOccupied}/{item.unitsTotal} units)
                            </span>
                          </span>
                          <span className="font-mono tabular-nums font-medium text-[#0B192C]">
                            {formatXaf(item.monthlyPotentialXaf)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0B192C] rounded-full transition-all duration-300"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Rent Ledger & Latest Inspections */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-[#0B192C]">
                      Priority Rent Follow-Up
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('rent')}
                      className="text-xs font-medium text-[#8C650B] hover:underline cursor-pointer"
                    >
                      Open Full Ledger
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                          <th className="py-2.5 px-4 font-medium">Property &amp; Unit</th>
                          <th className="py-2.5 px-4 font-medium">Tenant</th>
                          <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                          <th className="py-2.5 px-4 font-medium">Status</th>
                          <th className="py-2.5 px-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rentLedger.slice(0, 5).map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4">
                              <p className="font-medium text-[#0B192C]">{entry.propertyName}</p>
                              <p className="text-xs text-slate-500">
                                {entry.unitLabel} · {entry.city}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-slate-700">{entry.tenantName}</td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-[#0B192C]">
                              {formatXaf(entry.amountXaf)}
                            </td>
                            <td className="py-3 px-4">{renderRentStatus(entry.status)}</td>
                            <td className="py-3 px-4 text-right">
                              {entry.status !== 'Paid' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRecordPayment(entry.id);
                                    notify(`Recorded payment for ${entry.tenantName} (${entry.unitLabel}).`);
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium text-[#0B192C] border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                                >
                                  Record Payment
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">Remitted</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-[#0B192C]">
                      Latest Field Inspection Reports
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inspections')}
                      className="text-xs font-medium text-[#8C650B] hover:underline cursor-pointer"
                    >
                      All Reports
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {inspections.slice(0, 3).map((report) => (
                      <div key={report.id} className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-mono tabular-nums text-slate-500">
                            {report.date} · {report.city}
                          </span>
                          <span
                            className={`font-medium ${
                              report.overallStatus === 'Passed' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {report.overallStatus}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#0B192C]">{report.propertyName}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{report.notes}</p>
                        <p className="text-xs text-slate-400 font-mono tabular-nums">
                          Inspector: {report.inspector} · {report.photosCount} verification photos
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROPERTIES TAB */}
          {activeTab === 'properties' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search building, neighborhood, or owner..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B192C]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="city-filter" className="text-xs text-slate-500">
                      City:
                    </label>
                    <select
                      id="city-filter"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-[#0B192C]"
                    >
                      <option value="All">All Cities</option>
                      {CAMEROON_CITIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['gallery', 'table'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPropertyViewMode(mode)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                          propertyViewMode === mode
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

              {filteredProperties.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm font-medium text-[#0B192C]">No matching properties found</p>
                  <p className="text-xs text-slate-500">
                    Clear your search filter or register a new Cameroon property into management.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCityFilter('All');
                    }}
                    className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : propertyViewMode === 'gallery' ? (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProperties.map((prop) => (
                    <article
                      key={prop.id}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                          <ResilientPropertyImage
                            src={prop.imageUrl}
                            alt={`${prop.name} in ${prop.neighborhood}, ${prop.city}`}
                            fallbackTitle={prop.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050D19]/85 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                            <div>
                              <p className="text-xs text-[#F4D27A] font-medium">
                                {prop.neighborhood}, {prop.city}
                              </p>
                              <h3 className="text-base font-bold leading-snug">{prop.name}</h3>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{prop.type}</span>
                            <span
                              className={`font-semibold ${
                                prop.conditionRating === 'Optimal'
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {prop.conditionRating}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                            <div>
                              <p className="text-slate-500">Occupancy</p>
                              <p className="mt-0.5 font-mono tabular-nums font-semibold text-[#0B192C]">
                                {prop.unitsOccupied} / {prop.unitsTotal} units
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-500">Rent / Unit</p>
                              <p className="mt-0.5 font-mono tabular-nums font-semibold text-[#0B192C]">
                                {formatXaf(prop.monthlyRentPerUnitXaf)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between gap-2">
                        <span className="truncate">{prop.ownerName}</span>
                        <span className="font-mono text-slate-400 shrink-0">{prop.id}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                        <th className="py-3 px-4 font-medium">Property</th>
                        <th className="py-3 px-4 font-medium">Location</th>
                        <th className="py-3 px-4 font-medium">Asset Type</th>
                        <th className="py-3 px-4 font-medium">Owner</th>
                        <th className="py-3 px-4 font-medium text-right">Occupancy</th>
                        <th className="py-3 px-4 font-medium text-right">Rent / Unit</th>
                        <th className="py-3 px-4 font-medium">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProperties.map((prop) => (
                        <tr key={prop.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 rounded-md overflow-hidden shrink-0 bg-slate-900">
                                <ResilientPropertyImage
                                  src={prop.imageUrl}
                                  alt={prop.name}
                                  fallbackTitle={prop.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-[#0B192C]">{prop.name}</p>
                                <p className="text-xs font-mono text-slate-400">{prop.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {prop.neighborhood}, {prop.city}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{prop.type}</td>
                          <td className="py-3.5 px-4">
                            <p className="text-[#0B192C]">{prop.ownerName}</p>
                            <p className="text-xs text-slate-500">{prop.ownerLocation}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0B192C]">
                            {prop.unitsOccupied} / {prop.unitsTotal}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0B192C]">
                            {formatXaf(prop.monthlyRentPerUnitXaf)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-xs font-medium ${
                                prop.conditionRating === 'Optimal'
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {prop.conditionRating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RENT LEDGER TAB */}
          {activeTab === 'rent' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by tenant, building, or unit..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B192C]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setRentStatusFilter(status)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          rentStatusFilter === status
                            ? 'bg-white text-[#0B192C] shadow-xs'
                            : 'text-slate-600 hover:text-[#0B192C]'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportRentCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B192C] border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                      <th className="py-3 px-4 font-medium">Reference</th>
                      <th className="py-3 px-4 font-medium">Property &amp; Unit</th>
                      <th className="py-3 px-4 font-medium">Tenant</th>
                      <th className="py-3 px-4 font-medium">Due Date</th>
                      <th className="py-3 px-4 font-medium text-right">Amount</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Follow-Up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRent.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{entry.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-[#0B192C]">{entry.propertyName}</p>
                          <p className="text-xs text-slate-500">
                            {entry.unitLabel} · {entry.city}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{entry.tenantName}</td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-600">
                          {entry.dueDate}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-[#0B192C]">
                          {formatXaf(entry.amountXaf)}
                        </td>
                        <td className="py-3.5 px-4">{renderRentStatus(entry.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          {entry.status !== 'Paid' ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const msg = onSendReminder(entry.id);
                                  notify(msg);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                              >
                                Send Notice
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onRecordPayment(entry.id);
                                  notify(`Payment reconciled & queued for owner payout (${entry.unitLabel}).`);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0B192C] rounded-md hover:bg-[#162D4C] whitespace-nowrap cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {entry.paymentMethod} · Remitted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSPECTIONS TAB */}
          {activeTab === 'inspections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {inspections.map((report) => (
                <article
                  key={report.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-mono tabular-nums text-slate-500">
                        {report.id} · {report.date}
                      </span>
                      <span
                        className={`font-semibold ${
                          report.overallStatus === 'Passed' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {report.overallStatus}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-[#0B192C]">
                      {report.propertyName} ({report.city})
                    </h3>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Checked Scope: {report.checklistSummary}
                    </p>
                    <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">{report.notes}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs text-slate-500">
                    <span>
                      Inspector: {report.inspector} ·{' '}
                      <span className="font-mono tabular-nums">{report.photosCount} Photos</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedInspection(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B192C] border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Dossier</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* MAINTENANCE TAB */}
          {activeTab === 'maintenance' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                      <th className="py-3 px-4 font-medium">Ticket</th>
                      <th className="py-3 px-4 font-medium">Property &amp; Scope</th>
                      <th className="py-3 px-4 font-medium">Trade &amp; Contractor</th>
                      <th className="py-3 px-4 font-medium text-right">Est. Cost</th>
                      <th className="py-3 px-4 font-medium">Stage</th>
                      <th className="py-3 px-4 font-medium text-right">Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {maintenanceTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-xs text-slate-600">{ticket.id}</p>
                          <p className="text-xs font-mono tabular-nums text-slate-400">
                            {ticket.reportedDate}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-[#0B192C]">
                            {ticket.propertyName} · {ticket.unitLabel}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{ticket.issue}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-[#0B192C]">{ticket.trade}</p>
                          <p className="text-xs text-slate-500">{ticket.contractor}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0B192C]">
                          {formatXaf(ticket.estimatedCostXaf)}
                        </td>
                        <td className="py-3.5 px-4">{renderTicketStatus(ticket.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          {ticket.status !== 'Completed' ? (
                            <button
                              type="button"
                              onClick={() => {
                                onAdvanceTicket(ticket.id);
                                notify(`Updated work order ${ticket.id} workflow stage.`);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-[#0B192C] border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                            >
                              {ticket.status === 'Reported' ? 'Dispatch Vendor' : 'Mark Completed'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TENANTS & CONSULTATION INQUIRIES TAB */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              {/* Tenant Screening Queue */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-[#0B192C]">
                    Tenant Screening &amp; Placement Pipeline
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                        <th className="py-3 px-4 font-medium">Applicant</th>
                        <th className="py-3 px-4 font-medium">Target Unit</th>
                        <th className="py-3 px-4 font-medium text-right">Verified Income</th>
                        <th className="py-3 px-4 font-medium text-right">Monthly Rent</th>
                        <th className="py-3 px-4 font-medium">Verification</th>
                        <th className="py-3 px-4 font-medium text-right">Placement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applicants.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#0B192C]">{app.applicantName}</p>
                            <p className="text-xs text-slate-500">{app.occupation}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-[#0B192C]">{app.targetProperty}</p>
                            <p className="text-xs text-slate-500">
                              {app.unitLabel} · {app.city}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                            {formatXaf(app.monthlyIncomeXaf)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0B192C]">
                            {formatXaf(app.proposedRentXaf)}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                            {app.verificationState}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {app.verificationState !== 'Placed' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onApproveApplicant(app.id);
                                  notify(`Placed ${app.applicantName} into ${app.unitLabel}.`);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0B192C] rounded-md hover:bg-[#162D4C] whitespace-nowrap cursor-pointer"
                              >
                                Approve &amp; Place
                              </button>
                            ) : (
                              <span className="text-xs font-medium text-emerald-700">
                                Lease Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submitted Website Consultation Inquiries */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#0B192C]">
                    Incoming Owner Consultation Requests
                  </h2>
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {consultations.length} Logged
                  </span>
                </div>
                {consultations.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Inbox className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-sm font-medium text-[#0B192C]">
                      No new consultation requests yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Submit the onboarding form on the public website to test live intake here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {consultations.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#0B192C]">
                            {req.ownerName} · {req.locationMode} ({req.countryOrCity})
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {req.unitsCount} {req.unitsCount === 1 ? 'unit' : 'units'} ({req.propertyType}) in{' '}
                            <span className="font-medium text-[#0B192C]">{req.propertyCity}</span>
                          </p>
                          {req.notes && (
                            <p className="mt-1 text-xs text-slate-500">{req.notes}</p>
                          )}
                        </div>
                        <div className="text-left sm:text-right text-xs font-mono tabular-nums text-slate-600 shrink-0">
                          <p>{req.phone}</p>
                          <p className="text-slate-400 mt-0.5">{req.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Property / Inspection / Ticket Modal */}
      {modalKind && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0B192C]">
                {modalKind === 'property' && 'Add Property to Management'}
                {modalKind === 'inspection' && 'Log Field Inspection Report'}
                {modalKind === 'ticket' && 'Create Maintenance Work Order'}
              </h3>
              <button
                type="button"
                onClick={() => setModalKind(null)}
                className="p-1.5 text-slate-500 hover:text-[#0B192C] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalKind === 'property' && (
              <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Building / Property Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newPropName}
                    onChange={(e) => setNewPropName(e.target.value)}
                    placeholder="e.g. Bonamoussadi Executive Flats"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                    <select
                      value={newPropCity}
                      onChange={(e) => setNewPropCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {CAMEROON_CITIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Neighborhood
                    </label>
                    <input
                      required
                      type="text"
                      value={newPropNeighborhood}
                      onChange={(e) => setNewPropNeighborhood(e.target.value)}
                      placeholder="e.g. Makepe"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={newPropType}
                      onChange={(e) => setNewPropType(e.target.value as PropertyType)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Apartment Building">Apartment Building</option>
                      <option value="Residential House">Residential House</option>
                      <option value="Multi-Unit Block">Multi-Unit Block</option>
                      <option value="Commercial Property">Commercial Property</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Units</label>
                    <input
                      type="number"
                      min={1}
                      value={newPropUnits}
                      onChange={(e) => setNewPropUnits(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Occupied</label>
                    <input
                      type="number"
                      min={0}
                      value={newPropOccupied}
                      onChange={(e) => setNewPropOccupied(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Owner Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={newPropOwner}
                      onChange={(e) => setNewPropOwner(e.target.value)}
                      placeholder="e.g. Paul Biya Jr. / Owner"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Monthly Rent / Unit (FCFA)
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={5000}
                      value={newPropRent}
                      onChange={(e) => setNewPropRent(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Owner Residence (Diaspora or Local)
                  </label>
                  <input
                    type="text"
                    value={newPropOwnerLoc}
                    onChange={(e) => setNewPropOwnerLoc(e.target.value)}
                    placeholder="e.g. Berlin, Germany (Diaspora)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalKind(null)}
                    className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] cursor-pointer"
                  >
                    Save Property
                  </button>
                </div>
              </form>
            )}

            {modalKind === 'inspection' && (
              <form onSubmit={handleCreateInspection} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Property</label>
                  <select
                    value={inspPropId}
                    onChange={(e) => setInspPropId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Inspector Name
                    </label>
                    <input
                      type="text"
                      value={inspInspector}
                      onChange={(e) => setInspInspector(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Result</label>
                    <select
                      value={inspStatus}
                      onChange={(e) =>
                        setInspStatus(e.target.value as 'Passed' | 'Follow-Up Required')
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Passed">Passed</option>
                      <option value="Follow-Up Required">Follow-Up Required</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Checklist Scope
                  </label>
                  <input
                    type="text"
                    value={inspChecklist}
                    onChange={(e) => setInspChecklist(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Field Observations &amp; Owner Notes
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={inspNotes}
                    onChange={(e) => setInspNotes(e.target.value)}
                    placeholder="Summarize exterior, plumbing, electrical, and caretaker performance..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Verification Photos Attached
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={inspPhotos}
                    onChange={(e) => setInspPhotos(e.target.value)}
                    className="w-28 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalKind(null)}
                    className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] cursor-pointer"
                  >
                    Publish Report
                  </button>
                </div>
              </form>
            )}

            {modalKind === 'ticket' && (
              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Property</label>
                    <select
                      value={tktPropId}
                      onChange={(e) => setTktPropId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Unit / Area
                    </label>
                    <input
                      type="text"
                      value={tktUnit}
                      onChange={(e) => setTktUnit(e.target.value)}
                      placeholder="e.g. Apt 3B or Roof Tank"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Repair Description
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={tktIssue}
                    onChange={(e) => setTktIssue(e.target.value)}
                    placeholder="Describe repair or cleaning scope..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Trade</label>
                    <select
                      value={tktTrade}
                      onChange={(e) => setTktTrade(e.target.value as MaintenanceTicket['trade'])}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Structural">Structural</option>
                      <option value="Cleaning & Grounds">Cleaning &amp; Grounds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={tktPriority}
                      onChange={(e) =>
                        setTktPriority(e.target.value as MaintenanceTicket['priority'])
                      }
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Est. Cost (FCFA)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      step={5000}
                      value={tktCost}
                      onChange={(e) => setTktCost(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assigned Local Contractor
                  </label>
                  <input
                    type="text"
                    value={tktContractor}
                    onChange={(e) => setTktContractor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalKind(null)}
                    className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#162D4C] cursor-pointer"
                  >
                    Create Work Order
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Inspection Dossier Detail Modal */}
      {selectedInspection && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Field inspection dossier"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-slate-500">
                  {selectedInspection.id} · {selectedInspection.date}
                </p>
                <h3 className="text-base font-bold text-[#0B192C]">
                  {selectedInspection.propertyName} ({selectedInspection.city})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="p-1.5 text-slate-500 hover:text-[#0B192C] cursor-pointer"
                aria-label="Close inspection dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-900">
                <ResilientPropertyImage
                  src={
                    properties.find((p) => p.id === selectedInspection.propertyId)?.imageUrl ||
                    BUILDING_IMAGES.twilightResidence
                  }
                  alt={`Field inspection visual for ${selectedInspection.propertyName}`}
                  fallbackTitle={selectedInspection.propertyName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-600">Field Inspector</span>
                <span className="font-medium text-[#0B192C]">{selectedInspection.inspector}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-600">Inspection Result</span>
                <span
                  className={`font-semibold ${
                    selectedInspection.overallStatus === 'Passed'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {selectedInspection.overallStatus}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Verified Inspection Zones</p>
                <p className="mt-1 text-slate-800">{selectedInspection.checklistSummary}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Field Notes</p>
                <p className="mt-1 text-slate-700 leading-relaxed">{selectedInspection.notes}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium text-[#0B192C]">
                  <span>Timestamped Photo Verification Log</span>
                  <span className="font-mono tabular-nums">
                    {selectedInspection.photosCount} Files Verified
                  </span>
                </div>
                <p className="text-slate-600">
                  Exterior Perimeter · Main Entrance &amp; Stairwell · Utility Water/ENEO Meters · Roof Drainage &amp; Caretaker Log
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.85 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Back to top"
            title="Back to top"
            className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 z-40 group w-11 h-11 rounded-full bg-[#091526] text-[#F4D27A] shadow-lg border border-[#243E63] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D27A]"
          >
            <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
