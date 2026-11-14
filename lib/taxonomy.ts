// Munshi Mart category taxonomy — SINGLE SOURCE OF TRUTH.
//
// Two levels: a small set of browsable FAMILIES, each with specific SUBCATEGORIES.
// The bot currently stores ONE free-text string in `products.category`. This file
// maps whatever is stored (new subcategory, old 9-item category, or an ad-hoc AI
// label such as "Gaming Monitor" / "50k-100k Pc Build") onto a family + subcategory
// for browsing. No database migration and no backend change is required for the
// website to sort today's live listings correctly.
//
// BACKEND MIRROR (pending, owner will apply later): when the bot adopts this
// taxonomy, SUBCATEGORIES below is the list its prompts should offer. The four
// places that currently hardcode the old 9 categories are:
//   index.js:658   — new-listing AI prompt category enum
//   index.js:757   — edit AI prompt category enum
//   documents/core.js:7  — CATEGORIES array
//   documents/core.js:35 — coerces any unlisted value to "Other"
// Until then the website stays tolerant of both old and new values.

export type Family = {
  slug: string;
  name: string;
  tagline: string;
  symbol: string;
  subcategories: string[];
};

// Ordered for display. Keep names short enough for a tile and a filter chip.
export const FAMILIES: Family[] = [
  {
    slug: "pc-hardware",
    name: "PC & Hardware",
    tagline: "Builds, components and the parts that drive them",
    symbol: "◫",
    subcategories: [
      "Prebuilt PCs",
      "Graphics Cards",
      "Processors",
      "Motherboards",
      "Memory & RAM",
      "Storage & Drives",
      "Power Supplies",
      "Cases & Cooling",
      "Monitors",
    ],
  },
  {
    slug: "computer-accessories",
    name: "Computer Accessories",
    tagline: "Keyboards, mice, audio and desk setup",
    symbol: "⌨",
    subcategories: [
      "Keyboards",
      "Mice & Pointing",
      "Headsets & Audio",
      "Webcams & Capture",
      "Hubs & Docks",
      "Cables & Adapters",
      "Laptop Accessories",
      "Desk Setup",
    ],
  },
  {
    slug: "gaming",
    name: "Gaming",
    tagline: "Consoles, controllers and gear built for play",
    symbol: "⚉",
    subcategories: [
      "Consoles",
      "Controllers & Gamepads",
      "Gaming Headphones",
      "Gaming Keyboards",
      "Gaming Mice",
      "Gaming Chairs",
      "Games & Titles",
      "VR & Simulators",
    ],
  },
  {
    slug: "mobiles",
    name: "Mobiles & Tablets",
    tagline: "Phones, tablets and everything that powers them",
    symbol: "▭",
    subcategories: [
      "Mobile Phones",
      "Tablets",
      "Smart Watches",
      "Chargers & Power Banks",
      "Phone Cases & Covers",
      "Earbuds & Headphones",
      "Screen Protectors",
      "Mobile Spare Parts",
    ],
  },
  {
    slug: "hobby-electronics",
    name: "Hobby & RC Electronics",
    tagline: "Hobby-grade parts for builders and RC pilots",
    symbol: "✇",
    subcategories: [
      "RC Cars & Trucks",
      "Drones & FPV",
      "RC Planes & Helicopters",
      "RC Boats",
      "Brushless Motors",
      "ESC & Speed Controllers",
      "Servos",
      "Transmitters & Receivers",
      "LiPo Batteries & Chargers",
      "RC Spare Parts & Upgrades",
      "Microcontrollers & Dev Boards",
      "Sensors & Modules",
      "Tools & Soldering",
      "3D Printing",
    ],
  },
  {
    slug: "consumer-electronics",
    name: "Consumer Electronics",
    tagline: "Everyday home and personal electronics",
    symbol: "◉",
    subcategories: [
      "Televisions",
      "Home Audio & Speakers",
      "Cameras & Lenses",
      "Printers & Scanners",
      "Networking & Routers",
      "Smart Home",
      "Kitchen Appliances",
      "Home Appliances",
      "Personal Care Devices",
    ],
  },
  {
    slug: "toys",
    name: "Toys & Kids",
    tagline: "Play, learning and collecting",
    symbol: "✿",
    subcategories: [
      "Action Figures & Collectibles",
      "Building Blocks & Models",
      "Board Games & Puzzles",
      "Educational & STEM Toys",
      "Dolls & Soft Toys",
      "Outdoor & Ride-On Toys",
      "Baby & Toddler",
      "Kids Clothing",
    ],
  },
  {
    slug: "fashion",
    name: "Fashion",
    tagline: "Clothing, footwear and accessories",
    symbol: "✦",
    subcategories: [
      "Men's Clothing",
      "Women's Clothing",
      "Footwear",
      "Bags & Luggage",
      "Watches",
      "Jewellery",
      "Eyewear",
      "Unstitched Fabric",
    ],
  },
  {
    slug: "home-living",
    name: "Home & Living",
    tagline: "Furniture, kitchen and everyday home goods",
    symbol: "⌂",
    subcategories: [
      "Furniture",
      "Kitchen & Dining",
      "Bedding & Bath",
      "Decor & Lighting",
      "Storage & Organisation",
      "Garden & Outdoor",
      "Tools & Hardware",
      "Cleaning & Utility",
    ],
  },
  {
    slug: "beauty-health",
    name: "Beauty & Health",
    tagline: "Care, wellness and personal essentials",
    symbol: "◒",
    subcategories: [
      "Skincare",
      "Haircare",
      "Makeup",
      "Fragrances",
      "Supplements & Nutrition",
      "Medical & Health Devices",
      "Grooming",
    ],
  },
  {
    slug: "sports",
    name: "Sports & Outdoors",
    tagline: "Training, cricket, cycling and the outdoors",
    symbol: "⚹",
    subcategories: [
      "Cricket",
      "Football & Team Sports",
      "Fitness & Gym",
      "Cycling",
      "Camping & Hiking",
      "Sportswear",
    ],
  },
  {
    slug: "groceries",
    name: "Groceries & Essentials",
    tagline: "Pantry, household and daily needs",
    symbol: "▤",
    subcategories: [
      "Pantry & Dry Goods",
      "Beverages",
      "Snacks & Confectionery",
      "Household Supplies",
      "Pet Supplies",
    ],
  },
  {
    slug: "books-media",
    name: "Books & Media",
    tagline: "Reading, learning, stationery and instruments",
    symbol: "❏",
    subcategories: [
      "Books",
      "Textbooks & Study",
      "Stationery & Office",
      "Art & Craft Supplies",
      "Musical Instruments",
    ],
  },
  {
    slug: "vehicles",
    name: "Vehicles & Parts",
    tagline: "Car, bike and workshop essentials",
    symbol: "⊙",
    subcategories: [
      "Car Accessories",
      "Car Parts",
      "Bike Accessories",
      "Bike Parts",
      "Car Electronics & Audio",
      "Oils & Fluids",
    ],
  },
  {
    slug: "other",
    name: "Other",
    tagline: "Everything that does not fit a shelf yet",
    symbol: "✳",
    subcategories: ["Other"],
  },
];

