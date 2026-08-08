export interface DocumentPage {
  number: number;
  heading: string;
  lines: string[];
}

export interface ClaimDocument {
  fileName: string;
  sizeLabel: string;
  pages: DocumentPage[];
}

const SECTION_HEADINGS = [
  'Policy Declaration',
  'Incident Report',
  'Damage Assessment',
  'Repair Estimate',
  'Adjuster Notes',
  'Photographic Evidence',
  'Medical Records',
  'Witness Statement',
  'Police Report',
  'Coverage Summary',
  'Settlement Offer',
  'Correspondence Log',
];

function buildLines(seed: number): string[] {
  const count = 6 + (seed % 4);
  return Array.from({ length: count }, (_, i) => {
    const width = 40 + ((seed * (i + 3)) % 55);
    return '\u2588'.repeat(Math.floor(width / 6) + 4);
  });
}

/** Builds a deterministic mock document for a given claim. */
export function buildClaimDocument(
  claimId: string,
  pageCount = 12,
): ClaimDocument {
  const pages: DocumentPage[] = Array.from({ length: pageCount }, (_, i) => ({
    number: i + 1,
    heading: SECTION_HEADINGS[i % SECTION_HEADINGS.length],
    lines: buildLines(i + claimId.length),
  }));

  return {
    fileName: `${claimId}-claim-file.pdf`,
    sizeLabel: '842 MB',
    pages,
  };
}
