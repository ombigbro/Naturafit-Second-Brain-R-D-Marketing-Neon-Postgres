const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const wb = XLSX.utils.book_new();

// Affiliators sheet
const affiliatorsData = [
  ['Affiliator Name', 'Followers', 'Products Promoted', '30-day Revenue (IDR)'],
  ['Ayu Lestari', 150000, 12, 150000000],
  ['Budi Santoso', 85000, 8, 75000000],
  ['Siti Rahma', 240000, 15, 320000000],
  ['Dewi Sartika', 450000, 20, 580000000],
  ['Eko Prasetyo', 62000, 5, 45000000]
];
const wsAffiliators = XLSX.utils.aoa_to_sheet(affiliatorsData);
XLSX.utils.book_append_sheet(wb, wsAffiliators, 'Affiliators');

// Videos sheet
const videosData = [
  ['Video Title', 'Video Link', 'Views', 'Likes', '30-day Revenue (IDR)'],
  ['Review Slimming Tea Herbal Aman BPOM', 'https://www.tiktok.com/@ayu/video/1234567890123456789', 500000, 45000, 95000000],
  ['Rutinitas Pagi Minum Slimming Tea', 'https://www.tiktok.com/@budi/video/2345678901234567890', 250000, 18000, 40000000],
  ['Tips Diet Sehat dan Cepat Alami', 'https://www.tiktok.com/@siti/video/3456789012345678901', 800000, 72000, 180000000],
  ['Slimming Tea Paling Viral di TikTok!', 'https://www.tiktok.com/@dewi/video/4567890123456789012', 1200000, 110000, 290000000],
  ['Unboxing & Review Jujur Detox Tea', 'https://www.tiktok.com/@eko/video/5678901234567890123', 120000, 9500, 15000000]
];
const wsVideos = XLSX.utils.aoa_to_sheet(videosData);
XLSX.utils.book_append_sheet(wb, wsVideos, 'Videos');

// Live Sessions sheet
const liveData = [
  ['Live Title', 'Date', 'Duration (Mins)', 'Peak Viewers', '30-day Revenue (IDR)'],
  ['LIVE JUALAN SLIMMING TEA DISKON 50%', '2026-07-01', 180, 2500, 120000000],
  ['KONSULTASI DIET GRATIS & PROMO MURAH', '2026-07-02', 120, 1500, 60000000],
  ['MINUM DETOX TEA BERSAMA SELEBTIK', '2026-07-03', 240, 4500, 220000000],
  ['PROMO JUMAT BERKAH SLIMMING TEA', '2026-07-04', 150, 1800, 85000000],
  ['DAPATKAN VOUCHER KHUSUS LIVE CHAT', '2026-07-05', 90, 1100, 35000000]
];
const wsLive = XLSX.utils.aoa_to_sheet(liveData);
XLSX.utils.book_append_sheet(wb, wsLive, 'Live Sessions');

const destDir = path.join(__dirname, '../public');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
const destPath = path.join(destDir, 'Competitor_Template.xlsx');
XLSX.writeFile(wb, destPath);
console.log('Competitor template spreadsheet created successfully.');
