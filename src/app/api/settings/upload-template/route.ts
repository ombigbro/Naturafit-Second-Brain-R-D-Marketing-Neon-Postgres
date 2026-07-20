import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storageDir = process.env.STORAGE_DIR || './storage';
    const templatesDir = path.join(storageDir, 'templates');

    // Ensure the directories exist
    await fs.mkdir(templatesDir, { recursive: true });

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(templatesDir, filename);

    // Save the file locally
    await fs.writeFile(filePath, buffer);

    const masterTemplateUrl = `/api/files/templates/${filename}`;

    // Update DB settings
    await db.globalSettings.upsert({
      where: { id: 1 },
      update: { master_template_url: masterTemplateUrl },
      create: {
        id: 1,
        ai_text_key: '',
        ai_text_model: 'gpt-4',
        ai_image_key: '',
        ai_image_model: 'dall-e-3',
        phase_1_prompt: '',
        phase_2_prompt: '',
        phase_3_prompt: '',
        phase_4_prompt: '',
        master_template_url: masterTemplateUrl,
      },
    });

    return NextResponse.json({ success: true, url: masterTemplateUrl, filename: file.name });
  } catch (error) {
    console.error('Template upload error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + errorMessage }, { status: 500 });
  }
}
