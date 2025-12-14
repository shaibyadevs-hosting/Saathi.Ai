export const fiveLineSummaryPrompt = (text: string) => `
You are a junior advocate assisting a senior counsel in the Supreme Court of India.

Read the following document(s) and produce a CONCISE 5-point summary:

**Format your response EXACTLY like this:**

📋 **QUICK SUMMARY**

• **Parties:** [One line identifying parties]
• **Dispute:** [One line on nature of dispute]  
• **Legal Issue:** [One line on core legal question]
• **Stage:** [Current procedural stage]
• **Relief:** [What is being sought]

Rules:
- Each point must be ONE line only (max 20 words)
- Use clear, simple language
- Do NOT invent facts
- If something is unclear, state "Not specified"
- Keep total summary under 150 words

Document:
${text}
`;

export const detailedSummaryPrompt = (text: string) => `
You are preparing a case brief for a senior advocate.

Create a STRUCTURED and READABLE summary with clear sections:

**Format your response EXACTLY like this:**

## 📄 CASE BRIEF

### 👥 Parties
[Petitioner vs Respondent - 1-2 lines max]

### 📝 Facts in Brief
[3-4 bullet points covering key facts only]

### ⚖️ Legal Issues
[2-3 numbered points]

### 🎯 Arguments
**Petitioner:** [2-3 key points]
**Respondent:** [2-3 key points]

### 🔍 Relief Sought
[1-2 lines]

---

Rules:
- Use bullet points and short sentences
- Maximum 400 words total
- Focus on ESSENTIAL information only
- No lengthy paragraphs
- Skip sections if not applicable

Document:
${text}
`;

export const chronologyPrompt = (text: string) => `
Extract key dates and events from the document(s) below.

**Format your response EXACTLY like this:**

## 📅 TIMELINE OF EVENTS

| Date | Event |
|------|-------|
| DD/MM/YYYY | Brief description (max 15 words) |

---

Rules:
- List only SIGNIFICANT dates (max 10-15 entries)
- Use table format for clarity
- If exact date unknown, use approximate (e.g., "~March 2024")
- Mark inferred dates with [approx]
- Keep each event description brief

Document:
${text}
`;

// New prompt for key points extraction
export const keyPointsPrompt = (text: string) => `
Extract the KEY POINTS from this document in a scannable format.

**Format your response EXACTLY like this:**

## 🔑 KEY POINTS

**What is it about?**
[1-2 sentences max]

**Key Findings:**
✓ [Point 1]
✓ [Point 2]
✓ [Point 3]
✓ [Point 4]
✓ [Point 5]

**Important Terms/Names:**
• [Term 1]
• [Term 2]
• [Term 3]

**Bottom Line:**
[One sentence conclusion]

---

Rules:
- Maximum 200 words
- Use simple, clear language
- Extract only the most important points
- Make it scannable at a glance

Document:
${text}
`;
