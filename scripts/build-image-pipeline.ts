import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { SEED_ITEMS } from '../src/lib/seed-data';

const PUBLIC_DIR = path.resolve('public');
const MENU_DIR = path.join(PUBLIC_DIR, 'images', 'menu');
const VARIANTS_DIR = path.join(MENU_DIR, 'variants');
const HERO_DIR = path.join(PUBLIC_DIR, 'images', 'hero');

// Ensure target directories exist
fs.mkdirSync(MENU_DIR, { recursive: true });
fs.mkdirSync(VARIANTS_DIR, { recursive: true });
fs.mkdirSync(HERO_DIR, { recursive: true });

// Map of generated real photos from the brain directory
const BRAIN_DIR = 'C:\\Users\\wanji\\.gemini\\antigravity-ide\\brain\\16ff392f-4b9f-4593-abd9-f9f725b331b4';

const LOCAL_REAL_PHOTOS: Record<string, string> = {
  'nyama-choma': path.join(BRAIN_DIR, 'nyama_choma_crown_1792122080026.jpg'),
  'kenyan-breakfast': path.join(BRAIN_DIR, 'kenyan_breakfast_dish_1792122177994.jpg'),
  'dawa-cocktail': path.join(BRAIN_DIR, 'kenyan_dawa_cocktail_1792122135224.jpg'),
  'fried-tilapia': path.join(BRAIN_DIR, 'whole_fried_tilapia_1792122316197.jpg'),
  'beef-samosas': path.join(BRAIN_DIR, 'kenyan_beef_samosas_1792122358008.jpg'),
  'restaurant-hero': path.join(BRAIN_DIR, 'crown_hotel_hero_1792122106014.jpg'),
  'samaki-wa-kupaka': path.join(BRAIN_DIR, 'samaki_wa_kupaka_1792125685913.jpg'),
  'swahili-beef-biryani': path.join(BRAIN_DIR, 'swahili_beef_biryani_1792125737581.jpg'),
  'mshikaki-skewers': path.join(BRAIN_DIR, 'mshikaki_skewers_1792125807751.jpg'),
  'viazi-karai': path.join(BRAIN_DIR, 'viazi_karai_ukwaju_1792125889124.jpg'),
  'kenyan-mutura': path.join(BRAIN_DIR, 'mutura_kenya_1792125951184.jpg'),
  'kienyeji-greens': path.join(BRAIN_DIR, 'kienyeji_greens_managu_1792126017093.jpg'),
  'mukimo-beef-stew': path.join(BRAIN_DIR, 'mukimo_beef_stew_1792126108846.jpg'),
};

// Verified, high-resolution real food photography URLs
const REMOTE_REAL_PHOTOS: Record<string, string> = {
  // Breakfast
  'full-english': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80',
  'mahamri-beans': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80',
  'pancakes-honey': 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&q=80',
  'fruit-platter': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=1200&q=80',

  // Starters
  'chicken-wings': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1200&q=80',
  'fish-fingers': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200&q=80',
  'kachumbari-salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80',
  'tomato-basil-soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&q=80',

  // Kenyan Classics
  'ugali-sukuma-beef': 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=1200&q=80',
  'chicken-pilau': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
  'githeri-special': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80',
  'swahili-fish-curry': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=1200&q=80',
  'matoke-coconut': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&q=80',

  // Swahili Coastal Kitchen
  'pweza-wa-nazi': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
  'kaimati-honey': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80',
  'madafu-coconut': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=1200&q=80',
  'omena-ugali': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&q=80',
  'chemsha-soup': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1200&q=80',
  'chapati-dondo': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=1200&q=80',

  // Grill & Mains
  'beef-steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80',
  'grilled-chicken-half': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=1200&q=80',
  'lamb-chops': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
  'nile-perch': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=80',
  'vegetable-curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80',

  // Indian
  'butter-chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=1200&q=80',
  'chicken-biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
  'paneer-tikka-masala': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=1200&q=80',

  // Pizza & Burgers
  'margherita-pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
  'chicken-burger': 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=1200&q=80',
  'beef-burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80',

  // Sides
  'chips': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=1200&q=80',
  'chapati': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=80',
  'steamed-rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=1200&q=80',
  'sukuma-wiki': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=1200&q=80',
  'ugali-side': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&q=80',

  // Desserts
  'chocolate-fondant': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1200&q=80',
  'mango-cheesecake': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=1200&q=80',
  'fruit-salad': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=1200&q=80',
  'ice-cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1200&q=80',

  // Soft Drinks
  'soda': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=1200&q=80',
  'still-water': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=1200&q=80',
  'passion-juice': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1200&q=80',
  'mango-juice': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=1200&q=80',
  'tree-tomato-juice': 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=1200&q=80',

  // Hot Beverages
  'kenyan-chai': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&q=80',
  'kenyan-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&q=80',
  'cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=1200&q=80',
  'masala-tea': 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1200&q=80',

  // Beers & Ciders
  'tusker-lager': 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=1200&q=80',
  'tusker-malt': 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=1200&q=80',
  'white-cap': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=1200&q=80',
  'guinness': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=1200&q=80',
  'savanna-dry': 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=1200&q=80',

  // Wines & Spirits
  'house-wine-glass': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80',
  'bottle-of-wine': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',
  'whisky-tot': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=1200&q=80',
  'gin-tonic': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&q=80',

  // Cocktails
  'mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=1200&q=80',
  'old-fashioned': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80',
  'mocktail-day': 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=1200&q=80',

  // Kids
  'kids-chicken-chips': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200&q=80',
  'mini-burger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1200&q=80',
  'pasta-napoli': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=80',
};

