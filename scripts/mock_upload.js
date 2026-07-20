const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

function cleanNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function runLocalFallback(products) {
  return products.map((p) => {
    const name = p.originalName;
    const nameLower = name.toLowerCase();

    let isBpomTrMd = false;
    let category = 'General Health';
    let cleanedName = name;

    // Determine Category
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

    // Clean Product Name
    cleanedName = cleanedName
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/(ready|stock|promo|buy\s*\d+\s*get\s*\d+|diskon|discount|free\s*ongkir|original|bpom|halal|100%\s*ori)/gi, '')
      .replace(/\d+\s*(ml|gr|g|pcs|sachet|capsule|kapsul|box|botol|btl|tablet)/gi, '')
      .trim()
      .replace(/\s+/g, ' ');

    cleanedName = cleanedName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
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

async function main() {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile('d:\\Project\\Second Brain R&D Marketing v3\\Kalodata_Product manual clean v3.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const products = [];
  const headerRowIdx = 0;
  const colIndices = {
    name: 0,
    launchDate: 1,
    avgPrice: 3,
    revenue: 4,
    link: 5
  };

  console.log('Parsing rows...');
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    const name = String(row[colIndices.name] || '').trim();
    if (!name) continue;

    const rawLaunchDate = String(row[colIndices.launchDate] || '').trim();
    const rawPrice = row[colIndices.avgPrice];
    const rawRevenue = row[colIndices.revenue];
    const rawLink = row[colIndices.link] ? String(row[colIndices.link]).trim() : '';

    const avgUnitPrice = cleanNumber(rawPrice);
    const revenue = cleanNumber(rawRevenue);

    let launchDate = rawLaunchDate;
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
      tiktokLink: rawLink,
    });
  }

  console.log(`Found ${products.length} products. Running fallback parser for top 150...`);
  products.sort((a, b) => b.revenue - a.revenue);
  const productsToProcess = products.slice(0, 150);

  const aiResult = runLocalFallback(productsToProcess);

  console.log('Deduplicating and grouping...');
  const grouped = {};

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

    if (rawProduct.tiktokLink && !item.tiktokLink) {
      item.tiktokLink = rawProduct.tiktokLink;
    }

    if (rawProduct.launchDate && rawProduct.launchDate !== 'N/A') {
      if (item.earliestLaunchDate === 'N/A' || new Date(rawProduct.launchDate) < new Date(item.earliestLaunchDate)) {
        item.earliestLaunchDate = rawProduct.launchDate;
      }
    }
  }

  const finalProducts = Object.values(grouped).map((item) => {
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
    isOfflineMode: true,
    processedAt: new Date().toISOString(),
    totalBpomProducts: finalProducts.length,
    totalRevenue: finalProducts.reduce((sum, p) => sum + p.revenue, 0),
    categories: Array.from(new Set(finalProducts.map((p) => p.category))),
  };

  console.log(`Finished processing. Total BPOM Products: ${payload.totalBpomProducts}`);
  console.log(`Total Revenue: Rp ${payload.totalRevenue.toLocaleString('id-ID')}`);

  // Find the Demo Project (id: 5d69827e-b063-4ff9-a55f-db2c00ce91a6)
  const project = await prisma.project.findFirst({
    where: { id: '5d69827e-b063-4ff9-a55f-db2c00ce91a6' }
  });

  if (!project) {
    console.error('Demo project not found in database!');
    return;
  }

  console.log(`Updating project state for project: ${project.name}...`);
  await prisma.project.update({
    where: { id: project.id },
    data: {
      phase_1_state: JSON.stringify(payload)
    }
  });

  console.log('Project state updated successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
