import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings and redeploy.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateLeads(niche: string, projectName: string = "Savour Festival", projectDescription: string = "", user: any = null) {
  const ai = getAI();
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        company: { type: Type.STRING },
        contactName: { type: Type.STRING },
        role: { type: Type.STRING },
        email: { type: Type.STRING },
        website: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        companySize: { type: Type.STRING, description: "e.g., 1-10, 11-50, 51-200, 201-500, 500+" },
        productCategory: { type: Type.STRING },
        previousSponsorships: { type: Type.STRING, description: "Similar events they sponsored or competitors" },
        recentCampaigns: { type: Type.STRING, description: "Analysis of recent marketing or social media" },
        recentLaunches: { type: Type.STRING, description: "Recent product launches or brand initiatives" },
        csrAlignment: { type: Type.STRING, description: "CSR statements and alignment with food festival themes" },
      },
      required: ['company', 'contactName', 'role', 'email', 'website', 'reasoning', 'companySize', 'productCategory', 'previousSponsorships', 'recentCampaigns', 'recentLaunches', 'csrAlignment'],
    },
  };

  const prompt = `You are an expert sales director for a project named "${projectName}". ${projectDescription ? `Project Description: ${projectDescription}` : ''}
  Generate 5 highly relevant sponsorship or exhibitor leads for the following niche: "${niche}".
  Target specific senior-level people within the company (e.g., Head of Brand, Marketing Director).
  
  CRITICAL REQUIREMENT: Please focus exclusively on the UK market, unless it is an international brand with a significant budget that is actively looking to expand into the UK.
  
  Refine the lead qualification criteria to include:
  1. Analysis of the company's recent marketing campaigns and social media activity.
  2. Identification of recent product launches or brand initiatives.
  3. Assessment of their Corporate Social Responsibility (CSR) statements and alignment with the project themes.
  
  Also provide segmentation data: company size, specific product category, and previous sponsorship history.
  Ensure the output is a valid JSON array matching the schema.`;

  console.log('Generating leads for niche:', niche);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    console.log('Gemini response received');

    if (!response.text) {
      console.error('Gemini response text is empty');
      throw new Error('Failed to generate leads: Empty response from AI');
    }

    const cleanedText = response.text.trim();
    return JSON.parse(cleanedText);
  } catch (err: any) {
    console.error('Error in generateLeads:', err);
    if (err.message?.includes('quota') || err.message?.includes('429')) {
      throw new Error('AI Rate limit reached. Please wait a moment and try again.');
    }
    throw err;
  }
}

export async function draftEmail(lead: any, projectName: string = "Savour Festival", projectDescription: string = "", user: any = null) {
  const ai = getAI();
  const userName = user?.displayName || "Sales Director";
  const userEmail = user?.email || "";
  
  const prompt = `You are ${userName}, working on a project called "${projectName}". ${projectDescription ? `Project Description: ${projectDescription}` : ''}
  Write a highly personalized, engaging, and professional outreach email to ${lead.contactName}, the ${lead.role} at ${lead.company}.
  
  Use the following context to dynamically insert personalized talking points:
  - Reasoning for outreach: ${lead.reasoning}
  - Recent Campaigns/Social Media: ${lead.recentCampaigns}
  - Recent Product Launches: ${lead.recentLaunches}
  - CSR Alignment: ${lead.csrAlignment}
  - Previous Sponsorships: ${lead.previousSponsorships}
  
  Craft a value proposition that directly addresses the potential benefits of sponsoring or exhibiting at our project, tailored to their specific industry (${lead.productCategory}) and goals.
  Ensure the tone is professional and engaging, suitable for a senior-level contact.
  
  Keep it concise (under 200 words). Do not include a Subject line, just the email body. Sign off as "${userName}, ${projectName}"${userEmail ? ` and include your email ${userEmail}` : ''}.`;

  console.log('Drafting email for lead:', lead.company);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
      },
    });

    if (!response.text) {
      throw new Error('Failed to draft email: Empty response from AI');
    }

    return response.text;
  } catch (err: any) {
    console.error('Error in draftEmail:', err);
    throw err;
  }
}
