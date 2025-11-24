import OpenAI from 'openai';

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateSection(prompt: string, baseTemplate?: string): Promise<string> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Using library matching instead.');
  }

  const systemPrompt = baseTemplate
    ? `You are an expert Shopify Liquid template developer. Generate a complete Shopify section based on the user's prompt. Use this base template as a starting point and modify it according to the user's requirements:

${baseTemplate}

Generate a complete, production-ready Shopify Liquid section file. Include all necessary schema settings, styles, and responsive design. The code should be well-commented and follow Shopify best practices.`
    : `You are an expert Shopify Liquid template developer. Generate a complete, production-ready Shopify section based on the user's prompt. Include all necessary schema settings, styles, and responsive design. The code should be well-commented and follow Shopify best practices.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const generatedCode = completion.choices[0]?.message?.content;
  if (!generatedCode) {
    throw new Error('Failed to generate section code');
  }

  return generatedCode;
}