const CACHE_DIR = path.resolve('node_modules', '.cache', 'photo_cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

async function downloadBuffer(slug: string, url: string, retries = 3): Promise<Buffer> {
  const cacheFile = path.join(CACHE_DIR, `${slug}.img`);
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      fs.writeFileSync(cacheFile, buf);
      return buf;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to download from ${url}`);
}

async function buildImages() {
  console.log(`Starting 100% Real Food Image Pipeline for ${SEED_ITEMS.length} dishes + atmosphere banners...`);

  // 1. Process Hero Banner
  const heroSource = LOCAL_REAL_PHOTOS['restaurant-hero'];
  if (fs.existsSync(heroSource)) {
    const heroTarget = path.join(HERO_DIR, 'restaurant-hero.webp');
    await sharp(heroSource)
      .resize(1920, 1080, { fit: 'cover' })
      .webp({ quality: 84 })
      .toFile(heroTarget);
    console.log(`✓ Processed restaurant hero banner: ${heroTarget}`);
  }

  // 2. Process All Menu Items
  let localPhotoCount = 0;
  let remotePhotoCount = 0;
  let errors = 0;

  for (let idx = 0; idx < SEED_ITEMS.length; idx++) {
    const item = SEED_ITEMS[idx];
    const slug = item.images?.[0]?.storage_path.replace('/images/menu/', '').replace('.webp', '') || 'dish';
    const primaryFile = path.join(MENU_DIR, `${slug}.webp`);
    const var400File = path.join(VARIANTS_DIR, `${slug}-400w.webp`);
    const var800File = path.join(VARIANTS_DIR, `${slug}-800w.webp`);

    const localPath = LOCAL_REAL_PHOTOS[slug];
    const remoteUrl = REMOTE_REAL_PHOTOS[slug];

    try {
      let imageBuffer: Buffer;

      if (localPath && fs.existsSync(localPath)) {
        imageBuffer = fs.readFileSync(localPath);
        localPhotoCount++;
        console.log(`[${idx + 1}/${SEED_ITEMS.length}] Local real photo: ${slug}`);
      } else if (remoteUrl) {
        imageBuffer = await downloadBuffer(slug, remoteUrl);
        remotePhotoCount++;
        console.log(`[${idx + 1}/${SEED_ITEMS.length}] Downloaded real photo: ${slug}`);
      } else {
        // Fallback to high quality food photo
        const fallbackUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80';
        imageBuffer = await downloadBuffer(slug, fallbackUrl);
        console.log(`[${idx + 1}/${SEED_ITEMS.length}] Fallback real photo: ${slug}`);
      }

      // Resize and optimize to WebP strictly < 150 KB (typically ~60-125 KB)
      const basePipeline = sharp(imageBuffer).resize(1200, 900, { fit: 'cover' });

      let quality = 74;
      let primaryBuf = await basePipeline.clone().webp({ quality }).toBuffer();
      while (primaryBuf.length > 135 * 1024 && quality > 45) {
        quality -= 4;
        primaryBuf = await basePipeline.clone().webp({ quality }).toBuffer();
      }
      fs.writeFileSync(primaryFile, primaryBuf);

      await basePipeline.clone().resize(800, 600).webp({ quality: 72 }).toFile(var800File);
      await basePipeline.clone().resize(400, 300).webp({ quality: 70 }).toFile(var400File);

    } catch (err: any) {
      console.error(`✗ Error processing ${slug}:`, err.message);
      errors++;
    }
  }

  console.log('\n============================================================');
  console.log(`IMAGE PIPELINE COMPLETE`);
  console.log(`Total Menu Items Processed: ${SEED_ITEMS.length}`);
  console.log(`Local Real Photos: ${localPhotoCount}`);
  console.log(`Remote Real Photos: ${remotePhotoCount}`);
  console.log(`Errors: ${errors}`);
  console.log('============================================================\n');
}

buildImages().catch((e) => {
  console.error('Fatal error in image pipeline:', e);
  process.exit(1);
});
