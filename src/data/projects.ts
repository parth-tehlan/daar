/* Fictional off-plan projects. Prices are AED per sq ft, Dubai 2026 off-plan. */
import type { Bedrooms, DistrictId, PaymentMilestone, Priority, Project, Purpose, UnitType } from '../types';
import { DISTRICTS } from '../types';
import { NOW, addQuarters, parseMonthYear, parseQuarter } from './util';

/** a unit priced by sq ft, with rent set from a gross yield */
function u(kind: Bedrooms | 'office', sqft: number, psf: number, grossPct: number): UnitType {
  const priceAED = Math.round((sqft * psf) / 1000) * 1000;
  return { kind, sqft, priceAED, estAnnualRentAED: Math.round((priceAED * grossPct) / 100 / 100) * 100 };
}

type PlanKind = 'standard' | 'post-60-40' | 'post-70-30' | 'light';

function plan(kind: PlanKind, launched: string, handover: string): PaymentMilestone[] {
  const [mon, yr] = launched.split(' ');
  const lastBuild = addQuarters(handover, -1);
  switch (kind) {
    case 'post-60-40':
      return [
        { label: 'On booking', pct: 10, when: launched },
        { label: 'During construction', pct: 40, when: `Quarterly to ${lastBuild}` },
        { label: 'On handover', pct: 10, when: handover },
        { label: '2 yrs post-handover', pct: 40, when: `Monthly to ${addQuarters(handover, 8)}` },
      ];
    case 'post-70-30':
      return [
        { label: 'On booking', pct: 20, when: launched },
        { label: 'During construction', pct: 40, when: `Every 6 months to ${lastBuild}` },
        { label: 'On handover', pct: 10, when: handover },
        { label: '3 yrs post-handover', pct: 30, when: `Quarterly to ${addQuarters(handover, 12)}` },
      ];
    case 'light':
      return [
        { label: 'On booking', pct: 10, when: launched },
        { label: 'First year', pct: 10, when: `${mon} ${Number(yr) + 1}` },
        { label: 'During construction', pct: 30, when: `Every 6 months to ${lastBuild}` },
        { label: 'On handover', pct: 50, when: handover },
      ];
    default:
      return [
        { label: 'On booking', pct: 20, when: launched },
        { label: 'During construction', pct: 40, when: `Every 6 months to ${lastBuild}` },
        { label: 'On handover', pct: 40, when: handover },
      ];
  }
}

/** offsets are in thousandths of a degree from the district centre */
interface Spec {
  id: string;
  name: string;
  subtitle?: string;
  developerId: string;
  district: DistrictId;
  dLat: number;
  dLon: number;
  floors: number;
  w: number;
  d: number;
  rot: number;
  launched: string;
  handover: string;
  plan: PlanKind;
  units: UnitType[];
  sc: number;
  purposes: Purpose[];
  tags: Priority[];
  facts: string[];
}

function build(s: Spec): Project {
  const c = DISTRICTS.find((d) => d.id === s.district)!;
  const promisedYear = parseQuarter(s.handover);
  const start = parseMonthYear(s.launched) + 0.5; // ground works start about six months after launch
  const pct = Math.round(100 * Math.min(1, Math.max(0, (NOW - start) / (promisedYear - start))));
  return {
    id: s.id,
    name: s.name,
    subtitle: s.subtitle,
    developerId: s.developerId,
    district: s.district,
    lat: Math.round((c.lat + s.dLat / 1000) * 1e5) / 1e5,
    lon: Math.round((c.lon + s.dLon / 1000) * 1e5) / 1e5,
    floors: s.floors,
    heightM: Math.round(s.floors * 3.6),
    footprintM: { w: s.w, d: s.d },
    rotationDeg: s.rot,
    launched: s.launched,
    handoverPromised: s.handover,
    handoverPromisedYear: promisedYear,
    constructionPct: pct,
    units: s.units,
    paymentPlan: plan(s.plan, s.launched, s.handover),
    serviceChargePsf: s.sc,
    purposes: s.purposes,
    tags: s.tags,
    facts: s.facts,
  };
}

