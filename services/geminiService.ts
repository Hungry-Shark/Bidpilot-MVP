// Fully simulated service to replace SDK dependency
// This allows the app to function "as planned" without backend connectivity for the MVP.

/**
 * The Historian Agent: Summarizes and indexes documents.
 */
export const runHistorianAgent = async (docName: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const type = docName.split('.').pop();
  if (type === 'pdf') {
      return `Indexed ${docName}. Extracted vector embeddings for "Financial Compliance", "Cloud Security", and "Past Performance".`;
  } else if (type === 'xlsx') {
      return `Parsed structured data from ${docName}. Mapped 150 security questions to standard answers.`;
  }
  return `Ingested ${docName} into Knowledge Graph.`;
};

/**
 * The Gatekeeper Agent: Decides Go/No-Go based on risk.
 * Performs simulated keyword matching against the provided RFP text and constraints.
 */
export const runGatekeeperAgent = async (
    rfpText: string, 
    constraints: {label: string, value: string}[]
): Promise<{verdict: string, reasoning: string}> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const lowerRfp = rfpText.toLowerCase();
  let noGoReason = null;

  // Simulate logic: Check if any "Forbidden" or negative constraints appear in the text
  // This mimics the AI reasoning by doing a heuristic check
  for (const c of constraints) {
     const label = c.label.toLowerCase();
     const val = c.value.toLowerCase();
     const checks = val.split(',').map(s => s.trim());

     if (label.includes('forbidden') || label.includes('breaker')) {
         for (const check of checks) {
             if (lowerRfp.includes(check)) {
                 noGoReason = `Constraint Violation: Found forbidden term "${check}" in RFP text.`;
                 break;
             }
         }
     }
     
     if (noGoReason) break;
  }

  if (noGoReason) {
      return { 
          verdict: "NO-GO", 
          reasoning: `${noGoReason} \n\nRecommendation: Decline bid to preserve resources.` 
      };
  }

  return { 
    verdict: "GO", 
    reasoning: "Assessment Complete:\n• Budget alignment verified\n• Tech stack within core competencies\n• No legal red flags detected\n\nRecommendation: Proceed to Drafting." 
  };
};

/**
 * The Architect Agent: Drafts the proposal.
 * Generates a dynamic template based on the RFP content length.
 */
export const runArchitectAgent = async (rfpText: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 3500));
  
  const topic = rfpText.split('\n')[0] || "Proposed Solution";
  
  return `EXECUTIVE SUMMARY

BidPilot is pleased to submit this proposal for: ${topic}

1. OUR UNDERSTANDING
We understand that you are looking for a partner to handle specific requirements outlined in your request. Our team has analyzed your constraints regarding budget and timeline.

2. PROPOSED SOLUTION
Leveraging our autonomous "Zero-Touch" operations, we propose a solution that ensures compliance with all security standards (including ISO 27001). Our architecture is designed for scalability and performance.

3. WHY US?
• 90% reduction in operational overhead.
• Proven track record in similar sectors.
• Guaranteed data residency and security compliance.

We look forward to the opportunity to partner with you.`;
};

/**
 * The Quant Agent: Analyzes specific data structures (Excel/JSON).
 */
export const runQuantAgent = async (question: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `def validate_security_requirement(context):
    """
    Auto-generated validator for: ${question}
    """
    required_standard = "AES-256"
    if required_standard in context.encryption_policy:
        return True, "Compliant"
    else:
        return False, "Upgrade Required"`;
};
