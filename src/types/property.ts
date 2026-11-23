export type ServiceCategory = 'all' | 'supervision' | 'tenants' | 'maintenance';

export interface ManagementService {
  id: string;
  index: string;
  title: string;
  category: Exclude<ServiceCategory, 'all'>;
  summary: string;
  deliverables: string[];
  cadence: string;
}

export interface CameroonCity {
  id: string;
  name: string;
  region: string;
  placeQuery: string;
  neighborhoods: string[];
  managedUnits: number;
  avgOccupancy: string;
  inspectionTurnaround: string;
  propertyFocus: string;
}

export type PropertyType = 'Apartment Building' | 'Residential House' | 'Commercial Property' | 'Multi-Unit Block';

export interface ManagedProperty {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  type: PropertyType;
  unitsTotal: number;
  unitsOccupied: number;
  monthlyRentPerUnitXaf: number;
  ownerName: string;
  ownerLocation: string;
  lastInspectionDate: string;
  conditionRating: 'Optimal' | 'Attention Needed';
  imageUrl?: string;
}

export type RentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface RentLedgerEntry {
  id: string;
  propertyId: string;
  propertyName: string;
  unitLabel: string;
  tenantName: string;
  city: string;
  dueDate: string;
  amountXaf: number;
  status: RentStatus;
  paymentMethod: string;
  remittedToOwner: boolean;
}

export interface InspectionReport {
  id: string;
  propertyId: string;
  propertyName: string;
  city: string;
  date: string;
  inspector: string;
  overallStatus: 'Passed' | 'Follow-Up Required';
  checklistSummary: string;
  notes: string;
  photosCount: number;
}

export type MaintenanceStatus = 'Reported' | 'Dispatched' | 'Completed';

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  propertyName: string;
  unitLabel: string;
  city: string;
  issue: string;
  trade: 'Plumbing' | 'Electrical' | 'Structural' | 'Cleaning & Grounds';
  priority: 'Urgent' | 'Standard';
  status: MaintenanceStatus;
  estimatedCostXaf: number;
  reportedDate: string;
  contractor: string;
}

export interface TenantApplicant {
  id: string;
  applicantName: string;
  targetProperty: string;
  unitLabel: string;
  city: string;
  occupation: string;
  monthlyIncomeXaf: number;
  proposedRentXaf: number;
  verificationState: 'ID & Income Verified' | 'Reference Check' | 'Placed';
  appliedDate: string;
}

export interface ConsultationRequest {
  id: string;
  ownerName: string;
  locationMode: 'In Cameroon' | 'Living Abroad';
  countryOrCity: string;
  phone: string;
  email: string;
  propertyCity: string;
  propertyType: PropertyType;
  unitsCount: number;
  notes: string;
  submittedAt: string;
}
