import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import * as fs from 'fs/promises';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const relativePath = params.path.join('/');
    
    // Prevent directory traversal attacks
    if (relativePath.includes('..') || relativePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const storageDir = process.env.STORAGE_DIR || './storage';
    const filePath = path.resolve(path.join(storageDir, relativePath));

    // Ensure target path starts with storage directory
    const resolvedStorageDir = path.resolve(storageDir);
    if (!filePath.startsWith(resolvedStorageDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const fileBuffer = await fs.readFile(filePath);
      const mimeType = getMimeType(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        },
      });
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.csv':
      return 'text/csv';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}
