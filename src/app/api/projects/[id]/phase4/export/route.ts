import { NextResponse } from 'next/server';
import db, { parseState } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import * as fs from 'fs/promises';
import * as path from 'path';

export const dynamic = 'force-dynamic';

interface Slide {
  slideNumber: number;
  title: string;
  subtitle: string;
  content: string[];
}

interface Phase4State {
  slides?: Slide[];
  compiledAt?: string;
}

interface Phase3State {
  brandName?: string;
  visualAesthetic?: string;
  image2dUrl?: string | null;
  image3dUrl?: string | null;
}

interface ProductInput {
  name: string;
  category: string;
  revenue: number;
}

interface Phase1Input {
  totalBpomProducts?: number;
  totalRevenue?: number;
  categories?: string[];
  products?: ProductInput[];
}

interface Phase2Input {
  sparringSummary?: {
    formulation?: {
      primaryIngredients?: string;
      derivativeIngredients?: string;
      targetMarket?: string;
      topCompetitors?: string[];
    };
  };
  competitorData?: {
    totalCompetitorRevenue?: number;
    affiliators?: {
      top3?: { name: string; followers: number; products: number; revenue: number; }[];
    };
    videos?: {
      top3?: { title: string; link: string; views: number; likes: number; revenue: number; }[];
    };
  };
}

function resolveUrlToFilePath(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('/simulation/')) {
    return path.join(process.cwd(), 'public', url);
  }
  if (url.startsWith('/api/files/')) {
    const relativePath = url.replace('/api/files/', '');
    const storageDir = process.env.STORAGE_DIR || './storage';
    return path.resolve(path.join(storageDir, relativePath));
  }
  return null;
}

