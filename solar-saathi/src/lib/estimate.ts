// Port of the Clans Machina website calculator ("FRD engine":
// clansmachina.com/js/solar-engine.js + js/calculator-data.js), so Saathi and
// the website always give the same numbers. Edit constants here only.

export const CALC = {
  tariffPerUnit: 5, // ₹/unit
  daysPerMonth: 30,
  genPerKwDaily: 4, // units per kW per day
  sqftPerKw: 100,
  costPerKw: 70000, // ₹/kW, flat
  systemLifeYears: 25,
  co2KgPerUnit: 0.82,
  panelKw: 0.54, // 540 Wp panels, for the "panels" count only
  emiRate: 6.5, // % p.a., fixed
  emiTenures: [3, 5, 7, 10], // years
  subsidy: {
    1: { central: 30000, state: 25000 },
    2: { central: 60000, state: 50000 },
    3: { central: 78000, state: 60000 }, // 3 kW and above
  },
};

// residential = Home, society = Housing Society (both subsidy-eligible),
// commercial = Commercial / Industrial (no subsidy).
export type Category = "residential" | "society" | "commercial";

export type Estimate = {
  monthlyUnits: number;
  idealKw: number;
  kw: number;
  roofCapped: boolean;
  roofNeeded: number;
  panels: number;
  monthlyGen: number;
  cost: number;
  subsidyCentral: number;
  subsidyState: number;
  subsidy: number;
  investment: number;
  monthlySaving: number;
  annualSaving: number;
  savings25: number;
  paybackYears: number;
  co2TonnesLife: number;
  trees: number;
};

export function computeEstimate(bill: number, roofSqft: number | null, category: Category, stateSubsidy: boolean): Estimate {
  const monthlyUnits = bill / CALC.tariffPerUnit;
  const dailyUnits = monthlyUnits / CALC.daysPerMonth;
  const idealKw = Math.max(1, Math.ceil(dailyUnits / CALC.genPerKwDaily));
  const roofMaxKw = roofSqft == null ? Infinity : Math.floor(roofSqft / CALC.sqftPerKw);
  const kw = Math.max(1, Math.min(idealKw, roofMaxKw));

  const monthlyGen = kw * CALC.genPerKwDaily * CALC.daysPerMonth;
  const cost = kw * CALC.costPerKw;
  const row = kw <= 1 ? CALC.subsidy[1] : kw === 2 ? CALC.subsidy[2] : CALC.subsidy[3];
  const eligible = category !== "commercial";
  const subsidyCentral = eligible ? row.central : 0;
  const subsidyState = eligible && stateSubsidy ? row.state : 0;
  const subsidy = subsidyCentral + subsidyState;
  const investment = Math.max(cost - subsidy, 0);

  const monthlySaving = monthlyGen * CALC.tariffPerUnit;
  const annualSaving = monthlySaving * 12;
  const savings25 = annualSaving * CALC.systemLifeYears;
  const co2TonnesLife = (monthlyGen * CALC.co2KgPerUnit * 12 * CALC.systemLifeYears) / 1000;

  return {
    monthlyUnits,
    idealKw,
    kw,
    roofCapped: roofMaxKw < idealKw,
    roofNeeded: kw * CALC.sqftPerKw,
    panels: Math.ceil(kw / CALC.panelKw),
    monthlyGen,
    cost,
    subsidyCentral,
    subsidyState,
    subsidy,
    investment,
    monthlySaving,
    annualSaving,
    savings25,
    paybackYears: annualSaving > 0 ? investment / annualSaving : 0,
    co2TonnesLife,
    trees: Math.round((co2TonnesLife * 1000) / 22 / CALC.systemLifeYears), // ~22 kg CO₂ per tree per year
  };
}

export function emi(principal: number, years: number, ratePct = CALC.emiRate) {
  const r = ratePct / 12 / 100;
  const n = years * 12;
  return r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// ₹5.68 L / ₹1.21 Cr for headline figures.
export function rupeesShort(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, "")} L`;
  return rupees(n);
}
