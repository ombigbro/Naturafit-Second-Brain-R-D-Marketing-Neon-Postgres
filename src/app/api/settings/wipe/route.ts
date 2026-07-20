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

    const { targetProjectId } = await request.json().catch(() => ({ targetProjectId: null }));

    const storageDir = process.env.STORAGE_DIR || './storage';

    if (targetProjectId) {
      // Wipe specific project
      // Check if project exists
      const project = await db.project.findUnique({
        where: { id: targetProjectId },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 444 });
      }

      // Delete project files in storage (stored inside storage/projects/[projectId])
      const projectDir = path.join(storageDir, 'projects', targetProjectId);
      try {
        await fs.rm(projectDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Error deleting project storage dir for ${targetProjectId}:`, err);
      }

      // Delete project from database
      await db.project.delete({
        where: { id: targetProjectId },
      });

      return NextResponse.json({ success: true, message: `Project ${targetProjectId} and its files wiped successfully.` });
    } else {
      // Wipe all storage and all projects
      try {
        // Delete everything inside storage directory
        await fs.rm(storageDir, { recursive: true, force: true });
        // Recreate base storage folders
        await fs.mkdir(path.join(storageDir, 'templates'), { recursive: true });
        await fs.mkdir(path.join(storageDir, 'projects'), { recursive: true });
      } catch (err) {
        console.error('Error deleting server storage:', err);
      }

      // Delete all projects from DB
      await db.project.deleteMany({});

      // Reset template in global settings
      await db.globalSettings.update({
        where: { id: 1 },
        data: { master_template_url: null },
      });

      return NextResponse.json({ success: true, message: 'All project data, storage files, and templates have been wiped.' });
    }
  } catch (error) {
    console.error('Wipe storage error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + errorMessage }, { status: 500 });
  }
}