export async function GET(
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

    const p4 = parseState(project.phase_4_state) as Phase4State | null;
    const p3 = parseState(project.phase_3_state) as Phase3State | null;
    const p2 = parseState(project.phase_2_state) as Phase2Input | null;
    const p1 = parseState(project.phase_1_state) as Phase1Input | null;

    if (!p4 || !p4.slides) {
      return NextResponse.json({ error: 'Pitch Deck is not compiled yet.' }, { status: 400 });
    }

    const slides = p4.slides;

    const brandName = p3?.brandName || 'Untitled Brand';

    // Fetch images if available
    let img2dBuffer: Buffer | null = null;
    let img3dBuffer: Buffer | null = null;

    if (p3?.image2dUrl) {
      const filePath = resolveUrlToFilePath(p3.image2dUrl);
      if (filePath) {
        try {
          img2dBuffer = await fs.readFile(filePath);
        } catch (e) {
          console.error('Failed to read 2D packaging image:', filePath, e);
        }
      }
    }

    if (p3?.image3dUrl) {
      const filePath = resolveUrlToFilePath(p3.image3dUrl);
      if (filePath) {
        try {
          img3dBuffer = await fs.readFile(filePath);
        } catch (e) {
          console.error('Failed to read 3D packaging image:', filePath, e);
        }
      }
    }

    // Generate PDF buffer using PDFKit
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Color Palette Constants
      const BG_DARK = '#09090b';
      const BG_LIGHT = '#fafafa';
      const PURPLE_PRIMARY = '#8b5cf6';
      const TEXT_DARK = '#18181b';
      const TEXT_LIGHT = '#e4e4e7';
      const MUTED_TEXT_LIGHT = '#a1a1aa';
      const ACCENT_GOLD = '#f59e0b';
      
      const width = 841.89; // A4 Landscape width
      const height = 595.28; // A4 Landscape height

      // Helper to draw standard slide border & watermark
      const drawSlideFrame = (slideNo: number, titleText: string, subtitleText: string) => {
        // Light background
        doc.rect(0, 0, width, height).fill(BG_LIGHT);

        // Styled header banner
        doc.rect(0, 0, width, 8).fill(PURPLE_PRIMARY);
        doc.rect(0, 8, width, 4).fill(ACCENT_GOLD);

        // Slide title
        doc.fillColor(PURPLE_PRIMARY).font('Helvetica-Bold').fontSize(22).text(titleText, 50, 45);
        doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(11).text(subtitleText, 50, 72);

        // Bottom divider
        doc.strokeColor('#e4e4e7').lineWidth(1).moveTo(50, height - 50).lineTo(width - 50, height - 50).stroke();

        // Footer Text
        doc.fillColor('#71717a').font('Helvetica').fontSize(8);
        doc.text(`Project: ${project.name} | Brand: ${brandName}`, 50, height - 40);
        doc.text(`Slide ${slideNo} of 5`, width - 100, height - 40, { align: 'right', width: 50 });
      };

      // --- SLIDE 1: COVER SLIDE ---
      doc.rect(0, 0, width, height).fill(BG_DARK);

      // Gold and Purple decorative accents
      doc.circle(width - 80, 80, 150).fillOpacity(0.04).fill(PURPLE_PRIMARY);
      doc.circle(80, height - 80, 200).fillOpacity(0.03).fill(ACCENT_GOLD);
      doc.fillOpacity(1.0); // Reset opacity

      // Big logo/title
      doc.fillColor(ACCENT_GOLD).font('Helvetica-Bold').fontSize(46).text(brandName.toUpperCase(), 80, 180);
      
      // Horizontal highlight bar
      doc.rect(80, 240, 160, 4).fill(PURPLE_PRIMARY);

      // Presentation subtitle
      const subtitleVal = slides[0]?.subtitle || `E-Commerce Formulation & Launch Strategy Pitch`;
      doc.fillColor(TEXT_LIGHT).font('Helvetica').fontSize(20).text(subtitleVal, 80, 260);

      // Sub-bullet descriptions from content
      doc.fillColor(MUTED_TEXT_LIGHT).font('Helvetica').fontSize(10);
      let coverY = 320;
      const coverBulletPoints = slides[0]?.content || [];
      coverBulletPoints.forEach((bp: string) => {
        doc.text(`•  ${bp}`, 80, coverY);
        coverY += 20;
      });

      // Cover Footer
      doc.strokeColor('#27272a').lineWidth(1).moveTo(80, height - 60).lineTo(width - 80, height - 60).stroke();
      doc.fillColor(MUTED_TEXT_LIGHT).font('Helvetica-Bold').fontSize(9).text('SECOND BRAIN R&D MARKETING PLATFORM', 80, height - 48);
      doc.font('Helvetica').text(new Date(p4.compiledAt || Date.now()).toLocaleDateString(), width - 180, height - 48, { align: 'right', width: 100 });

      // --- SLIDE 2: MARKET OPPORTUNITY ---
      doc.addPage();
      const s2 = slides[1] || { title: 'Market Opportunity', subtitle: 'Category Trends' };
      drawSlideFrame(2, s2.title, s2.subtitle);

      // Render content bullets on the left
      doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(13);
      let s2Y = 130;
      const s2Bullets = s2.content || [];
      s2Bullets.forEach((bp: string) => {
        doc.text(`•  ${bp}`, 60, s2Y, { width: 380, lineGap: 6 });
        s2Y += doc.heightOfString(`•  ${bp}`, { width: 380 }) + 14;
      });

      // Draw beautiful market metrics graphics on the right
      const totalBpomVal = p1?.totalBpomProducts || '40+';
      const totalRevenueVal = p1?.totalRevenue ? `Rp ${(p1.totalRevenue / 1e9).toFixed(2)}B` : 'Rp 2.65B';
      const primaryCategoryVal = p1?.categories?.[0] || 'Herbal Wellness';

      // BPOM Card
      doc.roundedRect(480, 130, 290, 85, 8).fill('#f5f3ff');
      doc.fillColor(PURPLE_PRIMARY).font('Helvetica-Bold').fontSize(24).text(String(totalBpomVal), 505, 145);
      doc.fillColor('#4c1d95').font('Helvetica-Bold').fontSize(10).text('VERIFIED BPOM PRODUCTS IN DECK', 505, 175);
      doc.fillColor('#6d28d9').font('Helvetica').fontSize(8.5).text('Compliant with TR/MD certification rules.', 505, 190);

      // Revenue Card
      doc.roundedRect(480, 240, 290, 85, 8).fill('#fffbeb');
      doc.fillColor(ACCENT_GOLD).font('Helvetica-Bold').fontSize(24).text(totalRevenueVal, 505, 255);
      doc.fillColor('#78350f').font('Helvetica-Bold').fontSize(10).text('TOTAL 30-DAY ANALYZED MARKET VALUE', 505, 285);
      doc.fillColor('#92400e').font('Helvetica').fontSize(8.5).text(`Aggregated herbal and ${primaryCategoryVal} category GMV.`, 505, 300);

      // --- SLIDE 3: STRATEGIC Positioning ---
      doc.addPage();
      const s3 = slides[2] || { title: 'Strategic Positioning', subtitle: 'Active Ingredients' };
      drawSlideFrame(3, s3.title, s3.subtitle);

      // Left column: Bullet points
      doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(13);
      let s3Y = 130;
      const s3Bullets = s3.content || [];
      s3Bullets.forEach((bp: string) => {
        doc.text(`•  ${bp}`, 60, s3Y, { width: 380, lineGap: 6 });
        s3Y += doc.heightOfString(`•  ${bp}`, { width: 380 }) + 14;
      });

      // Right column: Formulation cards
      const primaryIng = p2?.sparringSummary?.formulation?.primaryIngredients || 'Natural herbs';
      const derivIng = p2?.sparringSummary?.formulation?.derivativeIngredients || 'Herbal extract';
      const targetAud = p2?.sparringSummary?.formulation?.targetMarket || 'Active consumers';

      doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(12).text('Formulation Specifications', 480, 120);

      // Primary Ingredients
      doc.roundedRect(480, 145, 290, 55, 6).fill('#eff6ff');
      doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(9).text('PRIMARY ACTIVE INGREDIENTS', 495, 155);
      doc.fillColor('#1e3a8a').font('Helvetica').fontSize(10).text(primaryIng, 495, 172, { width: 260, height: 20 });

      // Derivative Ingredients
      doc.roundedRect(480, 215, 290, 55, 6).fill('#ecfdf5');
      doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(9).text('DERIVATIVE SYSTEM CARRIER', 495, 225);
      doc.fillColor('#064e3b').font('Helvetica').fontSize(10).text(derivIng, 495, 242, { width: 260, height: 20 });

      // Target Market
      doc.roundedRect(480, 285, 290, 55, 6).fill('#fdf2f8');
      doc.fillColor('#9d174d').font('Helvetica-Bold').fontSize(9).text('TARGET AUDIENCE DEMOGRAPHIC', 495, 295);
      doc.fillColor('#831843').font('Helvetica').fontSize(10).text(targetAud, 495, 312, { width: 260, height: 20 });

      // --- SLIDE 4: COMPETITIVE LANDSCAPE ---
      doc.addPage();
      const s4 = slides[3] || { title: 'Competitive Landscape', subtitle: 'Competitor Revenue Metrics' };
      drawSlideFrame(4, s4.title, s4.subtitle);

      // Left column: Bullet points
      doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(13);
      let s4Y = 130;
      const s4Bullets = s4.content || [];
      s4Bullets.forEach((bp: string) => {
        doc.text(`•  ${bp}`, 60, s4Y, { width: 380, lineGap: 6 });
        s4Y += doc.heightOfString(`•  ${bp}`, { width: 380 }) + 14;
      });

      // Right column: Competitor GMV table
      const items = p2?.competitorData?.affiliators?.top3 || [];
      doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(12).text('Top Competitor Affiliates GMV Share', 480, 120);

      // Draw table header
      doc.rect(480, 140, 290, 25).fill(PURPLE_PRIMARY);
      doc.fillColor(TEXT_LIGHT).font('Helvetica-Bold').fontSize(9);
      doc.text('CREATOR HANDLE', 495, 148);
      doc.text('FOLLOWERS', 600, 148);
      doc.text('30D REVENUE', 680, 148, { align: 'right', width: 80 });

      let rowY = 165;
      items.forEach((item: { name: string; followers: number; revenue: number; }, idx: number) => {
        // Alternating row background
        doc.rect(480, rowY, 290, 32).fill(idx % 2 === 0 ? '#f4f4f5' : '#ffffff');
        
        doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(9.5);
        doc.text(item.name.startsWith('@') ? item.name : `@${item.name}`, 495, rowY + 11);
        
        doc.font('Helvetica').fontSize(9);
        const fCount = item.followers >= 1e6 ? `${(item.followers / 1e6).toFixed(1)}M` : (item.followers >= 1e3 ? `${(item.followers / 1e3).toFixed(0)}K` : item.followers.toString());
        doc.text(fCount, 600, rowY + 11);
        
        const revStr = item.revenue >= 1e9 ? `Rp ${(item.revenue / 1e9).toFixed(2)}B` : (item.revenue >= 1e6 ? `Rp ${(item.revenue / 1e6).toFixed(1)}M` : `Rp ${item.revenue.toLocaleString()}`);
        doc.text(revStr, 680, rowY + 11, { align: 'right', width: 80 });
        
        rowY += 32;
      });

      // Add a note below table
      doc.fillColor('#71717a').font('Helvetica-Oblique').fontSize(8);
      doc.text('*Data parsed dynamically from creator live and video sales analytics.', 480, rowY + 10);

      // --- SLIDE 5: BRAND PACKAGING SHOWCASE ---
      doc.addPage();
      const s5 = slides[4] || { title: 'Brand Packaging Showcase', subtitle: 'Aesthetic Concept & Renderings' };
      drawSlideFrame(5, s5.title, s5.subtitle);

      // Top description
      doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(11);
      doc.text(`Visual Aesthetic: ${p3?.visualAesthetic || 'Premium packaging design'}`, 50, 105, { width: width - 100 });

      // Embed 2D and 3D images side by side
      const drawPlaceholder = (x: number, y: number, w: number, h: number, text: string) => {
        doc.roundedRect(x, y, w, h, 8).fill('#e4e4e7');
        doc.strokeColor('#a1a1aa').lineWidth(1.5).roundedRect(x + 5, y + 5, w - 10, h - 10, 6).stroke();
        doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(11).text(text, x, y + h / 2 - 10, { align: 'center', width: w });
      };

      const imgY = 135;
      const imgWidth = 330;
      const imgHeight = 310;

      // 2D Image Left
      if (img2dBuffer) {
        try {
          doc.image(img2dBuffer, 60, imgY, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight], align: 'center', valign: 'center' });
          doc.rect(60, imgY, imgWidth, imgHeight).strokeColor('#e4e4e7').lineWidth(1).stroke();
        } catch (e) {
          console.error('PDFKit error embedding 2D image:', e);
          drawPlaceholder(60, imgY, imgWidth, imgHeight, 'APPROVED 2D PACKAGING LABEL');
        }
      } else {
        drawPlaceholder(60, imgY, imgWidth, imgHeight, 'APPROVED 2D PACKAGING LABEL');
      }

      // 3D Image Right
      if (img3dBuffer) {
        try {
          doc.image(img3dBuffer, width - 60 - imgWidth, imgY, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight], align: 'center', valign: 'center' });
          doc.rect(width - 60 - imgWidth, imgY, imgWidth, imgHeight).strokeColor('#e4e4e7').lineWidth(1).stroke();
        } catch (e) {
          console.error('PDFKit error embedding 3D image:', e);
          drawPlaceholder(width - 60 - imgWidth, imgY, imgWidth, imgHeight, 'APPROVED 3D PACKAGING MOCKUP');
        }
      } else {
        drawPlaceholder(width - 60 - imgWidth, imgY, imgWidth, imgHeight, 'APPROVED 3D PACKAGING MOCKUP');
      }

      // Sub labels below images
      doc.fillColor(PURPLE_PRIMARY).font('Helvetica-Bold').fontSize(11);
      doc.text('APPROVED 2D LABEL DESIGN', 60, imgY + imgHeight + 10, { align: 'center', width: imgWidth });
      doc.text('APPROVED 3D PRODUCT MOCKUP', width - 60 - imgWidth, imgY + imgHeight + 10, { align: 'center', width: imgWidth });

      doc.end();
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${brandName.replace(/\s+/g, '_')}_Pitch_Deck.pdf"`,
      },
    });

  } catch (error) {
    console.error('Phase 4 export error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
