// ---------------------------------------------------------------------------
// Public health authorities you can report your investigation to. Reporting
// timelines and thresholds genuinely differ by jurisdiction — this is
// simplified for teaching purposes, not a substitute for actual notifiable-
// disease regulations, which change and vary by exact pathogen.
// ---------------------------------------------------------------------------

export interface HealthAuthority {
  key: string
  name: string
  color: string
  urgentWindowHours: number
  routineWindowDays: number
  note: string
}

export const AUTHORITIES: HealthAuthority[] = [
  { key: 'CDC', name: 'U.S. CDC / State Health Dept.', color: '#38c0e0', urgentWindowHours: 24, routineWindowDays: 7, note: 'Urgent (Class A-type) conditions: report within 24 hours. Routine notifiable conditions: within the standard weekly cycle.' },
  { key: 'ECDC', name: 'ECDC (EU)', color: '#8a6fe8', urgentWindowHours: 24, routineWindowDays: 7, note: 'EU Member States report urgent threats to the Early Warning and Response System within 24 hours of assessment.' },
  { key: 'UKHSA', name: 'UK Health Security Agency', color: '#e85f5f', urgentWindowHours: 24, routineWindowDays: 3, note: 'Registered medical practitioners must notify certain diseases to UKHSA; urgent clusters are expected within 24 hours.' },
  { key: 'NCDC', name: 'NCDC / IDSP (India)', color: '#f0a838', urgentWindowHours: 24, routineWindowDays: 7, note: 'Integrated Disease Surveillance Programme: outbreak-prone illness reported weekly (\"P\" form), urgent alerts (\"S\" form) reported within 24 hours.' },
  { key: 'WHO', name: 'WHO (IHR Focal Point)', color: '#4ade95', urgentWindowHours: 48, routineWindowDays: 14, note: 'Events that may meet Public Health Emergency of International Concern criteria are assessed and notified within 48 hours under the IHR.' },
  { key: 'PAHO', name: 'PAHO (Americas)', color: '#e0a8f0', urgentWindowHours: 24, routineWindowDays: 7, note: 'Regional arm of WHO for the Americas; follows IHR-aligned urgent reporting for events of regional concern.' },
  { key: 'ChinaCDC', name: 'China CDC', color: '#f0e068', urgentWindowHours: 24, routineWindowDays: 7, note: 'Class A infectious disease outbreaks require reporting within 2 hours in practice; this simulation uses a 24-hour urgent benchmark for comparability.' },
  { key: 'AfricaCDC', name: 'Africa CDC', color: '#68d0f0', urgentWindowHours: 24, routineWindowDays: 7, note: 'Continental public health agency coordinating Member State outbreak response and reporting under the Africa CDC mandate.' },
]

export function getAuthority(key: string): HealthAuthority {
  return AUTHORITIES.find((a) => a.key === key) ?? AUTHORITIES[0]
}
