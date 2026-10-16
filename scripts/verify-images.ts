import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { SEED_ITEMS } from '../src/lib/seed-data';

interface VerificationResult {
  itemName: string;
  slug: string;
  primaryExists: boolean;
  width: number;
  height: number;
  format: string;
  sizeKb: number;
  altTextNonEmpty: boolean;
  variantsExist: boolean;
  status: 'PASS' | 'FAIL';
  failureReason?: string;
}

async function verifyImages() {
  console.log('\n========================================================================================');
  console.log('CROWN HOTELS — MENU ITEM IMAGE VERIFICATION AUDIT');
  console.log('Testing 100% of Seeded Items: Existence, WebP format, >=1200w, <150KB, Alt Text');
  console.log('========================================================================================\n');

  const results: VerificationResult[] = [];
  let passCount = 0;
  let failCount = 0;

  for (const item of SEED_ITEMS) {
    const slug = item.images?.[0]?.storage_path.replace('/images/menu/', '').replace('.webp', '') || 'dish';
    const primaryPath = path.resolve('public', 'images', 'menu', `${slug}.webp`);
    const var400Path = path.resolve('public', 'images', 'menu', 'variants', `${slug}-400w.webp`);
    const var800Path = path.resolve('public', 'images', 'menu', 'variants', `${slug}-800w.webp`);

    let primaryExists = fs.existsSync(primaryPath);
    let var400Exists = fs.existsSync(var400Path);
    let var800Exists = fs.existsSync(var800Path);

    let width = 0;
    let height = 0;
    let format = 'unknown';
    let sizeKb = 0;
    let altTextNonEmpty = Boolean(item.images?.[0]?.alt_text && item.images[0].alt_text.trim().length > 0);
    let status: 'PASS' | 'FAIL' = 'PASS';
    let failureReason = '';

    if (!primaryExists) {
      status = 'FAIL';
      failureReason = 'Primary file missing';
    } else {
      const stats = fs.statSync(primaryPath);
      sizeKb = Math.round((stats.size / 1024) * 10) / 10;

      try {
        const metadata = await sharp(primaryPath).metadata();
        width = metadata.width || 0;
        height = metadata.height || 0;
        format = metadata.format || 'unknown';

        if (format !== 'webp') {
          status = 'FAIL';
          failureReason = `Expected WebP, got ${format}`;
        } else if (width < 1200) {
          status = 'FAIL';
          failureReason = `Width ${width}px < 1200px`;
        } else if (sizeKb > 150) {
          status = 'FAIL';
          failureReason = `Size ${sizeKb}KB > 150KB`;
        } else if (!altTextNonEmpty) {
          status = 'FAIL';
          failureReason = 'Alt text empty';
        } else if (!var400Exists || !var800Exists) {
          status = 'FAIL';
          failureReason = 'Responsive variants missing';
        }
      } catch (err: any) {
        status = 'FAIL';
        failureReason = 'Sharp metadata error: ' + err.message;
      }
    }

    if (status === 'PASS') {
      passCount++;
    } else {
      failCount++;
    }

    results.push({
      itemName: item.name_en,
      slug,
      primaryExists,
      width,
      height,
      format,
      sizeKb,
      altTextNonEmpty,
      variantsExist: var400Exists && var800Exists,
      status,
      failureReason,
    });
  }

  // Print Table
  console.log('| #  | Menu Item                              | Format | Dimensions | Size (KB) | Alt Text | Variants | Status |');
  console.log('|----|----------------------------------------|--------|------------|-----------|----------|----------|--------|');
  results.forEach((r, idx) => {
    const num = (idx + 1).toString().padEnd(2);
    const name = r.itemName.substring(0, 38).padEnd(38);
    const fmt = r.format.padEnd(6);
    const dims = `${r.width}x${r.height}`.padEnd(10);
    const size = `${r.sizeKb} KB`.padEnd(9);
    const alt = (r.altTextNonEmpty ? 'YES' : 'NO').padEnd(8);
    const vars = (r.variantsExist ? 'YES' : 'NO').padEnd(8);
    const st = r.status.padEnd(6);
    console.log(`| ${num} | ${name} | ${fmt} | ${dims} | ${size} | ${alt} | ${vars} | ${st} |`);
  });

  console.log('\n========================================================================================');
  console.log(`SUMMARY: Total Items: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}`);
  console.log('========================================================================================\n');

  if (failCount > 0) {
    console.error(`VERIFICATION FAILED with ${failCount} errors.`);
    process.exit(1);
  } else {
    console.log('VERIFICATION SUCCESS: 100% of items have verified WebP images meeting all requirements.');
  }
}

verifyImages().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
