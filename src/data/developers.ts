/* Fictional developers. Track records are built from their past projects so the
   headline numbers always agree with the rows underneath. */
import type { Developer, DistrictId, PastProject } from '../types';
import { NOW, addQuarters } from './util';

function past(
  name: string,
  district: DistrictId,
  launchYear: number,
  promised: string,
  delayMonths: number,
  launchPsf: number,
  annualPct: number,
): PastProject {
  const years = NOW - (launchYear + 0.5);
  return {
    name,
    district,
    launchYear,
    handoverPromised: promised,
    handoverActual: addQuarters(promised, Math.round(delayMonths / 3)),
    delayMonths,
    launchPsf,
    currentPsf: Math.round((launchPsf * Math.pow(1 + annualPct / 100, years)) / 10) * 10,
  };
}

function dev(id: string, name: string, founded: number, deliveredCount: number, pastProjects: PastProject[]): Developer {
  const avgDelayMonths = Math.round(pastProjects.reduce((s, p) => s + p.delayMonths, 0) / pastProjects.length);
  const cagr = pastProjects.map((p) => (Math.pow(p.currentPsf / p.launchPsf, 1 / (NOW - (p.launchYear + 0.5))) - 1) * 100);
  const avgAnnualAppreciationPct = Math.round((cagr.reduce((s, c) => s + c, 0) / cagr.length) * 10) / 10;
  return { id, name, founded, deliveredCount, avgDelayMonths, avgAnnualAppreciationPct, pastProjects };
}

export const DEVELOPERS: Developer[] = [
  // Reliable, premium-priced. About 1 month late on average.
  dev('hadeed', 'Hadeed Developments', 2003, 27, [
    past('Corniche 9', 'marina', 2014, 'Q4 2017', 0, 1250, 8.4),
    past('Sana Tower', 'business-bay', 2016, 'Q2 2019', 3, 1180, 9.1),
    past('Meridian Lane', 'downtown', 2018, 'Q4 2021', 0, 1900, 9.8),
    past('Hadeed Park 2', 'dubai-hills', 2019, 'Q3 2022', 0, 1350, 10.2),
    past('Dock Eleven', 'creek-harbour', 2021, 'Q1 2025', 3, 1620, 9.0),
  ]),
  // Steady mid-market, rental-led.
  dev('sahil', 'Sahil Properties', 2008, 19, [
    past('Rimal Court', 'jvc', 2015, 'Q2 2018', 3, 620, 6.4),
    past('Sahil Square', 'jvc', 2017, 'Q4 2019', 0, 710, 7.2),
    past('Wadi Row', 'mbr-city', 2018, 'Q1 2021', 6, 980, 6.1),
    past('Tamr Residences', 'jvc', 2020, 'Q3 2022', 3, 840, 8.2),
    past('Falaj House', 'dubai-hills', 2021, 'Q4 2024', 3, 1420, 7.0),
  ]),
  // Design-led, a little slow, strong growth.
  dev('marwa', 'Marwa & Partners', 2011, 14, [
    past('Souk Gate', 'business-bay', 2015, 'Q1 2018', 6, 1050, 10.6),
    past('Marwa Heights', 'dubai-hills', 2017, 'Q3 2020', 3, 1180, 11.8),
    past('Bayt 14', 'downtown', 2018, 'Q2 2021', 6, 1750, 10.1),
    past('Lantern Court', 'marina', 2020, 'Q4 2022', 6, 1480, 12.0),
    past('Cedar Walk', 'dubai-hills', 2021, 'Q2 2024', 3, 1560, 11.0),
  ]),
  // Large pipeline, often late.
  dev('northline', 'Northline Estates', 2006, 31, [
    past('Northline One', 'marina', 2014, 'Q1 2017', 9, 1150, 7.4),
    past('Harbour Point', 'palm', 2016, 'Q4 2019', 6, 2650, 8.2),
    past('Arc Residences', 'business-bay', 2017, 'Q2 2020', 9, 1020, 8.8),
    past('Meydan Rise', 'mbr-city', 2019, 'Q3 2022', 6, 1090, 7.6),
    past('Quay 6', 'downtown', 2020, 'Q1 2023', 9, 2050, 8.1),
    past('Dune Terraces', 'palm', 2021, 'Q4 2024', 9, 2980, 8.9),
  ]),
  // Cheapest per sq ft, slowest to hand over.
  dev('alwaha', 'Al Waha Real Estate', 2009, 22, [
    past('Waha Gardens', 'jvc', 2014, 'Q3 2017', 12, 520, 5.6),
    past('Waha Plaza', 'jvc', 2016, 'Q1 2019', 9, 590, 6.2),
    past('Nakhla Court', 'jvc', 2018, 'Q4 2020', 15, 680, 6.8),
    past('Waha Heights', 'business-bay', 2019, 'Q2 2022', 9, 860, 7.0),
    past('Sidra Lane', 'mbr-city', 2020, 'Q3 2023', 12, 890, 5.9),
    past('Waha Gardens 2', 'jvc', 2022, 'Q1 2025', 9, 800, 6.9),
  ]),
];

export function getDeveloper(id: string): Developer {
  return DEVELOPERS.find((d) => d.id === id) ?? DEVELOPERS[0];
}
