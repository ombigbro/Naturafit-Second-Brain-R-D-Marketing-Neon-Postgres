import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

// DuckDuckGo Lite search scraping function + mock fallback
async function searchWeb(query: string): Promise<string> {
  console.log(`Executing web search for: "${query}"`);
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 60 } // cache results for 60 seconds
    });
    
    if (response.ok) {
      const html = await response.text();
      // Extract result descriptions from DuckDuckGo html
      const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      const snippets: string[] = [];
      let match;
      while ((match = regex.exec(html)) !== null && snippets.length < 5) {
        const text = match[1].replace(/<[^>]*>/g, '').trim();
        if (text) snippets.push(text);
      }
      if (snippets.length > 0) {
        return snippets.join('\n\n');
      }
    }
  } catch (e) {
    console.warn('Web search request failed. Using mock search engine.', e);
  }
  return getMockSearchResults(query);
}

function getMockSearchResults(query: string): string {
  const queryLower = query.toLowerCase();
  if (queryLower.includes('slim') || queryLower.includes('diet') || queryLower.includes('weight')) {
    return `Search Results for "${query}":
1. Flimty: High-fiber slimming drink powder. Promotes digestive cleansing and weight management. Key ingredients: Psyllium Husk, Soluble Fiber, Goji Berry. Priced around Rp 295,000 per box.
2. Slimming Tea Mustika Ratu: Traditional Indonesian herbal teabag. Active ingredients: Green Tea, Guazumae Folium (Jati Belanda). High market volume, low pricing (Rp 25,000 - Rp 50,000).
3. Noera Slim Boost: Weight loss supplement pills and herbal tea. Focuses on natural fat burners like ginger and green tea extracts. Pricing around Rp 150,000.`;
  }
  
  if (queryLower.includes('collagen') || queryLower.includes('skin') || queryLower.includes('glow') || queryLower.includes('putih')) {
    return `Search Results for "${query}":
1. Cool-vita Collagen: Effervescent collagen tablets. Very popular on TikTok Shop for convenience and peach flavouring. Extremely competitive low-mid pricing.
2. Noera Collagen Drink: Powdered beauty drink containing Salmon Collagen, Glutathione, and Vitamin C. High viral engagement on TikTok. Price is Rp 175,000 per box.
3. Byoote Collagen: Premium beauty supplement powder containing collagen tripeptide from Japan. High-end branding, target market 25-45. Price Rp 350,000.`;
  }

  if (queryLower.includes('bpom') || queryLower.includes('regulation') || queryLower.includes('sertifikat')) {
    return `Search Results for "${query}":
1. BPOM TR: Traditional medicine and herbal supplement certification code in Indonesia. Requires strict manufacturing hygiene standards (CPOTB) and organic ingredients.
2. BPOM MD: Domestic processed food & beverage certification code. Applies to powdered juice drinks, healthy teas, and coffee mixes. Requires nutritional analysis.
3. Indonesian TikTok Shop regulations: BPOM certification (TR/MD/NA) is strictly mandatory to run ads or list health products. Non-certified products are auto-banned.`;
  }

  return `Search Results for "${query}":
- Healthy wellness products dominate TikTok Shop Indonesia.
- Competitor products rely on clear health benefit claims, active ingredients, and local brand ambassadors.
- Price ranges vary from Rp 25k (budget traditional tea) to Rp 350k (premium collagen or fiber drink boxes).
- Key marketing keywords: "BPOM", "Aman", "Herbal", "Glow Up", "Detox".`;
}

