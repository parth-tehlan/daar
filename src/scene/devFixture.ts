import type { DistrictId, Project } from '../types';

function fx(
  id: string, name: string, district: DistrictId, lat: number, lon: number,
  floors: number, heightM: number, w: number, d: number, rot: number, handover: string, year: number,
): Project {
  return {
    id, name, subtitle: 'Tower A', developerId: 'fx', district, lat, lon, floors, heightM,
    footprintM: { w, d }, rotationDeg: rot, launched: 'Q1 2025', handoverPromised: handover,
    handoverPromisedYear: year, constructionPct: 20,
    units: [{ kind: '2', sqft: 1200, priceAED: 2_400_000, estAnnualRentAED: 150_000 }],
    paymentPlan: [{ label: 'On booking', pct: 20, when: 'Nov 2026' }],
    serviceChargePsf: 16, purposes: ['rent'], tags: ['yield'], facts: ['Fixture'],
  };
}

/** Dev-only fixture for ?scenetest=results|detail */
export const FIXTURE_PROJECTS: Project[] = [
  fx('fx-marina', 'Marina Vista', 'marina', 25.0788, 55.1362, 62, 240, 38, 30, 20, 'Q3 2028', 2028.6),
  fx('fx-bay', 'Canal Crest', 'business-bay', 25.1868, 55.2601, 54, 205, 34, 34, -15, 'Q1 2028', 2028.1),
  fx('fx-creek', 'Harbour Light', 'creek-harbour', 25.2018, 55.3493, 70, 270, 40, 32, 35, 'Q4 2028', 2028.9),
  fx('fx-jvc', 'Circle Court', 'jvc', 25.0617, 55.2057, 16, 62, 46, 36, 0, 'Q2 2027', 2027.4),
  fx('fx-hills', 'Hillside Park', 'dubai-hills', 25.1118, 55.2418, 28, 105, 42, 30, 10, 'Q4 2027', 2027.9),
  fx('fx-downtown', 'Boulevard Nine', 'downtown', 25.1938, 55.2742, 58, 215, 36, 36, 25, 'Q3 2028', 2028.6),
];