const SPECS: Spec[] = [
  {
    id: 'marsa-21', name: 'Marsa 21', developerId: 'hadeed', district: 'marina', dLat: 0.4, dLon: -0.3,
    floors: 58, w: 42, d: 36, rot: 18, launched: 'Feb 2025', handover: 'Q3 2028', plan: 'post-60-40',
    units: [u('studio', 480, 2780, 6.4), u('1', 790, 2700, 6.2), u('2', 1180, 2700, 6.0)],
    sc: 24, purposes: ['live', 'rent', 'hold'], tags: ['water', 'reliability', 'growth', 'commute'],
    facts: ['4 min walk to Marina tram', 'Floors 30+ face open water', '3 min walk to the Marina promenade'],
  },
  {
    id: 'harbour-row', name: 'Harbour Row', subtitle: 'Tower B', developerId: 'northline', district: 'marina', dLat: -0.4, dLon: 0.4,
    floors: 46, w: 38, d: 32, rot: -24, launched: 'Jun 2025', handover: 'Q2 2029', plan: 'post-70-30',
    units: [u('1', 740, 2640, 6.5), u('2', 1130, 2660, 6.3), u('3', 1720, 2700, 5.9)],
    sc: 22, purposes: ['live', 'rent', 'hold'], tags: ['water', 'yield', 'quiet'],
    facts: ['Water views from floor 15, 7 min walk to the beach', 'Own 25 m pool deck on level 9', 'Set back 60 m from the main road, quiet side faces the water'],
  },
  {
    id: 'seventeen-canal', name: 'Seventeen Canal', developerId: 'hadeed', district: 'business-bay', dLat: 0.9, dLon: -1.2,
    floors: 44, w: 46, d: 34, rot: 32, launched: 'Aug 2025', handover: 'Q4 2028', plan: 'standard',
    units: [u('1', 700, 2420, 6.6), u('2', 1090, 2440, 6.3), u('office', 1100, 2300, 7.0), u('office', 1900, 2300, 7.0)],
    sc: 20, purposes: ['live', 'rent', 'office', 'hold'], tags: ['water', 'reliability', 'commute', 'growth'],
    facts: ['Canal-facing on floors 12+', '6 min walk to Business Bay metro', 'Offices on levels 2 to 6 with separate lobby'],
  },
  {
    id: 'qasr-lane', name: 'Qasr Lane', developerId: 'marwa', district: 'business-bay', dLat: -1.1, dLon: 0.8,
    floors: 38, w: 40, d: 30, rot: -12, launched: 'Mar 2026', handover: 'Q1 2029', plan: 'light',
    units: [u('studio', 460, 2480, 7.0), u('1', 690, 2500, 6.7), u('2', 1060, 2540, 6.4)],
    sc: 19, purposes: ['live', 'rent', 'hold'], tags: ['growth', 'yield', 'commute'],
    facts: ['Walk to the canal promenade', '10 min drive to Downtown', 'Ground-floor cafe and a shared studio floor'],
  },
  {
    id: 'ghaf-residences', name: 'Ghaf Residences', developerId: 'alwaha', district: 'jvc', dLat: 1.4, dLon: -0.9,
    floors: 14, w: 52, d: 40, rot: 8, launched: 'Oct 2024', handover: 'Q4 2027', plan: 'post-70-30',
    units: [u('studio', 410, 1360, 8.3), u('1', 680, 1380, 8.1), u('2', 1060, 1400, 7.7)],
    sc: 16, purposes: ['rent', 'hold', 'live'], tags: ['yield', 'quiet'],
    facts: ['Landscaped park 2 min walk away', 'Rooftop pool and padel court', 'Community retail on the ground floor'],
  },
  {
    id: 'al-fanar-house', name: 'Al Fanar House', subtitle: 'Phase 2', developerId: 'sahil', district: 'jvc', dLat: -1.6, dLon: 1.3,
    floors: 18, w: 48, d: 36, rot: -30, launched: 'Jan 2025', handover: 'Q2 2028', plan: 'standard',
    units: [u('1', 720, 1500, 7.6), u('2', 1120, 1520, 7.2), u('3', 1560, 1540, 6.8)],
    sc: 17, purposes: ['rent', 'live', 'hold'], tags: ['yield', 'schools', 'quiet'],
    facts: ['Two schools within 5 min drive', 'Phase 1 already let at occupancy above 90%', 'Low-rise block set back from the ring road', 'Direct access to Sheikh Mohammed bin Zayed Road'],
  },
  {
    id: 'sidr-court', name: 'Sidr Court', developerId: 'marwa', district: 'dubai-hills', dLat: 1.8, dLon: -1.4,
    floors: 24, w: 44, d: 34, rot: 14, launched: 'Sep 2025', handover: 'Q1 2029', plan: 'post-60-40',
    units: [u('1', 740, 2380, 6.0), u('2', 1190, 2400, 5.8), u('3', 1700, 2420, 5.6)],
    sc: 18, purposes: ['live', 'hold', 'rent'], tags: ['schools', 'growth', 'quiet'],
    facts: ['Faces the park, 3 min walk to the trail', 'Primary school inside the estate', 'Mall 8 min walk'],
  },
  {
    id: 'almond-row', name: 'Almond Row', developerId: 'hadeed', district: 'dubai-hills', dLat: -1.5, dLon: 1.9,
    floors: 20, w: 40, d: 30, rot: -6, launched: 'Jul 2026', handover: 'Q4 2029', plan: 'light',
    units: [u('1', 760, 2440, 5.9), u('2', 1210, 2460, 5.7), u('3', 1780, 2480, 5.5)],
    sc: 18, purposes: ['live', 'hold'], tags: ['schools', 'reliability', 'quiet', 'growth'],
    facts: ['Golf course frontage on the east side', 'Early phase pricing, launch released in July', 'Clinic and nursery planned in the podium'],
  },
  {
    id: 'corso-44', name: 'Corso 44', developerId: 'northline', district: 'downtown', dLat: 1.2, dLon: 1.0,
    floors: 62, w: 44, d: 38, rot: 40, launched: 'Dec 2025', handover: 'Q2 2029', plan: 'post-70-30',
    units: [u('1', 730, 3320, 5.8), u('2', 1210, 3340, 5.6), u('office', 1250, 3050, 6.4)],
    sc: 28, purposes: ['live', 'hold', 'office'], tags: ['growth', 'commute', 'water'],
    facts: ['8 min walk to the Dubai Mall', 'Fountain views above floor 25', 'Metro station 6 min walk', 'Office floors have 3.9 m ceilings'],
  },
  {
    id: 'dune-court', name: 'Dune Court', developerId: 'sahil', district: 'mbr-city', dLat: -1.3, dLon: -1.7,
    floors: 12, w: 54, d: 42, rot: 22, launched: 'Jun 2024', handover: 'Q4 2027', plan: 'standard',
    units: [u('1', 760, 1900, 7.0), u('2', 1180, 1920, 6.7), u('3', 1650, 1940, 6.3)],
    sc: 15, purposes: ['live', 'rent', 'hold'], tags: ['quiet', 'schools', 'yield'],
    facts: ['Lagoon 4 min walk away', '12 min drive to Downtown', 'Low-rise, no tower within 300 m', 'Two schools within 10 min drive'],
  },
  {
    id: 'wharf-nine', name: 'Wharf Nine', developerId: 'hadeed', district: 'creek-harbour', dLat: 1.1, dLon: -1.5,
    floors: 48, w: 36, d: 36, rot: 0, launched: 'Apr 2026', handover: 'Q2 2030', plan: 'post-60-40',
    units: [u('1', 700, 2300, 6.8), u('2', 1080, 2320, 6.5), u('3', 1560, 2350, 6.1)],
    sc: 21, purposes: ['hold', 'live', 'rent'], tags: ['water', 'growth', 'reliability'],
    facts: ['Creek frontage and a view of the Downtown skyline', 'Early phase pricing in a district still being built', 'Marina quay at the foot of the tower'],
  },
  {
    id: 'frond-14', name: 'Frond 14', developerId: 'northline', district: 'palm', dLat: 0.3, dLon: 0,
    floors: 16, w: 50, d: 34, rot: -52, launched: 'Nov 2025', handover: 'Q4 2028', plan: 'standard',
    units: [u('1', 880, 4250, 5.6), u('2', 1420, 4300, 5.5), u('3', 2100, 4400, 5.3)],
    sc: 26, purposes: ['live', 'hold'], tags: ['water', 'quiet', 'growth'],
    facts: ['Private beach access', 'Only 96 apartments across 16 floors', 'Monorail station 5 min walk'],
  },
];

export const PROJECTS: Project[] = SPECS.map(build);