// Local simulation fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runLocalSparring(message: string, phase1State: any): string {
  const msgLower = message.toLowerCase();
  const products = phase1State?.products || [];
  const categories = phase1State?.categories || [];
  
  let categoryList = categories.join(', ');
  if (!categoryList) categoryList = 'General Health';

  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey') || msgLower.length < 5) {
    return `Hello! I am your Strategic Sparring partner. Based on your Phase 1 data, we have identified these main categories: **${categoryList}**. Which category would you like to focus on for our strategy development and formulation details?`;
  }
  
  if (msgLower.includes('formulation') || msgLower.includes('ingredient') || msgLower.includes('resep') || msgLower.includes('bahan')) {
    let focusCategory = categories[0] || 'Weight Loss';
    for (const cat of categories) {
      if (msgLower.includes(cat.toLowerCase())) {
        focusCategory = cat;
        break;
      }
    }
    
    if (focusCategory.toLowerCase().includes('weight') || focusCategory.toLowerCase().includes('slim') || focusCategory.toLowerCase().includes('detox')) {
      return `For **${focusCategory}**, here is a proposed strategy:
- **Primary Ingredients:** Psyllium Husk (for satiety and digestion), Green Tea Extract (rich in EGCG for metabolism).
- **Derivative Ingredients:** Garcinia Cambogia, Inulin, Vitamin C.
- **Target Market:** Urban professionals aged 22-38 looking for healthy, convenient detox beverages.
- **Top 3 Recommended Competitors for Analysis:** Flimty, Slimming Tea Mustika Ratu, Noera Slim Boost.

Let's proceed by uploading competitor data for these brands. Once you're ready, click "Lock Strategy" to move to branding!`;
    }
    
    if (focusCategory.toLowerCase().includes('skin') || focusCategory.toLowerCase().includes('collagen') || focusCategory.toLowerCase().includes('glow')) {
      return `For **${focusCategory}**, here is a proposed strategy:
- **Primary Ingredients:** Marine Collagen Peptides (for elasticity), L-Glutathione (for brightening).
- **Derivative Ingredients:** Vitamin C (ascorbic acid), Hyaluronic Acid, Beetroot Extract.
- **Target Market:** Young females aged 18-35 focusing on premium skin health and anti-aging.
- **Top 3 Recommended Competitors for Analysis:** Cool-vita Collagen, Noera Collagen Drink, Byoote.

Let's proceed by uploading competitor data for these brands. Once you're ready, click "Lock Strategy" to move to branding!`;
    }

    if (focusCategory.toLowerCase().includes('beverage') || focusCategory.toLowerCase().includes('drink') || focusCategory.toLowerCase().includes('kopi') || focusCategory.toLowerCase().includes('susu')) {
      return `For **${focusCategory}**, here is a proposed strategy:
- **Primary Ingredients:** Oat Milk Powder (for creamy dairy-free base), Stevia Extract (natural sweetener).
- **Derivative Ingredients:** Matcha Powder, Pea Protein, B-Complex Vitamins.
- **Target Market:** Health-conscious Gen Z & Millennials seeking dairy-free ready-to-mix drinks.
- **Top 3 Recommended Competitors for Analysis:** NutriSari, Susu Cimory, FiberCreme.

Let's upload competitor spreadsheet data on the right dashboard to analyze their engagement metrics.`;
    }
    
    return `For **${focusCategory}**, here is a proposed strategy:
- **Primary Ingredients:** Organic Ginger Extract, Curcuma (Temulawak).
- **Derivative Ingredients:** Honey Extract, Royal Jelly, Zinc.
- **Target Market:** Adults seeking natural herbal immunity boosters.
- **Top 3 Recommended Competitors for Analysis:** Jamu Sido Muncul, Herbilogy, Madu TJ.

Let's proceed by uploading competitor data on the right dashboard to check their affiliator and live performance!`;
  }
  
  if (msgLower.includes('competitor') || msgLower.includes('saingan') || msgLower.includes('rival')) {
    let focusCategory = categories[0] || 'Skin Health';
    for (const cat of categories) {
      if (msgLower.includes(cat.toLowerCase())) {
        focusCategory = cat;
        break;
      }
    }
    
    let competitors = ['Competitor A', 'Competitor B', 'Competitor C'];
    if (focusCategory.toLowerCase().includes('slim') || focusCategory.toLowerCase().includes('weight')) {
      competitors = ['Flimty', 'Slimming Tea Mustika Ratu', 'Noera Slim Boost'];
    } else if (focusCategory.toLowerCase().includes('skin') || focusCategory.toLowerCase().includes('collagen')) {
      competitors = ['Cool-vita Collagen', 'Noera Collagen Drink', 'Byoote'];
    } else if (focusCategory.toLowerCase().includes('beverage')) {
      competitors = ['Cool-vita', 'FiberCreme', 'NutriSari'];
    } else {
      competitors = ['Herbilogy', 'Jamu Sido Muncul', 'Madu TJ'];
    }

    return `Based on market volume and revenue within **${focusCategory}**, the Top 3 competitor brands you should analyze are:
1. **${competitors[0]}** (Market leader, dominates video views)
2. **${competitors[1]}** (High creator engagement, massive affiliate network)
3. **${competitors[2]}** (Premium formulation positioning)

Please upload the competitor spreadsheet matching these brands in the panel on the right. We will track their videos, live sessions, and top affiliates!`;
  }

  return `That's a very interesting marketing direction! Based on your Phase 1 data, which reports Rp ${products.reduce((sum: number, p: { revenue: number }) => sum + p.revenue, 0).toLocaleString('id-ID')} in total revenue across ${products.length} products, the market is ripe for a high-quality product.

To define our positioning:
1. Would you prefer a premium pricing model or low-cost high-volume strategy?
2. Shall we focus on traditional ingredients (like Jamu/Herbal) or modern bio-active ingredients (like Collagen/Psyllium)?

Let's discuss, or suggest a category so I can provide concrete ingredients formulation suggestions!`;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Role check: Admins can only access their own, Super Admins can access all
    if (user.role !== 'SUPER_ADMIN' && project.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const clientMessages = (body.messages || []) as Message[];

    if (clientMessages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Fetch Super Admin prompt and key
    const settings = await db.globalSettings.findUnique({
      where: { id: 1 },
    });

    let phase1StateObj = null;
    if (project.phase_1_state) {
      try {
        phase1StateObj = typeof project.phase_1_state === 'string' 
          ? JSON.parse(project.phase_1_state) 
          : project.phase_1_state;
      } catch (e) {
        console.warn('Failed to parse phase 1 state:', e);
      }
    }

    const isOfflineMode = !settings || !settings.ai_text_key || settings.ai_text_key === 'dummy_text_key_change_me';

    if (isOfflineMode) {
      // Run offline rules engine
      const lastUserMsg = clientMessages.filter(m => m.role === 'user').pop()?.content || '';
      const reply = runLocalSparring(lastUserMsg, phase1StateObj);
      return NextResponse.json({ 
        success: true, 
        message: { role: 'assistant', content: reply },
        isOfflineMode: true
      });
    }

    // Standard OpenAI API execution with tool support
    const systemInstruction = 
      `${settings.phase_2_prompt || 'You are a Strategy Sparring AI.'}\n\n` +
      `Here is the Phase 1 Ingested E-Commerce Market Context JSON:\n` +
      `${JSON.stringify(phase1StateObj || {}, null, 2)}\n\n` +
      `Use this context to challenge the user's formulation strategy, price point, or target audience dynamically. ` +
      `You MUST recommend specific primary ingredients, derivative ingredients, target markets, and identify top competitors. ` +
      `If you need current market information or competitor brands, use the search_web tool. ` +
      `Base your answers strictly on the facts and data. If data is unavailable, state it clearly.`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiMessages: any[] = [
      { role: 'system', content: systemInstruction },
      ...clientMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Search the web for competitor brands, ingredients, BPOM regulations, or market information in Indonesia.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to look up in the search engine.',
              },
            },
            required: ['query'],
          },
        },
      },
    ];

    // Call OpenAI
    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.ai_text_key}`,
      },
      body: JSON.stringify({
        model: settings.ai_text_model || 'gpt-4',
        messages: apiMessages,
        tools: tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    let data = await response.json();
    let assistantMessage = data.choices?.[0]?.message;

    // Handle tool call loops (up to 2 iterations)
    let iterations = 0;
    while (assistantMessage?.tool_calls && iterations < 2) {
      iterations++;
      apiMessages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === 'search_web') {
          let query = '';
          try {
            const args = JSON.parse(toolCall.function.arguments);
            query = args.query || '';
          } catch {
            query = toolCall.function.arguments;
          }

          const searchResult = await searchWeb(query);
          apiMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: 'search_web',
            content: searchResult,
          });
        }
      }

      // Re-query OpenAI
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.ai_text_key}`,
        },
        body: JSON.stringify({
          model: settings.ai_text_model || 'gpt-4',
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status} in tool loop`);
      }

      data = await response.json();
      assistantMessage = data.choices?.[0]?.message;
    }

    return NextResponse.json({ 
      success: true, 
      message: { 
        role: 'assistant', 
        content: assistantMessage?.content || 'I could not generate a response. Please try again.' 
      },
      isOfflineMode: false
    });

  } catch (error) {
    console.error('Phase 2 chat route error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
