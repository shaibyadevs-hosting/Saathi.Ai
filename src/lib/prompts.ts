export const fiveLineSummaryPrompt = (text: string) => `
You are a junior advocate assisting a senior counsel in the Supreme Court of India.

Read the following case document and produce a STRICT 5-line summary covering:
1. Parties
2. Nature of dispute
3. Core legal issue
4. Current procedural stage
5. Relief sought

Rules:
- Use neutral legal language
- Do NOT invent facts
- If something is unclear, state "Not specified"

Document:
${text}
`;

export const detailedSummaryPrompt = (text: string) => `
You are preparing a case brief for a senior advocate.

From the document below, extract and present the following headings:

1. Parties
2. Factual Background
3. Procedural History
4. Legal Issues
5. Arguments Raised
6. Reliefs Sought

Rules:
- Use clear headings
- Stick strictly to the document
- No assumptions
- No case law unless mentioned

Document:
${text}
`;

export const chronologyPrompt = (text: string) => `
Extract ALL dates and related events from the document below.

Instructions:
- Present events in chronological order
- Use bullet points
- If date is approximate or inferred, clearly mark it

Document:
${text}
`;
