export interface UnifiedProvider {
  id: string;
  name: string;
  type: 'traditional' | 'integrative' | 'naturopathic' | 'homeopathic' | 'functional' | 'holistic' | 'chiropractic';
  specialty: string;
  location: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  pandasExpert: boolean;
  pandasExperience?: boolean;
  notes?: string;
  treatments?: string[];
  acceptsInsurance?: boolean;
  telemedicine?: boolean;
  requiresReferral?: boolean;
  reviews?: Review[];
  availableAppointments?: string[];
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  type: 'in-person' | 'telemedicine';
}