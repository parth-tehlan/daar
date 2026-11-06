/* Shared contracts. Lead-owned — do not edit without approval. */

/* ───────── Onboarding answers ───────── */

export type Purpose = 'live' | 'office' | 'rent' | 'hold';
export type Bedrooms = 'studio' | '1' | '2' | '3' | '4+';
export type Financing = 'cash' | 'mortgage';
export type PlanPreference = 'any' | 'post-handover';
export type Priority =
  | 'yield'
  | 'growth'
  | 'reliability'
  | 'water'
  | 'schools'
  | 'commute'
  | 'quiet';

export type DistrictId =
  | 'marina'
  | 'palm'
  | 'jvc'
  | 'dubai-hills'
  | 'downtown'
  | 'business-bay'
  | 'mbr-city'
  | 'creek-harbour';

export interface Answers {
  purpose: Purpose | null;
  /** AED, inclusive range */
  budget: [number, number];
  /** used when purpose !== 'office' */
  bedrooms: Bedrooms[];
  /** sq ft range, used when purpose === 'office' */
  officeSqft: [number, number];
  /** latest acceptable handover, as fractional year: 2028.5 = Q3 2028 */
  handoverBy: number;
  financing: Financing | null;
  /** 20–80, only meaningful for mortgage */
  downPaymentPct: number;
  planPreference: PlanPreference;
  /** empty = open to anywhere */
  areas: DistrictId[];
  /** up to 3, in order of importance */
  priorities: Priority[];
}

export const DEFAULT_ANSWERS: Answers = {
  purpose: null,
  budget: [1_200_000, 3_000_000],
  bedrooms: [],
  officeSqft: [600, 2000],
  handoverBy: 2029.0,
  financing: null,
  downPaymentPct: 30,
  planPreference: 'any',
  areas: [],
  priorities: [],
};

export const ONBOARDING_STEPS = [
  'purpose',
  'budget',
  'size',
  'handover',
  'financing',
  'areas',
  'priorities',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/* ───────── Geography ───────── */

export interface District {
  id: DistrictId;
  name: string;
  /** real-world centre used for the OSM bake and camera targets */
  lat: number;
  lon: number;
  /** one plain sentence, broker voice */
  note: string;
}

export const WORLD_ORIGIN = { lat: 25.15, lon: 55.23 } as const;

export const DISTRICTS: District[] = [
  { id: 'marina', name: 'Dubai Marina', lat: 25.0805, lon: 55.1403, note: 'Dense waterfront towers, highest short-let demand in the city.' },
  { id: 'palm', name: 'Palm Jumeirah', lat: 25.1124, lon: 55.139, note: 'Beachfront scarcity; limited new supply, premium resale.' },
  { id: 'jvc', name: 'Jumeirah Village Circle', lat: 25.0592, lon: 55.2093, note: 'Mid-market, strong gross yields, heavy pipeline of mid-rise.' },
  { id: 'dubai-hills', name: 'Dubai Hills Estate', lat: 25.1095, lon: 55.2455, note: 'Master-planned, schools and park, family end-user market.' },
  { id: 'downtown', name: 'Downtown Dubai', lat: 25.1955, lon: 55.2755, note: 'Prime core around the Burj; tight land, steady capital value.' },
  { id: 'business-bay', name: 'Business Bay', lat: 25.1855, lon: 55.2635, note: 'Canal-side mixed use; offices and apartments side by side.' },
  { id: 'mbr-city', name: 'MBR City', lat: 25.1765, lon: 55.3075, note: 'Low-density villas and lagoon towers, ten minutes to Downtown.' },
  { id: 'creek-harbour', name: 'Dubai Creek Harbour', lat: 25.2005, lon: 55.3455, note: 'New waterfront district, early phase pricing, long horizon.' },
];

/** equirectangular projection, metres. x = east, z = −north, y = up */
export function project(lat: number, lon: number): { x: number; z: number } {
  const R = 6_371_000;
  const toRad = Math.PI / 180;
  const x = (lon - WORLD_ORIGIN.lon) * toRad * R * Math.cos(WORLD_ORIGIN.lat * toRad);
  const z = -(lat - WORLD_ORIGIN.lat) * toRad * R;
  return { x, z };
}

/* ───────── Placeholder market data ───────── */

export interface PastProject {
  name: string;
  district: DistrictId;
  launchYear: number;
  /** "Q4 2019" */
  handoverPromised: string;
  handoverActual: string;
  delayMonths: number;
  launchPsf: number;
  currentPsf: number;
}

export interface Developer {
  id: string;
  name: string;
  founded: number;
  deliveredCount: number;
  avgDelayMonths: number;
  /** annualised, from launch to today, across past projects */
  avgAnnualAppreciationPct: number;
  pastProjects: PastProject[];
}

export interface UnitType {
  kind: Bedrooms | 'office';
  sqft: number;
  priceAED: number;
  estAnnualRentAED: number;
}

export interface PaymentMilestone {
  /** "On booking", "During construction", "On handover", "2 yrs post-handover" */
  label: string;
  pct: number;
  /** "Nov 2026" or "Q3 2028" */
  when: string;
}

export interface Project {
  id: string;
  name: string;
  /** e.g. "Tower B" or "Phase 2" — optional subtitle */
  subtitle?: string;
  developerId: string;
  district: DistrictId;
  /** exact site location (inside the district's baked radius) */
  lat: number;
  lon: number;
  /** massing for the synthesised off-plan tower */
  floors: number;
  heightM: number;
  footprintM: { w: number; d: number };
  rotationDeg: number;
  launched: string;
  handoverPromised: string;
  handoverPromisedYear: number;
  constructionPct: number;
  units: UnitType[];
  paymentPlan: PaymentMilestone[];
  serviceChargePsf: number;
  purposes: Purpose[];
  tags: Priority[];
  /** 2–4 short facts: "4 min walk to Marina tram" */
  facts: string[];
}

/* ───────── Matching ───────── */

export interface FitReason {
  /** what the user told us, e.g. "You're renting it out" */
  because: string;
  /** what we found, e.g. "Net yield ≈ 6.8%, top quartile for Marina" */
  finding: string;
}

export interface Match {
  project: Project;
  developer: Developer;
  /** 0–100 */
  score: number;
  /** the unit type that best fits the answers */
  bestUnit: UnitType;
  reasons: FitReason[];
  /** honest caveat, e.g. "Handover likely slips past your Q4 2028 window" */
  caveat?: string;
}

/* ───────── Scene contract ───────── */

export type SceneMode = 'onboarding' | 'results' | 'detail';

export interface SceneProps {
  mode: SceneMode;
  /** onboarding step index — camera composes differently per step */
  step: number;
  /** districts to emphasise (areas step / results) */
  focusDistricts: DistrictId[];
  /** projects with markers in results mode */
  projects: Project[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

/* ───────── App view state ───────── */

export type View =
  | { kind: 'onboarding'; step: number }
  | { kind: 'results' }
  | { kind: 'detail'; projectId: string };

export type Plate = '166' | '303' | '296';
