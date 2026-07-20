/**
 * CoXoF Ai Studio — SKU Generator
 * Produces product-name-based SKU codes for e-commerce
 */

export function generateSku(productName) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const name = (productName || '').trim();
  if (name) {
    const cleaned = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const prefix = cleaned.substring(0, 6).toUpperCase();
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      hash = ((hash << 5) - hash + cleaned.charCodeAt(i)) | 0;
    }
    const suffix = Math.abs(hash % 1000).toString().padStart(3, '0');
    return `${prefix}-${stamp}-${suffix}`;
  }
  return `VEDA-${stamp}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

/**
 * Product archive (EC platform info) — save/restore helpers
 */
export function createEcommerceInfo({
  platform = 'amazon', storeName = '', category = '', salesType = 'single',
  listingId = '', price = '', currency = 'USD', tags = '', description = '',
  brand = '', manufacturer = '', gtin = '', bullet1 = '', bullet2 = '', bullet3 = '', compliance = ''
} = {}) {
  return { platform, storeName, category, salesType, listingId, price, currency, tags, description,
    brand, manufacturer, gtin, bullet1, bullet2, bullet3, compliance };
}

export const EC_PLATFORMS = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'temu', label: 'Temu' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'shein', label: 'SHEIN' },
  { value: 'aliexpress', label: 'AliExpress' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'ebay', label: 'eBay' },
  { value: 'walmart', label: 'Walmart' },
  { value: 'etsy', label: 'Etsy' },
];

export const EC_CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY'];
