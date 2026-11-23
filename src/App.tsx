import { Suspense, lazy, useEffect, useState } from 'react';
import { CookieConsentBar, CookiePreference } from './components/CookieConsentBar';
import { PublicWebsite } from './components/PublicWebsite';

const OwnerPortal = lazy(() =>
  import('./components/OwnerPortal').then((module) => ({
    default: module.OwnerPortal,
  }))
);

const COOKIE_STORAGE_KEY = 'salvatore_cookie_consent_v1';
import {
  INITIAL_APPLICANTS,
  INITIAL_INSPECTIONS,
  INITIAL_MAINTENANCE,
  INITIAL_PROPERTIES,
  INITIAL_RENT_LEDGER,
} from './data/salvatoreData';
import {
  ConsultationRequest,
  InspectionReport,
  MaintenanceTicket,
  ManagedProperty,
  RentLedgerEntry,
  TenantApplicant,
} from './types/property';

export default function App() {
  const [viewMode, setViewMode] = useState<'website' | 'portal'>('website');
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [cookiePreference, setCookiePreference] = useState<CookiePreference | null>(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_STORAGE_KEY);
      return saved === 'all' || saved === 'essential' ? saved : null;
    } catch {
      return null;
    }
  });
  const [cookieBannerOpen, setCookieBannerOpen] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_STORAGE_KEY);
      return saved !== 'all' && saved !== 'essential';
    } catch {
      return true;
    }
  });

  const handleSelectCookiePreference = (pref: CookiePreference) => {
    setCookiePreference(pref);
    setCookieBannerOpen(false);
    try {
      window.localStorage.setItem(COOKIE_STORAGE_KEY, pref);
    } catch {
      // Ignore storage failures in restricted private browsing modes
    }
  };

  useEffect(() => {
    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  useEffect(() => {
    const origin = window.location.origin;
    const pageUrl = `${origin}${window.location.pathname}`;
    const absoluteFlyerUrl = `${origin}/assets/aistudio/Screenshot_20261123_172756_WhatsApp_eb29603e.jpg`;

    const upsertLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let linkEl = document.querySelector<HTMLLinkElement>(selector);
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.rel = rel;
        if (hreflang) linkEl.hreflang = hreflang;
        document.head.appendChild(linkEl);
      }
      linkEl.href = href;
    };

    const upsertMeta = (attrName: 'property' | 'name', key: string, value: string) => {
      let metaEl = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${key}"]`);
      if (!metaEl) {
        metaEl = document.createElement('meta');
        metaEl.setAttribute(attrName, key);
        document.head.appendChild(metaEl);
      }
      metaEl.content = value;
    };

    upsertLink('canonical', pageUrl);
    upsertLink('alternate', pageUrl, 'en-cm');
    upsertLink('alternate', pageUrl, 'en');
    upsertLink('alternate', pageUrl, 'x-default');

    upsertMeta('property', 'og:url', pageUrl);
    upsertMeta('property', 'og:image', absoluteFlyerUrl);
    upsertMeta('name', 'twitter:image', absoluteFlyerUrl);

    const ldScript = document.getElementById('salvatore-structured-data');
    if (ldScript?.textContent) {
      try {
        const parsed = JSON.parse(ldScript.textContent) as {
          '@graph'?: Array<Record<string, unknown>>;
        };
        if (Array.isArray(parsed['@graph'])) {
          parsed['@graph'] = parsed['@graph'].map((node) => {
            if (node['@type'] === 'WebSite') {
              return { ...node, '@id': `${origin}/#website`, url: pageUrl };
            }
            if (node['@type'] === 'RealEstateAgent') {
              return {
                ...node,
                '@id': `${origin}/#organization`,
                url: pageUrl,
                image: absoluteFlyerUrl,
              };
            }
            if (node['@type'] === 'WebApplication') {
              return { ...node, url: pageUrl };
            }
            return node;
          });
          ldScript.textContent = JSON.stringify(parsed);
        }
      } catch {
        // Leave static JSON-LD intact if parsing fails
      }
    }
  }, []);

  useEffect(() => {
    const isPortal = viewMode === 'portal';
    const nextTitle = isPortal
      ? 'Owner Portal — Salvatore Property Management'
      : 'Salvatore Property Management | Cameroon Property Managers';
    const nextDesc = isPortal
      ? 'Live owner operations portal for tracking Cameroon property occupancy, monthly rent remittance, inspections, and maintenance.'
      : 'Trusted property management in Douala, Yaoundé, Buea & across Cameroon. Tenant screening, rent collection, inspections & repairs. Call +237 679 988 242.';

    document.title = nextTitle;
    const descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descMeta) descMeta.content = nextDesc;
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = nextTitle;
    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = nextDesc;
    const twTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = nextTitle;
    const twDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = nextDesc;
  }, [viewMode]);

  const [properties, setProperties] = useState<ManagedProperty[]>(INITIAL_PROPERTIES);
  const [rentLedger, setRentLedger] = useState<RentLedgerEntry[]>(INITIAL_RENT_LEDGER);
  const [inspections, setInspections] = useState<InspectionReport[]>(INITIAL_INSPECTIONS);
  const [maintenanceTickets, setMaintenanceTickets] =
    useState<MaintenanceTicket[]>(INITIAL_MAINTENANCE);
  const [applicants, setApplicants] = useState<TenantApplicant[]>(INITIAL_APPLICANTS);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([
    {
      id: 'REQ-501',
      ownerName: 'Emmanuel Nkeng',
      locationMode: 'Living Abroad',
      countryOrCity: 'Toronto, Canada',
      phone: '+1 416 555 0194',
      email: 'e.nkeng@example.com',
      propertyCity: 'Douala',
      propertyType: 'Apartment Building',
      unitsCount: 6,
      notes: 'Newly completed 3-story building in Kotto needing tenant screening and monthly supervision.',
      submittedAt: '2026-11-22',
    },
  ]);

  const handleOpenPortal = () => {
    setViewMode('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToWebsite = () => {
    setViewMode('website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitConsultation = (
    request: Omit<ConsultationRequest, 'id' | 'submittedAt'>
  ) => {
    const nextRequest: ConsultationRequest = {
      ...request,
      id: `REQ-${502 + consultations.length}`,
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    setConsultations((prev) => [nextRequest, ...prev]);
  };

  const handleAddProperty = (
    prop: Omit<ManagedProperty, 'id' | 'lastInspectionDate' | 'conditionRating'>
  ) => {
    const newProp: ManagedProperty = {
      ...prop,
      id: `PROP-${101 + properties.length}`,
      lastInspectionDate: new Date().toISOString().slice(0, 10),
      conditionRating: 'Optimal',
    };
    setProperties((prev) => [newProp, ...prev]);
  };

  const handleRecordPayment = (entryId: string) => {
    setRentLedger((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, status: 'Paid', remittedToOwner: true }
          : entry
      )
    );
  };

  const handleSendReminder = (entryId: string): string => {
    const target = rentLedger.find((r) => r.id === entryId);
    if (!target) return 'Payment reminder logged.';
    return `Payment follow-up notice dispatched to ${target.tenantName} (${target.unitLabel}).`;
  };

  const handleAddInspection = (report: Omit<InspectionReport, 'id'>) => {
    const nextReport: InspectionReport = {
      ...report,
      id: `INSP-${413 + inspections.length}`,
    };
    setInspections((prev) => [nextReport, ...prev]);
    setProperties((prev) =>
      prev.map((p) =>
        p.id === report.propertyId
          ? {
              ...p,
              lastInspectionDate: report.date,
              conditionRating:
                report.overallStatus === 'Passed' ? 'Optimal' : 'Attention Needed',
            }
          : p
      )
    );
  };

  const handleAdvanceTicket = (ticketId: string) => {
    setMaintenanceTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const nextStatus =
          t.status === 'Reported' ? 'Dispatched' : 'Completed';
        return { ...t, status: nextStatus };
      })
    );
  };

  const handleAddTicket = (
    ticket: Omit<MaintenanceTicket, 'id' | 'reportedDate' | 'status'>
  ) => {
    const nextTicket: MaintenanceTicket = {
      ...ticket,
      id: `MNT-${211 + maintenanceTickets.length}`,
      reportedDate: new Date().toISOString().slice(0, 10),
      status: 'Reported',
    };
    setMaintenanceTickets((prev) => [nextTicket, ...prev]);
  };

  const handleApproveApplicant = (applicantId: string) => {
    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId ? { ...app, verificationState: 'Placed' } : app
      )
    );
  };

  const quotaBanner = mapsQuotaExceeded ? (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  ) : null;

  if (viewMode === 'portal') {
    return (
      <>
        {quotaBanner}
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#F8F9FB] text-[#0B192C] flex flex-col items-center justify-center p-6">
              <div className="w-9 h-9 rounded-full border-2 border-[#C9972C] border-t-transparent animate-spin" />
              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading Salvatore Owner Portal...
              </p>
            </div>
          }
        >
          <OwnerPortal
            onBackToWebsite={handleBackToWebsite}
            properties={properties}
            onAddProperty={handleAddProperty}
            rentLedger={rentLedger}
            onRecordPayment={handleRecordPayment}
            onSendReminder={handleSendReminder}
            inspections={inspections}
            onAddInspection={handleAddInspection}
            maintenanceTickets={maintenanceTickets}
            onAdvanceTicket={handleAdvanceTicket}
            onAddTicket={handleAddTicket}
            applicants={applicants}
            onApproveApplicant={handleApproveApplicant}
            consultations={consultations}
          />
        </Suspense>
        <CookieConsentBar
          isOpen={cookieBannerOpen}
          currentPreference={cookiePreference}
          onSelectPreference={handleSelectCookiePreference}
          onDismiss={() => setCookieBannerOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      {quotaBanner}
      <PublicWebsite
        onOpenPortal={handleOpenPortal}
        onSubmitConsultation={handleSubmitConsultation}
        consultationsCount={consultations.length}
        onOpenCookieSettings={() => setCookieBannerOpen(true)}
      />
      <CookieConsentBar
        isOpen={cookieBannerOpen}
        currentPreference={cookiePreference}
        onSelectPreference={handleSelectCookiePreference}
        onDismiss={() => setCookieBannerOpen(false)}
      />
    </>
  );
}
