import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import db, { serializeState } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RawProduct {
  originalName: string;
  launchDate: string;
  avgUnitPrice: number;
  revenue: number;
  tiktokLink: string;
}

interface AIProductInfo {
  originalName: string;
  cleanedName: string;
  isBpomTrMd: boolean;
  category: string;
}

interface GroupedProduct {
  name: string;
  category: string;
  revenue: number;
  totalPrice: number;
  count: number;
  earliestLaunchDate: string;
  tiktokLink: string;
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

    // Role check: Admins can only view/modify their own projects, Super Admins can do all
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

    let rows: unknown[][];
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a valid CSV or XLSX file.' },
        { status: 400 }
      );
    }

    if (!rows || rows.length < 2) {
      return NextResponse.json(
        { error: 'The uploaded file is empty or does not contain data rows.' },
        { status: 400 }
      );
    }

    // Identify header indices dynamically
    let headerRowIdx = -1;
    let colIndices = { name: -1, launchDate: -1, avgPrice: -1, revenue: -1, link: -1 };

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;

      let nameIdx = -1;
      let launchIdx = -1;
      let priceIdx = -1;
      let revIdx = -1;
      let linkIdx = -1;

      for (let j = 0; j < row.length; j++) {
        const cellVal = String(row[j] || '').toLowerCase().trim();
        if (!cellVal) continue;

        if (cellVal.includes('product') || cellVal.includes('name') || cellVal.includes('produk') || cellVal.includes('nama')) {
          nameIdx = j;
        } else if (cellVal.includes('launch') || cellVal.includes('date') || cellVal.includes('time') || cellVal.includes('rilis') || cellVal.includes('tanggal')) {
          launchIdx = j;
        } else if (cellVal.includes('price') || cellVal.includes('harga') || cellVal.includes('rate') || cellVal.includes('unit price')) {
          priceIdx = j;
        } else if (cellVal.includes('revenue') || cellVal.includes('sales') || cellVal.includes('omset') || cellVal.includes('30-day') || cellVal.includes('30d')) {
          revIdx = j;
        } else if (cellVal.includes('url') || cellVal.includes('link') || cellVal.includes('tiktok') || cellVal.includes('shop')) {
          linkIdx = j;
        }
      }

      // Check if we matched name and revenue
      if (nameIdx !== -1 && revIdx !== -1) {
        headerRowIdx = i;
        colIndices = { name: nameIdx, launchDate: launchIdx, avgPrice: priceIdx, revenue: revIdx, link: linkIdx };
        break;
      }
    }

    // Fallback if header row could not be identified by keyword matches
    if (headerRowIdx === -1) {
      if (rows[0] && rows[0].length >= 2) {
        headerRowIdx = 0;
        colIndices = {
          name: 0,
          launchDate: rows[0].length > 1 ? 1 : -1,
          avgPrice: rows[0].length > 2 ? 2 : -1,
          revenue: rows[0].length > 3 ? 3 : -1,
          link: rows[0].length > 5 ? 5 : (rows[0].length > 4 ? 4 : -1),
        };
      } else {
        return NextResponse.json(
          { error: 'Invalid columns. Ensure Product Name and 30-day Revenue are present.' },
          { status: 400 }
        );
      }
    }

    const products: RawProduct[] = [];
    const startRow = headerRowIdx + 1;
    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      const name = String(row[colIndices.name] || '').trim();
      if (!name) continue;

      const rawLaunchDate = colIndices.launchDate !== -1 ? String(row[colIndices.launchDate] || '').trim() : '';
      const rawPrice = colIndices.avgPrice !== -1 ? row[colIndices.avgPrice] : 0;
      const rawRevenue = colIndices.revenue !== -1 ? row[colIndices.revenue] : 0;

      const avgUnitPrice = cleanNumber(rawPrice);
      const revenue = cleanNumber(rawRevenue);

      let launchDate = rawLaunchDate;
      // If it's a numeric excel date code, convert it to YYYY-MM-DD
      if (typeof row[colIndices.launchDate] === 'number') {
        try {
          const jsDate = XLSX.SSF.parse_date_code(row[colIndices.launchDate]);
          launchDate = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
        } catch {
          launchDate = rawLaunchDate;
        }
      }

      products.push({
        originalName: name,
        launchDate: launchDate || 'N/A',
        avgUnitPrice,
        revenue,
        tiktokLink: colIndices.link !== -1 ? String(row[colIndices.link] || '').trim() : '',
      });
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No product rows found in the uploaded file.' },
        { status: 400 }
      );
    }

    // Sort by revenue descending
    products.sort((a, b) => b.revenue - a.revenue);

    // Cover top 150 products by revenue to avoid token limits
    const limit = 150;
    const productsToProcess = products.slice(0, limit);

    // Fetch Super Admin prompt and key
    const settings = await db.globalSettings.findUnique({
      where: { id: 1 },
    });

    let aiResult: AIProductInfo[] = [];
    let isOfflineMode = false;

    if (!settings || !settings.ai_text_key || settings.ai_text_key === 'dummy_text_key_change_me') {
      isOfflineMode = true;
      aiResult = runLocalFallback(productsToProcess);
    } else {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.ai_text_key}`,
          },
          body: JSON.stringify({
            model: settings.ai_text_model || 'gpt-4',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `${settings.phase_1_prompt || 'You are a Data Analyst AI.'}\n\n` +
                  `Analyze the user's product catalog. For each product name:\n` +
                  `1. Clean and normalize the name, stripping variants, sizes (e.g. 50ml, 120gr), and promo details (e.g. READY, [READY], BUY 1 GET 1, PROMO).\n` +
                  `2. Identify if the product belongs to BPOM TR (traditional medicine/supplement/herbs) or BPOM MD (domestic food/beverage) in Indonesia. Exclude cosmetics (BPOM NA), medical drugs, imported foods (ML), or non-BPOM items.\n` +
                  `3. Assign a primary benefit/claim category (e.g. Weight Loss, Skin Health, Healthy Beverage, Herbal Health, Immunity, General Health, etc.).\n\n` +
                  `Return your output strictly as a JSON object in this format:\n` +
                  `{\n` +
                  `  "products": [\n` +
                  `    {\n` +
                  `      "originalName": "string",\n` +
                  `      "cleanedName": "string",\n` +
                  `      "isBpomTrMd": boolean,\n` +
                  `      "category": "string"\n` +
                  `    }\n` +
                  `  ]\n` +
                  `}`,
              },
              {
                role: 'user',
                content: `Please analyze the following product names:\n\n${JSON.stringify(
                  productsToProcess.map((p) => p.originalName)
                )}`,
              },
            ],
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI responded with status ${response.status}`);
        }

        const data = await response.json();
        const rawJson = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(rawJson);
        aiResult = parsed.products || [];
      } catch (e) {
        console.warn('OpenAI query failed. Falling back to offline rule engine:', e);
        isOfflineMode = true;
        aiResult = runLocalFallback(productsToProcess);
      }
    }

    // Deduplicate and aggregate
    const grouped: { [key: string]: GroupedProduct } = {};

    for (const rawProduct of productsToProcess) {
      const aiInfo = aiResult.find((a) => a.originalName === rawProduct.originalName);
      if (!aiInfo || !aiInfo.isBpomTrMd) continue;

      const cleanName = aiInfo.cleanedName || rawProduct.originalName;
      const category = aiInfo.category || 'General Health';
      const key = cleanName.toLowerCase().trim();

      if (!grouped[key]) {
        grouped[key] = {
          name: cleanName,
          category,
          revenue: 0,
          totalPrice: 0,
          count: 0,
          earliestLaunchDate: rawProduct.launchDate,
          tiktokLink: rawProduct.tiktokLink || '',
        };
      }

      const item = grouped[key];
      item.revenue += rawProduct.revenue;
      item.totalPrice += rawProduct.avgUnitPrice;
      item.count += 1;

      // Maintain a valid tiktok link if we find one in the raw data
      if (rawProduct.tiktokLink && !item.tiktokLink) {
        item.tiktokLink = rawProduct.tiktokLink;
      }

      if (rawProduct.launchDate && rawProduct.launchDate !== 'N/A') {
        if (item.earliestLaunchDate === 'N/A' || new Date(rawProduct.launchDate) < new Date(item.earliestLaunchDate)) {
          item.earliestLaunchDate = rawProduct.launchDate;
        }
      }
    }

    const finalProducts = Object.values(grouped).map((item: GroupedProduct) => {
      const avgPrice = item.count > 0 ? Math.round(item.totalPrice / item.count) : 0;
      return {
        name: item.name,
        category: item.category,
        revenue: item.revenue,
        avgUnitPrice: avgPrice,
        launchDate: item.earliestLaunchDate,
        tiktokLink: item.tiktokLink || `https://www.tiktok.com/search?q=${encodeURIComponent(item.name)}`,
      };
    });

    finalProducts.sort((a, b) => b.revenue - a.revenue);

    const payload = {
      products: finalProducts,
      isOfflineMode,
      processedAt: new Date().toISOString(),
      totalBpomProducts: finalProducts.length,
      totalRevenue: finalProducts.reduce((sum, p) => sum + p.revenue, 0),
      categories: Array.from(new Set(finalProducts.map((p) => p.category))),
    };

    // Save payload to phase_1_state using database serialization helper
    await db.project.update({
      where: { id: params.id },
      data: {
        phase_1_state: serializeState(payload) as string,
      },
    });

    return NextResponse.json({ success: true, state: payload });
  } catch (error) {
    console.error('Phase 1 pipeline error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}

export async function DELETE(
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

    await db.project.update({
      where: { id: params.id },
      data: {
        phase_1_state: null as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset Phase 1 state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function cleanNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function runLocalFallback(products: RawProduct[]): AIProductInfo[] {
  return products.map((p) => {
    const name = p.originalName;
    const nameLower = name.toLowerCase();

    let isBpomTrMd = false;
    let category = 'General Health';
    let cleanedName = name;

    // 1. Determine Category
    if (nameLower.includes('slim') || nameLower.includes('pelangsing') || nameLower.includes('diet') || nameLower.includes('detox') || nameLower.includes('flim')) {
      category = 'Weight Loss';
      isBpomTrMd = true;
    } else if (nameLower.includes('collagen') || nameLower.includes('glow') || nameLower.includes('skin') || nameLower.includes('bright') || nameLower.includes('putih') || nameLower.includes('wajah') || nameLower.includes('pemutih')) {
      category = 'Skin Health';
      isBpomTrMd = true;
    } else if (nameLower.includes('kopi') || nameLower.includes('coffee') || nameLower.includes('teh') || nameLower.includes('tea') || nameLower.includes('drink') || nameLower.includes('susu') || nameLower.includes('milk') || nameLower.includes('matcha')) {
      category = 'Healthy Beverage';
      isBpomTrMd = true;
    } else if (nameLower.includes('madu') || nameLower.includes('honey') || nameLower.includes('jamu') || nameLower.includes('herbal') || nameLower.includes('rempah') || nameLower.includes('temulawak') || nameLower.includes('jahe') || nameLower.includes('curcuma')) {
      category = 'Herbal Health';
      isBpomTrMd = true;
    } else if (nameLower.includes('imun') || nameLower.includes('immune') || nameLower.includes('vit') || nameLower.includes('vitamin') || nameLower.includes('boost')) {
      category = 'Immunity';
      isBpomTrMd = true;
    }

    if (nameLower.includes('bpom') || nameLower.includes(' tr') || nameLower.includes(' md') || /\b(tr|md)\d+/.test(nameLower)) {
      isBpomTrMd = true;
    }

    // 2. Clean Product Name (remove brackets, sizing, etc.)
    cleanedName = cleanedName
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/(ready|stock|promo|buy\s*\d+\s*get\s*\d+|diskon|discount|free\s*ongkir|original|bpom|halal|100%\s*ori)/gi, '')
      .replace(/\d+\s*(ml|gr|g|pcs|sachet|capsule|kapsul|box|botol|btl|tablet)/gi, '')
      .trim()
      .replace(/\s+/g, ' ');

    cleanedName = cleanedName
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (!cleanedName) {
      cleanedName = name;
    }

    return {
      originalName: name,
      cleanedName,
      isBpomTrMd,
      category,
    };
  });
}
