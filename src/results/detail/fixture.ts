/* Local fixture so the panel can be built before the data layer lands. */
import type { Answers, Match } from '../../types';
import { DEFAULT_ANSWERS } from '../../types';

export const fixtureAnswers: Answers = { ...DEFAULT_ANSWERS, purpose: 'rent', financing: 'mortgage', downPaymentPct: 30 };

const units = [
  { kind: 'studio' as const, sqft: 480, priceAED: 1_090_000, estAnnualRentAED: 74_000 },
  { kind: '1' as const, sqft: 760, priceAED: 1_540_000, estAnnualRentAED: 104_000 },
  { kind: '2' as const, sqft: 1184, priceAED: 1_840_000, estAnnualRentAED: 126_000 },
  { kind: '3' as const, sqft: 1710, priceAED: 2_650_000, estAnnualRentAED: 172_000 },
];

export const fixtureMatch: Match = {
  score: 92,
  bestUnit: units[2],
  reasons: [
    { because: "You're renting it out", finding: 'Net yield of about 6.4%, top quartile for Dubai Marina.' },
    { because: 'Budget up to AED 3.0M', finding: 'The two-bedroom sits at AED 1.84M, with room to spare.' },
    { because: 'Handover by 2029', finding: 'Promised Q3 2028; our estimate is Q1 2029, inside your window.' },
  ],
  caveat: 'Service charges are above the area median at AED 19 per sq ft.',
  developer: {
    id: 'hadeed', name: 'Hadeed Developments', founded: 2004, deliveredCount: 6, avgDelayMonths: 4, avgAnnualAppreciationPct: 7.2,
    pastProjects: [
      { name: 'Hadeed Bay', district: 'marina', launchYear: 2017, handoverPromised: 'Q4 2019', handoverActual: 'Q1 2020', delayMonths: 3, launchPsf: 1150, currentPsf: 1820 },
      { name: 'Corniche One', district: 'downtown', launchYear: 2018, handoverPromised: 'Q2 2020', handoverActual: 'Q4 2020', delayMonths: 6, launchPsf: 1420, currentPsf: 2210 },
      { name: 'Ridge Park', district: 'dubai-hills', launchYear: 2019, handoverPromised: 'Q1 2022', handoverActual: 'Q1 2022', delayMonths: 0, launchPsf: 980, currentPsf: 1650 },
      { name: 'Aria Circle', district: 'jvc', launchYear: 2020, handoverPromised: 'Q3 2022', handoverActual: 'Q1 2023', delayMonths: 5, launchPsf: 720, currentPsf: 1240 },
      { name: 'Meridian Walk', district: 'business-bay', launchYear: 2021, handoverPromised: 'Q4 2023', handoverActual: 'Q2 2024', delayMonths: 7, launchPsf: 1050, currentPsf: 1710 },
      { name: 'Hadeed Palm Residences', district: 'palm', launchYear: 2021, handoverPromised: 'Q2 2024', handoverActual: 'Q3 2024', delayMonths: 3, launchPsf: 2100, currentPsf: 3240 },
    ],
  },
  project: {
    id: 'fixture', name: 'Marina Crest', subtitle: 'Tower B', developerId: 'hadeed', district: 'marina',
    lat: 25.08, lon: 55.14, floors: 46, heightM: 190, footprintM: { w: 42, d: 36 }, rotationDeg: 12,
    launched: 'Mar 2025', handoverPromised: 'Q3 2028', handoverPromisedYear: 2028.75, constructionPct: 38,
    units,
    paymentPlan: [
      { label: 'On booking', pct: 10, when: 'Nov 2026' },
      { label: 'During construction', pct: 30, when: 'Mar 2027 to Jun 2028' },
      { label: 'On handover', pct: 30, when: 'Q3 2028' },
      { label: '2 yrs post-handover', pct: 30, when: 'Q3 2030' },
    ],
    serviceChargePsf: 19, purposes: ['rent', 'hold'], tags: ['yield', 'water'],
    facts: ['4 min walk to Marina tram', 'Direct marina views from level 12', 'Pool deck on level 8'],
  },
};
