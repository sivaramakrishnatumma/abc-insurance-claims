export type ClaimStatus = 'Active' | 'Pending' | 'Closed';
export type ClaimType = 'Auto' | 'Home' | 'Health' | 'Life';

export interface Claim {
  id: string;
  customerName: string;
  company: string;
  email: string;
  type: ClaimType;
  amount: number;
  status: ClaimStatus;
  assignedTo: string;
}

const FIRST_NAMES = [
  'Jane',
  'Floyd',
  'Ronald',
  'Marvin',
  'Jerome',
  'Kathryn',
  'Jacob',
  'Kristin',
  'Cameron',
  'Courtney',
  'Theresa',
  'Dwight',
  'Bessie',
  'Darlene',
  'Guy',
  'Devon',
  'Arlene',
  'Cody',
  'Jenny',
  'Wade',
  'Esther',
  'Ralph',
  'Nathan',
  'Priscilla',
  'Leslie',
  'Debra',
  'Angel',
  'Brooklyn',
  'Savannah',
  'Eleanor',
];

const LAST_NAMES = [
  'Cooper',
  'Miles',
  'Richards',
  'McKinney',
  'Bell',
  'Murphy',
  'Jones',
  'Watson',
  'Williamson',
  'Henry',
  'Webb',
  'Schmidt',
  'Black',
  'Robertson',
  'Hawkins',
  'Lane',
  'Nguyen',
  'Fisher',
  'Wilson',
  'Warren',
  'Howard',
  'Edwards',
  'Roberts',
  'Flores',
  'Reid',
  'Fox',
  'Simmons',
];

const COMPANIES = [
  'Microsoft',
  'Yahoo',
  'Adobe',
  'Tesla',
  'Google',
  'Facebook',
  'Amazon',
  'Netflix',
  'Oracle',
  'IBM',
  'Intel',
  'Cisco',
  'Salesforce',
  'Uber',
  'Airbnb',
  'Spotify',
  'Dropbox',
  'Slack',
  'Zoom',
  'Square',
];

const TYPES: ClaimType[] = ['Auto', 'Home', 'Health', 'Life'];
const STATUSES: ClaimStatus[] = ['Active', 'Pending', 'Closed'];

const ADJUDICATORS = [
  'Siva Rama Krishna',
  'Evano Rodriguez',
  'Alicia Fox',
  'Marcus Lee',
  'Priya Patel',
  'Daniel Kim',
  'Sofia Martinez',
  'Liam OBrien',
  'Hannah Schmidt',
  'Unassigned',
];

const EMAIL_DOMAINS: Record<string, string> = {
  Microsoft: 'microsoft.com',
  Yahoo: 'yahoo.com',
  Adobe: 'adobe.com',
  Tesla: 'tesla.com',
  Google: 'google.com',
  Facebook: 'facebook.com',
};

const TOTAL_RECORDS = 20_000;

/** Deterministic PRNG so the dataset is identical on every server start. */
function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateClaims(count: number = TOTAL_RECORDS): Claim[] {
  const rng = createRng(0x9e3779b9);
  const claims: Claim[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const company = pick(rng, COMPANIES);
    const domain = EMAIL_DOMAINS[company] ?? `${company.toLowerCase()}.com`;

    claims[i] = {
      id: `CLM-${1001 + i}`,
      customerName: `${firstName} ${lastName}`,
      company,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      type: pick(rng, TYPES),
      amount: Math.round((rng() * 49500 + 500) * 100) / 100,
      status: pick(rng, STATUSES),
      assignedTo: pick(rng, ADJUDICATORS),
    };
  }

  return claims;
}

/** Global in-memory "database" of 20,000 claims. */
export const claims: Claim[] = generateClaims();