export const OTHER_FAMILY = FAMILIES[FAMILIES.length - 1];

/** Every subcategory, flat. This is the list the bot's prompts should offer. */
export const SUBCATEGORIES: string[] = FAMILIES.flatMap((f) => f.subcategories);

const familyBySlug = new Map(FAMILIES.map((f) => [f.slug, f]));
export const familyFromSlug = (slug: string): Family | null =>
  familyBySlug.get(slug.trim().toLowerCase()) || null;

// Singularise each word so stored "Electronics"/"Toys"/"Mobiles" match the
// singular keywords below. Deliberately conservative: only trailing "s"/"es"
// on words long enough that removing it cannot destroy a real token.
const singular = (word: string) => {
  if (word.length > 4 && word.endsWith("ies"))
    return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(ch|sh|ss|x|z)es$/.test(word))
    return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss"))
    return word.slice(0, -1);
  return word;
};

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[&/,_–—-]+/g, " ")
    .replace(/[^a-z0-9+ ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(singular)
    .join(" ")
    .trim();

// Exact lookup: a stored value that already equals a family or subcategory name.
const exact = new Map<string, { family: Family; subcategory: string }>();
for (const family of FAMILIES) {
  for (const subcategory of family.subcategories)
    exact.set(normalise(subcategory), { family, subcategory });
}

// Legacy and ad-hoc labels observed in live data or produced by the old 9-item
// list. Longest match wins, so "gaming monitor" beats a bare "monitor".
// Keyword → [family slug, subcategory]. Add new observed labels here.
const KEYWORDS: [string, string, string][] = [
  // --- observed live AI labels -------------------------------------------
  ["gaming monitor", "pc-hardware", "Monitors"],
  ["pc build", "pc-hardware", "Prebuilt PCs"],
  ["gaming pc", "pc-hardware", "Prebuilt PCs"],
  ["gaming controller", "gaming", "Controllers & Gamepads"],
  ["gaming headphone", "gaming", "Gaming Headphones"],
  ["gaming headset", "gaming", "Gaming Headphones"],
  ["mechanical keyboard", "computer-accessories", "Keyboards"],
  ["gaming keyboard", "gaming", "Gaming Keyboards"],
  ["gaming mouse", "gaming", "Gaming Mice"],
  ["gaming chair", "gaming", "Gaming Chairs"],
  // --- PC & hardware ------------------------------------------------------
  ["graphics card", "pc-hardware", "Graphics Cards"],
  ["gpu", "pc-hardware", "Graphics Cards"],
  ["geforce", "pc-hardware", "Graphics Cards"],
  ["radeon", "pc-hardware", "Graphics Cards"],
  ["rtx", "pc-hardware", "Graphics Cards"],
  ["gtx", "pc-hardware", "Graphics Cards"],
  ["pc case", "pc-hardware", "Cases & Cooling"],
  ["gaming pc case", "pc-hardware", "Cases & Cooling"],
  ["mid tower", "pc-hardware", "Cases & Cooling"],
  ["atx mid tower", "pc-hardware", "Cases & Cooling"],
  ["case fan", "pc-hardware", "Cases & Cooling"],
  ["argb fan", "pc-hardware", "Cases & Cooling"],
  ["argb", "pc-hardware", "Cases & Cooling"],
  ["cooling fan", "pc-hardware", "Cases & Cooling"],
  ["pwm", "pc-hardware", "Cases & Cooling"],
  ["cpu cooler", "pc-hardware", "Cases & Cooling"],
  ["aio cooler", "pc-hardware", "Cases & Cooling"],
  ["gaming mouse", "gaming", "Gaming Mice"],
  ["gaming pc build", "pc-hardware", "Prebuilt PCs"],
  ["racing wheel", "gaming", "VR & Simulators"],
  ["handbrake", "gaming", "VR & Simulators"],
  ["hand bag", "fashion", "Bags & Luggage"],
  ["handbag", "fashion", "Bags & Luggage"],
  ["file bag", "fashion", "Bags & Luggage"],
  ["gpu", "pc-hardware", "Graphics Cards"],
  ["processor", "pc-hardware", "Processors"],
  ["cpu", "pc-hardware", "Processors"],
  ["motherboard", "pc-hardware", "Motherboards"],
  ["ram", "pc-hardware", "Memory & RAM"],
  ["ssd", "pc-hardware", "Storage & Drives"],
  ["hard disk", "pc-hardware", "Storage & Drives"],
  ["power supply", "pc-hardware", "Power Supplies"],
  ["psu", "pc-hardware", "Power Supplies"],
  ["monitor", "pc-hardware", "Monitors"],
  ["prebuilt", "pc-hardware", "Prebuilt PCs"],
  // --- computer accessories ----------------------------------------------
  ["keyboard", "computer-accessories", "Keyboards"],
  ["mouse", "computer-accessories", "Mice & Pointing"],
  ["webcam", "computer-accessories", "Webcams & Capture"],
  ["laptop", "computer-accessories", "Laptop Accessories"],
  ["cable", "computer-accessories", "Cables & Adapters"],
  ["adapter", "computer-accessories", "Cables & Adapters"],
  // --- gaming -------------------------------------------------------------
  ["console", "gaming", "Consoles"],
  ["playstation", "gaming", "Consoles"],
  ["xbox", "gaming", "Consoles"],
  ["controller", "gaming", "Controllers & Gamepads"],
  ["gamepad", "gaming", "Controllers & Gamepads"],
  ["gaming", "gaming", "Games & Titles"],
  // --- mobiles ------------------------------------------------------------
  ["mobile phone", "mobiles", "Mobile Phones"],
  ["smartphone", "mobiles", "Mobile Phones"],
  ["mobile", "mobiles", "Mobile Phones"],
  ["tablet", "mobiles", "Tablets"],
  ["smart watch", "mobiles", "Smart Watches"],
  ["smartwatch", "mobiles", "Smart Watches"],
  ["power bank", "mobiles", "Chargers & Power Banks"],
  ["charger", "mobiles", "Chargers & Power Banks"],
  ["phone case", "mobiles", "Phone Cases & Covers"],
  ["earbud", "mobiles", "Earbuds & Headphones"],
  ["airpod", "mobiles", "Earbuds & Headphones"],
  // --- hobby / RC ---------------------------------------------------------
  ["brushless motor", "hobby-electronics", "Brushless Motors"],
  ["brushed motor", "hobby-electronics", "Brushless Motors"],
  ["esc", "hobby-electronics", "ESC & Speed Controllers"],
  ["speed controller", "hobby-electronics", "ESC & Speed Controllers"],
  ["servo", "hobby-electronics", "Servos"],
  ["lipo", "hobby-electronics", "LiPo Batteries & Chargers"],
  ["lipo battery", "hobby-electronics", "LiPo Batteries & Chargers"],
  ["transmitter", "hobby-electronics", "Transmitters & Receivers"],
  ["receiver", "hobby-electronics", "Transmitters & Receivers"],
  ["drone", "hobby-electronics", "Drones & FPV"],
  ["fpv", "hobby-electronics", "Drones & FPV"],
  ["quadcopter", "hobby-electronics", "Drones & FPV"],
  ["rc car", "hobby-electronics", "RC Cars & Trucks"],
  ["rc truck", "hobby-electronics", "RC Cars & Trucks"],
  ["rc plane", "hobby-electronics", "RC Planes & Helicopters"],
  ["rc heli", "hobby-electronics", "RC Planes & Helicopters"],
  ["rc boat", "hobby-electronics", "RC Boats"],
  ["rc", "hobby-electronics", "RC Spare Parts & Upgrades"],
  ["arduino", "hobby-electronics", "Microcontrollers & Dev Boards"],
  ["raspberry pi", "hobby-electronics", "Microcontrollers & Dev Boards"],
  ["microcontroller", "hobby-electronics", "Microcontrollers & Dev Boards"],
  ["sensor", "hobby-electronics", "Sensors & Modules"],
  ["soldering", "hobby-electronics", "Tools & Soldering"],
  ["3d print", "hobby-electronics", "3D Printing"],
  ["propeller", "hobby-electronics", "RC Spare Parts & Upgrades"],
  ["flight controller", "hobby-electronics", "Microcontrollers & Dev Boards"],
  ["gps", "hobby-electronics", "Sensors & Modules"],
  ["compass", "hobby-electronics", "Sensors & Modules"],
  ["gyro", "hobby-electronics", "Sensors & Modules"],
  ["elrs", "hobby-electronics", "Transmitters & Receivers"],
  ["gimbal", "hobby-electronics", "Drones & FPV"],
  ["hobby", "hobby-electronics", "RC Spare Parts & Upgrades"],
  // --- consumer electronics ----------------------------------------------
  ["television", "consumer-electronics", "Televisions"],
  ["tv", "consumer-electronics", "Televisions"],
  ["speaker", "consumer-electronics", "Home Audio & Speakers"],
  ["camera", "consumer-electronics", "Cameras & Lenses"],
  ["printer", "consumer-electronics", "Printers & Scanners"],
  ["router", "consumer-electronics", "Networking & Routers"],
  ["networking", "consumer-electronics", "Networking & Routers"],
  ["smart home", "consumer-electronics", "Smart Home"],
  ["appliance", "consumer-electronics", "Home Appliances"],
  ["headphone", "consumer-electronics", "Home Audio & Speakers"],
  // --- other families -----------------------------------------------------
  ["toy", "toys", "Action Figures & Collectibles"],
  ["lego", "toys", "Building Blocks & Models"],
  ["board game", "toys", "Board Games & Puzzles"],
  ["puzzle", "toys", "Board Games & Puzzles"],
  ["baby", "toys", "Baby & Toddler"],
  ["fashion", "fashion", "Men's Clothing"],
  ["clothing", "fashion", "Men's Clothing"],
  ["shoe", "fashion", "Footwear"],
  ["watch", "fashion", "Watches"],
  ["earring", "fashion", "Jewellery"],
  ["braslet", "fashion", "Jewellery"],
  ["bracelet", "fashion", "Jewellery"],
  ["necklace", "fashion", "Jewellery"],
  ["ring", "fashion", "Jewellery"],
  ["jewellery", "fashion", "Jewellery"],
  ["jewelry", "fashion", "Jewellery"],
  ["kara", "fashion", "Jewellery"],
  ["home living", "home-living", "Decor & Lighting"],
  ["furniture", "home-living", "Furniture"],
  ["kitchen", "home-living", "Kitchen & Dining"],
  ["beauty", "beauty-health", "Skincare"],
  ["skincare", "beauty-health", "Skincare"],
  ["makeup", "beauty-health", "Makeup"],
  ["health", "beauty-health", "Medical & Health Devices"],
  ["sport", "sports", "Fitness & Gym"],
  ["cricket", "sports", "Cricket"],
  ["gym", "sports", "Fitness & Gym"],
  ["fitness", "sports", "Fitness & Gym"],
  ["grocery", "groceries", "Pantry & Dry Goods"],
  ["groceries", "groceries", "Pantry & Dry Goods"],
  ["beverage", "groceries", "Beverages"],
  ["pet", "groceries", "Pet Supplies"],
  ["book", "books-media", "Books"],
  ["stationery", "books-media", "Stationery & Office"],
  ["instrument", "books-media", "Musical Instruments"],
  ["car", "vehicles", "Car Accessories"],
  ["bike", "vehicles", "Bike Accessories"],
  ["vehicle", "vehicles", "Car Accessories"],
  // Deliberately last: the old catch-all "Electronics" is too broad to be a
  // family on its own, so it lands in Consumer Electronics unless a more
  // specific keyword above already matched.
  ["electronic", "consumer-electronics", "Home Appliances"],
];

// Keywords that are real words but far too generic to decide a product on
// their own. They only win when nothing more specific is present, because
// seller titles are long and full of marketing text ("... Gaming Store",
// "Best Price in Pakistan", a store name like "Daddu Charger").
const WEAK = new Set([
  "gaming",
  "electronic",
  "charger",
  "car",
  "bike",
  "watch",
  "camera",
  "sensor",
  "cable",
  "adapter",
  "speaker",
  "tv",
  "book",
  "pet",
  "toy",
  "hobby",
  "rc",
  "sport",
  "health",
  "appliance",
  "furniture",
  "kitchen",
  "clothing",
  "instrument",
  "vehicle",
  "console",
  "monitor",
  "mobile",
  "tablet",
  "laptop",
  "mouse",
  "keyboard",
  "headphone",
  "propeller",
  "servo",
  "esc",
  "gps",
  "compass",
  "gyro",
]);

// Whole-word presence test against an already-normalised string.
const hasWord = (haystack: string, word: string) =>
  haystack === word ||
  haystack.startsWith(`${word} `) ||
  haystack.endsWith(` ${word}`) ||
  haystack.includes(` ${word} `);

/**
 * Pick the most specific keyword present. Scoring, strongest first:
 *   1. multi-word keywords ("graphics card") over single words
 *   2. longer keywords over shorter
 *   3. specific keywords over the WEAK catch-alls above
 * This matters because a seller title often contains several keywords at once
 * ("ZOTAC GAMING ... Graphics Card ... Daddu Charger Gaming Store"), and the
 * most specific one describes the actual product.
 */
// Keywords are matched against already-normalised text, so they must be
// normalised the same way. Without this a keyword like "graphics card" could
// never match, because normalise() singularises the input to "graphic card".
const NORMALISED_KEYWORDS: [string, string, string, number][] = KEYWORDS.map(
  (entry) => {
    const term = normalise(entry[0]);
    const words = term.split(" ").length;
    return [
      term,
      entry[1],
      entry[2],
      words * 1000 + term.length * 10 + (WEAK.has(entry[0]) ? 0 : 5),
    ];
  },
);

function bestKeyword(key: string): [string, string, string] | null {
  let best: [string, string, string] | null = null;
  let bestScore = -1;
  for (const [term, slug, subcategory, score] of NORMALISED_KEYWORDS) {
    if (score <= bestScore) continue;
    if (!hasWord(key, term)) continue;
    bestScore = score;
    best = [term, slug, subcategory];
  }
  return best;
}

export type Placement = {
  family: Family;
  /** Best-effort specific label. Falls back to the raw stored text. */
  subcategory: string;
  /** True when the stored value matched a known subcategory or keyword. */
  matched: boolean;
};

const cache = new Map<string, Placement>();

/**
 * Place a stored `products.category` string into the taxonomy.
 * Never throws and never returns null: unknown values land in Other so a
 * listing is always reachable by browsing.
 */
export function placeCategory(value: unknown): Placement {
  const raw = typeof value === "string" ? value.trim() : "";
  const key = normalise(raw);
  if (!key) return { family: OTHER_FAMILY, subcategory: "Other", matched: false };
  const hit = cache.get(key);
  if (hit) return hit;

  let placement: Placement;
  const direct = exact.get(key);
  if (direct) {
    placement = { ...direct, matched: true };
  } else {
    const family = FAMILIES.find((f) => normalise(f.name) === key);
    if (family) {
      placement = { family, subcategory: family.subcategories[0], matched: true };
    } else {
      const keyword = bestKeyword(key);
      const slug = keyword ? keyword[1] : null;
      placement = slug
        ? {
            family: familyBySlug.get(slug) || OTHER_FAMILY,
            subcategory: keyword![2],
            matched: true,
          }
        : { family: OTHER_FAMILY, subcategory: raw, matched: false };
    }
  }
  cache.set(key, placement);
  return placement;
}

export const familyOf = (value: unknown): Family => placeCategory(value).family;

// Stored categories that are too broad to place a product on their own. The bot's
// old prompt offered only "Electronics", so hobby/RC/PC parts all landed there.
// For these we also read the product NAME, which carries the real signal
// ("320A Brushed ESC", "Gaming Monitor 24inch"). A specific stored category is
// always trusted over the name.
const VAGUE = new Set(["electronic", "other", "miscellaneou", "misc", "general"]);

/**
 * Place a product using its category, refining with its name only when the
 * stored category is a vague catch-all. Prefer this over `placeCategory` for
 * real listings; `placeCategory` stays available for a bare label.
 */
export function placeProduct(product: {
  category?: unknown;
  product_name?: unknown;
}): Placement {
  const byCategory = placeCategory(product.category);
  const raw = typeof product.category === "string" ? product.category : "";
  const broad = !byCategory.matched || VAGUE.has(normalise(raw));
  if (!broad) return byCategory;
  const byName = placeCategory(product.product_name);
  if (byName.matched) return byName;
  return byCategory;
}

/** Count listings per family, for tiles and the store directory. */
export function familyCounts<T extends { category: string; product_name?: unknown }>(
  products: T[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const product of products) {
    const slug = placeProduct(product).family.slug;
    counts.set(slug, (counts.get(slug) || 0) + 1);
  }
  return counts;
}

/** Subcategory labels actually present, for a family's filter chips. */
export function presentSubcategories<
  T extends { category: string; product_name?: unknown },
>(products: T[], slug: string): string[] {
  const found = new Set<string>();
  for (const product of products) {
    const placement = placeProduct(product);
    if (placement.family.slug === slug) found.add(placement.subcategory);
  }
  const family = familyBySlug.get(slug);
  const ordered = family
    ? family.subcategories.filter((s) => found.has(s))
    : [];
  const extras = [...found]
    .filter((s) => !ordered.includes(s))
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
}
