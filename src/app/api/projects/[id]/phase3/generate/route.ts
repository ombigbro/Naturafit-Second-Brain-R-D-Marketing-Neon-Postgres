import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import * as fs from 'fs/promises';
import * as path from 'path';

export const dynamic = 'force-dynamic';

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
    const { type, brandName, visualAesthetic } = body;

    if (!type || !brandName || !visualAesthetic) {
      return NextResponse.json({ error: 'Type, Brand Name, and Visual Aesthetic parameters are required.' }, { status: 400 });
    }

    if (type !== '2d' && type !== '3d') {
      return NextResponse.json({ error: 'Invalid generation type. Must be "2d" or "3d".' }, { status: 400 });
    }

    const settings = await db.globalSettings.findUnique({
      where: { id: 1 },
    });

    const isOfflineMode = !settings || !settings.ai_image_key || settings.ai_image_key === 'dummy_image_key_change_me';

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

    const primaryIngredients = phase2StateObj?.sparringSummary?.formulation?.primaryIngredients || '';

    // Check category based on primary ingredients
    let category = 'wellness';
    if (primaryIngredients.toLowerCase().includes('psyllium') || primaryIngredients.toLowerCase().includes('slim') || primaryIngredients.toLowerCase().includes('diet')) {
      category = 'slimming';
    } else if (primaryIngredients.toLowerCase().includes('collagen') || primaryIngredients.toLowerCase().includes('glutathione') || primaryIngredients.toLowerCase().includes('skin')) {
      category = 'collagen';
    }

    if (isOfflineMode) {
      // Offline/simulation mode: map to static pre-generated images
      let simulatedUrl = '';
      if (category === 'slimming') {
        simulatedUrl = type === '2d' ? '/simulation/slimming_2d.png' : '/simulation/slimming_3d.png';
      } else if (category === 'collagen') {
        simulatedUrl = type === '2d' ? '/simulation/collagen_2d.png' : '/simulation/collagen_3d.png';
      } else {
        simulatedUrl = type === '2d' ? '/simulation/wellness_2d.png' : '/simulation/wellness_3d.png';
      }

      // Add a small artificial delay of 1.5s to mimic AI generation latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        success: true,
        url: simulatedUrl,
        isOfflineMode: true
      });
    }

    // Prepare OpenAI Image Prompt
    let imagePrompt = '';
    if (type === '2d') {
      imagePrompt = `A flat 2D packaging label design for a premium product brand named '${brandName}'. Style aesthetic: ${visualAesthetic}. Centered composition, botanical vector line art, clean elegant typography, flat illustration style, 2d graphical layout.`;
    } else {
      imagePrompt = `A premium 3D product mockup packaging jar, bottle, can or box on a solid, clean, neutral plain light gray background. The packaging features the brand logo and label '${brandName}' printed on it, matching the style aesthetic: ${visualAesthetic}. Realistic studio lighting, professional product showcase photography, soft shadow, sharp details.`;
    }

    // Call DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.ai_image_key}`,
      },
      body: JSON.stringify({
        model: settings.ai_image_model || 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI DALL-E API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const tempUrl = data.data?.[0]?.url;

    if (!tempUrl) {
      throw new Error('OpenAI responded without image URL data.');
    }

    // Download the generated image and save locally to server storage
    const imgResponse = await fetch(tempUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to download image from OpenAI temp URL: ${tempUrl}`);
    }

    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());

    const storageDir = process.env.STORAGE_DIR || './storage';
    const projectImagesDir = path.join(storageDir, 'projects', params.id, 'images');

    // Ensure directory exists
    await fs.mkdir(projectImagesDir, { recursive: true });

    const filename = `${Date.now()}_${type}.png`;
    const filePath = path.join(projectImagesDir, filename);

    // Save image file
    await fs.writeFile(filePath, imgBuffer);

    // Serve URL via files route
    const servedUrl = `/api/files/projects/${params.id}/images/${filename}`;

    return NextResponse.json({
      success: true,
      url: servedUrl,
      isOfflineMode: false
    });

  } catch (error) {
    console.error('Phase 3 image generation error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
