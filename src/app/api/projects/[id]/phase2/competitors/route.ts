import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AffiliatorRow {
  name: string;
  followers: number;
  products: number;
  revenue: number;
}

interface VideoRow {
  title: string;
  link: string;
  views: number;
  likes: number;
  revenue: number;
}

interface LiveRow {
  title: string;
  date: string;
  duration: number;
  peakViewers: number;
  revenue: number;
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
      console.error('Competitor file parse error:', e);
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a valid Excel spreadsheet.' },
        { status: 400 }
      );
    }

    const sheetNames = workbook.SheetNames;
    
    // Flexible helper to find sheets by keyword
    const findSheet = (keywords: string[]) => {
      return sheetNames.find(name => 
        keywords.some(kw => name.toLowerCase().includes(kw))
      );
    };

    const affiliatorsSheetName = findSheet(['affiliator', 'affiliate', 'creator']);
    const videosSheetName = findSheet(['video']);
    const livesSheetName = findSheet(['live', 'session', 'livestream']);

    if (!affiliatorsSheetName || !videosSheetName || !livesSheetName) {
      const missing = [];
      if (!affiliatorsSheetName) missing.push('Affiliators');
      if (!videosSheetName) missing.push('Videos');
      if (!livesSheetName) missing.push('Live Sessions');
      return NextResponse.json(
        { error: `Invalid competitor file. Missing sheets: ${missing.join(', ')}. The file must contain all three sheets.` },
        { status: 400 }
      );
    }

    // Helper to get rows from a sheet
    const getSheetRows = (sheetName: string): unknown[][] => {
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    };

    const cleanNumber = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const cleanString = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    // Helper to parse duration string like "2h 49m" or "3h" to minutes
    const parseDurationToMinutes = (val: unknown): number => {
      if (typeof val === 'number') return val;
      const str = String(val || '').toLowerCase().trim();
      if (!str) return 0;
      
      const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*h/);
      const minMatch = str.match(/(\d+)\s*m/);
      
      let mins = 0;
      if (hourMatch) {
        mins += parseFloat(hourMatch[1]) * 60;
      }
      if (minMatch) {
        mins += parseInt(minMatch[1], 10);
      }
      
      if (mins > 0) return mins;
      
      const cleaned = str.replace(/[^0-9.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    // 1. Process Affiliators Sheet
    const affRows = getSheetRows(affiliatorsSheetName);
    const parsedAffiliators: AffiliatorRow[] = [];
    if (affRows.length > 1) {
      const header = affRows[0].map(h => String(h || '').toLowerCase().trim());
      
      const nameIdx = header.findIndex(h => h.includes('name') || h.includes('affiliator') || h.includes('creator') || h.includes('handle'));
      const followersIdx = header.findIndex(h => h.includes('follower') || h.includes('pengikut') || h.includes('fans'));
      const productsIdx = header.findIndex(h => h.includes('product') || h.includes('produk') || h.includes('promoted') || h.includes('sold') || h.includes('item'));
      const revenueIdx = header.findIndex(h => h.includes('revenue') || h.includes('sales') || h.includes('omset') || h.includes('gmv') || h.includes('rp'));

      // Use column mapping or fallbacks
      const colMap = {
        name: nameIdx !== -1 ? nameIdx : 0,
        followers: followersIdx !== -1 ? followersIdx : 1,
        products: productsIdx !== -1 ? productsIdx : 2,
        revenue: revenueIdx !== -1 ? revenueIdx : 3
      };

      for (let i = 1; i < affRows.length; i++) {
        const row = affRows[i];
        if (!row || row.length === 0) continue;
        const name = cleanString(row[colMap.name]);
        if (!name) continue;

        parsedAffiliators.push({
          name,
          followers: Math.round(cleanNumber(row[colMap.followers])),
          products: Math.round(cleanNumber(row[colMap.products])),
          revenue: cleanNumber(row[colMap.revenue])
        });
      }
    }

    // 2. Process Videos Sheet
    const videoRows = getSheetRows(videosSheetName);
    const parsedVideos: VideoRow[] = [];
    if (videoRows.length > 1) {
      const header = videoRows[0].map(h => String(h || '').toLowerCase().trim());

      const titleIdx = header.findIndex(h => h.includes('title') || h.includes('video') || h.includes('deskripsi') || h.includes('judul') || h.includes('description'));
      const creatorIdx = header.findIndex(h => h.includes('creator') || h.includes('handle') || h.includes('user'));
      const linkIdx = header.findIndex(h => h.includes('link') || h.includes('url') || h.includes('tiktok'));
      const viewsIdx = header.findIndex(h => h.includes('view') || h.includes('play') || h.includes('tonton'));
      const likesIdx = header.findIndex(h => h.includes('like') || h.includes('suka'));
      const revenueIdx = header.findIndex(h => h.includes('revenue') || h.includes('sales') || h.includes('omset') || h.includes('rp'));

      const colMap = {
        title: titleIdx !== -1 ? titleIdx : 0,
        creator: creatorIdx !== -1 ? creatorIdx : -1,
        link: linkIdx !== -1 ? linkIdx : 1,
        views: viewsIdx !== -1 ? viewsIdx : 2,
        likes: likesIdx !== -1 ? likesIdx : 3,
        revenue: revenueIdx !== -1 ? revenueIdx : 4
      };

      for (let i = 1; i < videoRows.length; i++) {
        const row = videoRows[i];
        if (!row || row.length === 0) continue;
        const rawTitle = cleanString(row[colMap.title]);
        if (!rawTitle) continue;

        const creator = colMap.creator !== -1 ? cleanString(row[colMap.creator]) : '';
        const title = creator ? `@${creator}: ${rawTitle}` : rawTitle;

        parsedVideos.push({
          title,
          link: cleanString(row[colMap.link]) || `https://www.tiktok.com/search?q=${encodeURIComponent(rawTitle)}`,
          views: Math.round(cleanNumber(row[colMap.views])),
          likes: colMap.likes !== -1 && likesIdx !== -1 ? Math.round(cleanNumber(row[colMap.likes])) : 0,
          revenue: cleanNumber(row[colMap.revenue])
        });
      }
    }

    // 3. Process Live Sessions Sheet
    const liveRows = getSheetRows(livesSheetName);
    const parsedLives: LiveRow[] = [];
    if (liveRows.length > 1) {
      const header = liveRows[0].map(h => String(h || '').toLowerCase().trim());

      const titleIdx = header.findIndex(h => h.includes('title') || h.includes('live') || h.includes('judul') || h.includes('creator') || h.includes('handle'));
      const dateIdx = header.findIndex(h => h.includes('date') || h.includes('tanggal') || h.includes('time'));
      const durationIdx = header.findIndex(h => h.includes('durat') || h.includes('menit') || h.includes('time') || h.includes('min'));
      const peakIdx = header.findIndex(h => h.includes('peak') || h.includes('viewer') || h.includes('uv') || h.includes('penonton') || h.includes('view'));
      const revenueIdx = header.findIndex(h => h.includes('revenue') || h.includes('sales') || h.includes('omset') || h.includes('rp'));

      const colMap = {
        title: titleIdx !== -1 ? titleIdx : 0,
        date: dateIdx !== -1 ? dateIdx : -1,
        duration: durationIdx !== -1 ? durationIdx : 1,
        peak: peakIdx !== -1 ? peakIdx : 2,
        revenue: revenueIdx !== -1 ? revenueIdx : 3
      };

      for (let i = 1; i < liveRows.length; i++) {
        const row = liveRows[i];
        if (!row || row.length === 0) continue;
        const title = cleanString(row[colMap.title]);
        if (!title) continue;

        let date = 'N/A';
        if (colMap.date !== -1) {
          const rawDate = row[colMap.date];
          date = cleanString(rawDate);
          if (typeof rawDate === 'number') {
            try {
              const jsDate = XLSX.SSF.parse_date_code(rawDate);
              date = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
            } catch {
              date = cleanString(rawDate);
            }
          }
        }

        parsedLives.push({
          title,
          date: date || 'N/A',
          duration: Math.round(parseDurationToMinutes(row[colMap.duration])),
          peakViewers: Math.round(cleanNumber(row[colMap.peak])),
          revenue: cleanNumber(row[colMap.revenue])
        });
      }
    }

    // 4. Sort and compile data
    parsedAffiliators.sort((a, b) => b.revenue - a.revenue);
    parsedVideos.sort((a, b) => b.revenue - a.revenue);
    parsedLives.sort((a, b) => b.revenue - a.revenue);

    const totalAffiliatorsRevenue = parsedAffiliators.reduce((sum, item) => sum + item.revenue, 0);
    const totalFollowersReached = parsedAffiliators.reduce((sum, item) => sum + item.followers, 0);

    const totalVideosRevenue = parsedVideos.reduce((sum, item) => sum + item.revenue, 0);
    const totalViews = parsedVideos.reduce((sum, item) => sum + item.views, 0);
    const totalLikes = parsedVideos.reduce((sum, item) => sum + item.likes, 0);

    const totalLivesRevenue = parsedLives.reduce((sum, item) => sum + item.revenue, 0);
    const totalLivesPeakViewers = parsedLives.reduce((sum, item) => Math.max(sum, item.peakViewers), 0);
    const avgLiveDuration = parsedLives.length > 0
      ? Math.round(parsedLives.reduce((sum, item) => sum + item.duration, 0) / parsedLives.length)
      : 0;

    const totalCompetitorRevenue = totalAffiliatorsRevenue;

    const summary = {
      processedAt: new Date().toISOString(),
      totalCompetitorRevenue,
      affiliators: {
        totalRevenue: totalAffiliatorsRevenue,
        totalReach: totalFollowersReached,
        count: parsedAffiliators.length,
        items: parsedAffiliators,
        top3: parsedAffiliators.slice(0, 3)
      },
      videos: {
        totalRevenue: totalVideosRevenue,
        totalViews,
        totalLikes,
        count: parsedVideos.length,
        items: parsedVideos,
        top3: parsedVideos.slice(0, 3)
      },
      lives: {
        totalRevenue: totalLivesRevenue,
        maxPeakViewers: totalLivesPeakViewers,
        avgDurationMins: avgLiveDuration,
        count: parsedLives.length,
        items: parsedLives,
        top3: parsedLives.slice(0, 3)
      }
    };

    return NextResponse.json({ success: true, summary });

  } catch (error) {
    console.error('Competitor spreadsheet parser error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
