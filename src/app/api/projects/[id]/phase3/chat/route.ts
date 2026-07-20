import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Local simulation fallback for Brand Brainstorming
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runLocalBrandBrainstorm(message: string, phase2State: any): string {
  const msgLower = message.toLowerCase();
  
  // Extract locked formulation context
  const formulation = phase2State?.sparringSummary?.formulation || {};
  const primary = formulation.primaryIngredients || 'natural herbs';
  const target = formulation.targetMarket || 'health-conscious consumers';
  
  // Detect category from primary ingredients
  let category = 'wellness';
  if (primary.toLowerCase().includes('psyllium') || primary.toLowerCase().includes('slim') || primary.toLowerCase().includes('diet')) {
    category = 'slimming';
  } else if (primary.toLowerCase().includes('collagen') || primary.toLowerCase().includes('glutathione') || primary.toLowerCase().includes('skin')) {
    category = 'collagen';
  }

  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey') || msgLower.length < 5) {
    return `Hello! I am your Brand Book & Visual Brainstorming partner. 
Based on your locked Phase 2 strategy, we are focusing on:
- **Ingredients:** ${primary}
- **Target Market:** ${target}

Let's start brainstorming! Ask me to:
1. "Brainstorm name options" to get brand name ideas.
2. "Suggest visual concepts" to detail the color schemes and aesthetic styles for the 2D layout and 3D mockups.`;
  }

  if (msgLower.includes('name') || msgLower.includes('nama') || msgLower.includes('brand') || msgLower.includes('opsi')) {
    if (category === 'slimming') {
      return `Here are 3 premium brand name concepts tailored for your Slimming Tea targeting "${target}":

1. **RimFit** (Combines traditional "Rimpang" with modern "Fitness" appeal. Represents active, clean wellness).
2. **SvelteHerbs** (Elegant, premium European-leaning branding. Positions the formulation as high-end metabolic support).
3. **Senna & Sereh** (Clean, transparency-focused naming referencing active natural ingredients. Appeals to clean-label enthusiasts).

Which of these directions appeals to you? Or would you like to tweak a concept?`;
    } else if (category === 'collagen') {
      return `Here are 3 premium brand name concepts tailored for your Collagen Beauty Drink targeting "${target}":

1. **GlowVita** (Dynamic, young energy. Focuses on the combined vitamin and glowing skin benefits).
2. **Nacre Marine** (Sophisticated, luxurious name referencing premium marine collagen tripeptides. Appeals to older/luxury markets).
3. **AuraBloom** (Focuses on holistic radiance and natural beauty. Highly shareable/viral potential on TikTok).

Do any of these names align with your brand vision?`;
    } else {
      return `Here are 3 premium brand name concepts tailored for your Wellness Formula targeting "${target}":

1. **Jamu Jaga** (Strong traditional Indonesian heritage. Clean, powerful, and trustworthy).
2. **RootRestore** (Focuses on ginger, curcuma roots. Modern apothecary aesthetic).
3. **PhytoShield** (Clinical and scientifically-backed immunity positioning).

Which direction aligns best with your goals?`;
    }
  }

  if (msgLower.includes('visual') || msgLower.includes('concept') || msgLower.includes('aesthetic') || msgLower.includes('style') || msgLower.includes('desain') || msgLower.includes('kemasan')) {
    if (category === 'slimming') {
      return `Here is a proposed Visual & Aesthetic Concept for your packaging layout:

- **Theme:** Botanical Green & Gold Elegance.
- **Color Palette:** Forest green backgrounds representing organic herbs, paired with metallic gold line art of ginger and lemongrass leaves.
- **Typography:** Sleek, modern sans-serif logo font combined with an elegant serif secondary typeface.
- **Vibe:** Clean, premium, clinical yet natural. Far from standard weight loss products, positioning it as daily self-care.

Would you like to use this theme, or should we adjust the color scheme?`;
    } else if (category === 'collagen') {
      return `Here is a proposed Visual & Aesthetic Concept for your packaging layout:

- **Theme:** Minimalist Pastel Pink & Rose Gold.
- **Color Palette:** Matte blush pink bottle base, minimalist rose gold wave lines (representing hydration/elasticity), and high-contrast charcoal text.
- **Typography:** Thin, geometric sans-serif font centered on the label.
- **Vibe:** Clean beauty, premium dermatological-grade drink, highly aesthetic for TikTok shelfie shots.

Would you like to move forward with this aesthetic?`;
    } else {
      return `Here is a proposed Visual & Aesthetic Concept for your packaging layout:

- **Theme:** Warm Earthy Terracotta.
- **Color Palette:** Rich terracotta/amber clay base with hand-drawn white outlines of ginger roots and honey combs.
- **Typography:** Classic serif typeface inspired by traditional apothecary jars.
- **Vibe:** Authentic, organic, artisanal warmth, evoking trust and natural immunity.

Let me know if this suits your design vision!`;
    }
  }

  return `That's a fantastic direction! For a product formulated with **${primary}** targeting **${target}**, here is how we can refine it:
1. We can focus on name concepts that highlight the core health benefit.
2. We can design packaging aesthetics that stand out from competitors on TikTok Shop (e.g., using bold color gradients or ultra-minimalistic typography).

Ask me for "Brainstorm name options" or "Suggest visual concepts" to drill down into the details!`;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let phase2StateObj: any = null;
    if (project.phase_2_state) {
      try {
        phase2StateObj = typeof project.phase_2_state === 'string' 
          ? JSON.parse(project.phase_2_state) 
          : project.phase_2_state;
      } catch (e) {
        console.warn('Failed to parse phase 2 state:', e);
      }
    }

    const isOfflineMode = !settings || !settings.ai_text_key || settings.ai_text_key === 'dummy_text_key_change_me';

    if (isOfflineMode) {
      const lastUserMsg = clientMessages.filter(m => m.role === 'user').pop()?.content || '';
      const reply = runLocalBrandBrainstorm(lastUserMsg, phase2StateObj);
      return NextResponse.json({ 
        success: true, 
        message: { role: 'assistant', content: reply },
        isOfflineMode: true
      });
    }

    const formulation = phase2StateObj?.sparringSummary?.formulation || {};
    const primaryIng = formulation.primaryIngredients || 'Natural ingredients';
    const derivIng = formulation.derivativeIngredients || 'Other active compounds';
    const targetAud = formulation.targetMarket || 'General consumers';

    const systemInstruction = 
      `${settings.phase_3_prompt || 'You are a Brand Brainstorming & Visual Design AI.'}\n\n` +
      `Here is the locked Phase 2 Strategic Formulation & Competitor Context:\n` +
      `- Primary Ingredients: ${primaryIng}\n` +
      `- Derivative Ingredients: ${derivIng}\n` +
      `- Target Market: ${targetAud}\n\n` +
      `Use this context to brainstorm creative, memorable product brand names. ` +
      `Guide the user to detail their visual aesthetic parameters (e.g. colors, typography, style theme) for packaging layout generation. ` +
      `Be structured, creative, and highly design-oriented. Base your naming suggestions on target audience fit.`;

    const apiMessages = [
      { role: 'system', content: systemInstruction },
      ...clientMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    return NextResponse.json({ 
      success: true, 
      message: { 
        role: 'assistant', 
        content: assistantMessage?.content || 'I could not generate a naming concept. Please try again.' 
      },
      isOfflineMode: false
    });

  } catch (error) {
    console.error('Phase 3 chat route error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
