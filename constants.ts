import { Constraint, Document } from './types';

export const INITIAL_CONSTRAINTS: Constraint[] = [
  { id: '1', label: 'Minimum Budget', value: '$150,000', type: 'text' },
  { id: '2', label: 'Forbidden Tech', value: 'Java, On-Premise Hosting', type: 'text' },
  { id: '3', label: 'Required Location', value: 'USA / EU Only', type: 'text' },
];

export const MOCK_KNOWLEDGE_BASE: Document[] = [
  { id: 1, name: "Proposal_BankOfAmerica_2024.pdf", size: "12MB", date: "Oct 2024", tags: ["Finance", "Security", "Cloud"], type: 'pdf', status: 'indexed' },
  { id: 2, name: "CaseStudy_HealthPlus.docx", size: "2MB", date: "Sep 2024", tags: ["Healthcare", "Migration"], type: 'docx', status: 'indexed' },
  { id: 3, name: "ISO_27001_Cert.pdf", size: "1MB", date: "Jan 2025", tags: ["Compliance"], type: 'pdf', status: 'indexed' },
  { id: 4, name: "Team_Bios_Engineering.pdf", size: "4MB", date: "Aug 2024", tags: ["HR", "Staffing"], type: 'pdf', status: 'indexed' },
  { id: 5, name: "Security_Questionnaire_Template.xlsx", size: "500KB", date: "Feb 2025", tags: ["Security", "Excel"], type: 'xlsx', status: 'pending' },
];

// Sample RFP Content for the simulation to "read"
export const MOCK_RFP_CONTENT = `
REQUEST FOR PROPOSAL: Enterprise Cloud Migration Strategy
CLIENT: FutureCorp Global
BUDGET: $75,000 - $120,000
DEADLINE: 2 Weeks

REQUIREMENTS:
1. Complete migration of legacy on-premise SQL databases to cloud native solution.
2. Must verify ISO 27001 compliance.
3. Preferred technology stack: Python, Node.js, AWS or GCP.
4. NO OFFSHORE DATA PROCESSING. All data must remain in US borders.
5. Vendors must have executed at least 3 similar projects in the Finance sector.

SECURITY:
- Encryption at rest required.
- SSO integration mandatory.
`;
