/**
 * Single source of truth. Every scene, colour, shader uniform and price comes from here.
 * Swapping `bottle`/`fruitAssets`/`liquidAssets` from null to a real path upgrades the art
 * with no code change — see ASSET_REQUIREMENTS.md.
 */

export type RGB = [number, number, number];

/** Palette a flavour world is built from. All liquid shading derives from these four. */
export type FlavorPalette = {
  /** Deep body of the liquid — what you see in the troughs. */
  deep: RGB;
  /** Lit surface — what you see on the crests. */
  surface: RGB;
  /** Cream/foam highlight. Never pure white — shake foam is tinted. */
  foam: RGB;
  /** Atmosphere behind the world. */
  sky: RGB;
};

export type Flavor = {
  id: string;
  index: string;
  name: string;
  /** CSS accent, derived from `palette.surface` but hand-tuned for type. */
  color: string;
  secondaryColor: string;
  palette: FlavorPalette;
  /** Viscosity 0..1 — chocolate is heaviest, drives wave speed + settle per world. */
  thickness: number;
  mood: string;
  headline: [string, string, string];
  description: string;
  ingredients: string[];
  price: number;
  /** PLACEHOLDER ART — null renders the procedural SVG bottle. */
  bottle: string | null;
  fruitAssets: string[];
  liquidAssets: { splash: string | null; pour: string | null; wave: string | null };
};

export const flavors: Flavor[] = [
  {
    id: "mango",
    index: "01",
    name: "Mango",
    color: "#ffb02e",
    secondaryColor: "#ff7a18",
    palette: {
      deep: [0.40, 0.13, 0.01],
      surface: [1.0, 0.60, 0.10],
      foam: [1.0, 0.86, 0.56],
      sky: [1.0, 0.72, 0.34],
    },
    thickness: 0.62,
    mood: "Sun. Tropical. Juicy.",
    headline: ["NOT JUST", "MANGO.", "MANGO TURNED UP."],
    description: "Ripe alphonso, whole milk, a little cream, no water. Blended cold and thick enough to hold a spoon.",
    ingredients: ["Alphonso mango", "Whole milk", "Cream", "Ice"],
    price: 480,
    bottle: null,
    fruitAssets: [],
    liquidAssets: { splash: null, pour: null, wave: null },
  },
  {
    id: "strawberry",
    index: "02",
    name: "Strawberry",
    color: "#ff5d7e",
    secondaryColor: "#c9214a",
    palette: {
      deep: [0.42, 0.05, 0.13],
      surface: [1.0, 0.42, 0.55],
      foam: [1.0, 0.85, 0.85],
      sky: [1.0, 0.68, 0.74],
    },
    thickness: 0.58,
    mood: "Soft. Romantic. Creamy.",
    headline: ["SWEET", "ON", "IMPACT."],
    description: "Field strawberries folded into cream until the colour goes soft pink and stays there.",
    ingredients: ["Strawberries", "Cream", "Milk", "Vanilla"],
    price: 480,
    bottle: null,
    fruitAssets: [],
    liquidAssets: { splash: null, pour: null, wave: null },
  },
  {
    id: "chocolate",
    index: "03",
    name: "Chocolate",
    color: "#b97c4b",
    secondaryColor: "#4a2414",
    palette: {
      deep: [0.14, 0.06, 0.03],
      surface: [0.55, 0.31, 0.16],
      foam: [0.88, 0.72, 0.55],
      sky: [0.3, 0.17, 0.1],
    },
    thickness: 0.95,
    mood: "Dark. Rich. Heavy.",
    headline: ["GO", "DARKER.", ""],
    description: "Dark cocoa and milk chocolate, both. Heavy, glossy, and slower than everything else on this page.",
    ingredients: ["Dark cocoa", "Milk chocolate", "Milk", "Cream"],
    price: 520,
    bottle: null,
    fruitAssets: [],
    liquidAssets: { splash: null, pour: null, wave: null },
  },
  {
    id: "pistachio",
    index: "04",
    name: "Pistachio",
    color: "#a8bd7a",
    secondaryColor: "#4f6336",
    palette: {
      deep: [0.16, 0.22, 0.1],
      surface: [0.66, 0.76, 0.47],
      foam: [0.94, 0.93, 0.8],
      sky: [0.76, 0.8, 0.6],
    },
    thickness: 0.72,
    mood: "Refined. Creamy. Unexpected.",
    headline: ["THE QUIET", "ONE", "WINS."],
    description: "Slow-roasted pistachio ground to a paste, not a syrup. Pale green because that is its real colour.",
    ingredients: ["Pistachio paste", "Milk", "Cream", "Sea salt"],
    price: 560,
    bottle: null,
    fruitAssets: [],
    liquidAssets: { splash: null, pour: null, wave: null },
  },
  {
    id: "oreo",
    index: "05",
    name: "Cookies & Cream",
    color: "#d9d4cc",
    secondaryColor: "#2b2724",
    palette: {
      deep: [0.28, 0.26, 0.25],
      surface: [0.88, 0.86, 0.83],
      foam: [1.0, 0.99, 0.97],
      sky: [0.8, 0.78, 0.76],
    },
    thickness: 0.8,
    mood: "Contrast. Crunch. Cream.",
    headline: ["BREAKS", "ON", "CONTACT."],
    description: "Whole cookies in at the last second, so some of it still crunches on the way up the straw.",
    ingredients: ["Cookies", "Vanilla cream", "Milk"],
    price: 520,
    bottle: null,
    fruitAssets: [],
    liquidAssets: { splash: null, pour: null, wave: null },
  },
  {
    id: "banana",
    index: "06",
    name: "Banana",
    color: "#f2cf63",
    secondaryColor: "#a8791f",
    palette: {
      deep: [0.42, 0.3, 0.08],
      surface: [0.95, 0.83, 0.42],
      foam: [1.0, 0.96, 0.82],
      sky: [0.98, 0.89, 0.62],
    },
    thickness: 0.68,
    mood: "Soft. Sunny. Smooth.",
    headline: ["SMOOTH", "ALL THE", "WAY DOWN."],
    description: "Frozen ripe banana, so it is thick without ice watering it down.",
    ingredients: ["Frozen banana", "Milk", "Honey"],
    price: 440,
    bottle: null,
    fruitAssets: [],
    liquidAssets: { splash: null, pour: null, wave: null },
  },
];

export const flavorById = (id: string) => flavors.find((f) => f.id === id) ?? flavors[0];

/** The five that get a full world + a slot in the lineup. Banana is menu-only. */
export const heroFlavors = flavors.filter((f) => f.id !== "banana");

export const builder = {
  base: [
    { id: "milk", name: "Milk", price: 0 },
    { id: "oat", name: "Oat", price: 60 },
    { id: "almond", name: "Almond", price: 60 },
    { id: "coconut", name: "Coconut", price: 80 },
  ],
  flavor: [
    { id: "mango", name: "Mango", price: 0 },
    { id: "strawberry", name: "Strawberry", price: 0 },
    { id: "chocolate", name: "Chocolate", price: 40 },
    { id: "banana", name: "Banana", price: 0 },
    { id: "pistachio", name: "Pistachio", price: 90 },
  ],
  extra: [
    { id: "oreo", name: "Oreo", price: 70 },
    { id: "brownie", name: "Brownie", price: 110 },
    { id: "peanut", name: "Peanut Butter", price: 80 },
    { id: "dates", name: "Dates", price: 70 },
    { id: "protein", name: "Protein", price: 150 },
    { id: "icecream", name: "Ice Cream", price: 120 },
  ],
  topping: [
    { id: "cream", name: "Cream", price: 40 },
    { id: "choc", name: "Chocolate", price: 50 },
    { id: "caramel", name: "Caramel", price: 50 },
    { id: "pistachio", name: "Pistachio", price: 90 },
    { id: "crumb", name: "Cookie Crumb", price: 60 },
  ],
  basePrice: 380,
} as const;

export const menu = [
  {
    id: "signature",
    name: "Signature Shakes",
    items: [
      { name: "Mango Wave", parts: ["Mango", "Milk", "Cream"], price: 480, hero: true },
      { name: "Strawberry Fold", parts: ["Strawberry", "Cream", "Vanilla"], price: 480 },
      { name: "Dark Current", parts: ["Dark cocoa", "Milk chocolate", "Cream"], price: 520, hero: true },
      { name: "Pistachio Quiet", parts: ["Pistachio paste", "Milk", "Sea salt"], price: 560 },
    ],
  },
  {
    id: "fruit",
    name: "Fruit Shakes",
    items: [
      { name: "Banana Smooth", parts: ["Frozen banana", "Milk", "Honey"], price: 440 },
      { name: "Berry Drift", parts: ["Mixed berries", "Yoghurt", "Milk"], price: 500 },
      { name: "Mango Banana", parts: ["Mango", "Banana", "Milk"], price: 490, hero: true },
    ],
  },
  {
    id: "chocolate",
    name: "Chocolate",
    items: [
      { name: "Triple Cocoa", parts: ["Dark", "Milk", "White"], price: 560 },
      { name: "Brownie Crash", parts: ["Brownie", "Chocolate", "Cream"], price: 600, hero: true },
      { name: "Nutella Deep", parts: ["Hazelnut", "Cocoa", "Milk"], price: 580 },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    items: [
      { name: "Saffron Pistachio", parts: ["Saffron", "Pistachio", "Cream"], price: 690 },
      { name: "Date & Almond", parts: ["Ajwa dates", "Almond milk"], price: 620 },
    ],
  },
  {
    id: "protein",
    name: "Protein",
    items: [
      { name: "Peanut Power", parts: ["Peanut butter", "Whey", "Banana"], price: 640 },
      { name: "Lean Cocoa", parts: ["Cocoa", "Whey", "Oat milk"], price: 620 },
    ],
  },
  {
    id: "smoothies",
    name: "Smoothies",
    items: [
      { name: "Green Cold", parts: ["Spinach", "Apple", "Lime"], price: 520 },
      { name: "Tropic Pull", parts: ["Pineapple", "Mango", "Coconut"], price: 540, hero: true },
    ],
  },
  {
    id: "kids",
    name: "Kids",
    items: [
      { name: "Little Mango", parts: ["Mango", "Milk"], price: 300 },
      { name: "Little Cocoa", parts: ["Chocolate", "Milk"], price: 300 },
    ],
  },
  {
    id: "addons",
    name: "Add-ons",
    items: [
      { name: "Extra Cream", parts: [], price: 40 },
      { name: "Extra Scoop", parts: [], price: 120 },
      { name: "Protein Shot", parts: [], price: 150 },
    ],
  },
];

export const locations = [
  {
    id: "clifton",
    name: "Clifton",
    address: "Block 4, Khayaban-e-Roomi, Karachi",
    hours: "12:00 – 02:00",
    note: "The big one. Full flavour wall.",
    maps: "https://maps.google.com/?q=Clifton+Karachi",
  },
  {
    id: "dha",
    name: "DHA Phase 6",
    address: "Bukhari Commercial, Karachi",
    hours: "01:00 – 03:00",
    note: "Late. Drive-through only after midnight.",
    maps: "https://maps.google.com/?q=Bukhari+Commercial+Karachi",
  },
  {
    id: "gulberg",
    name: "Gulberg",
    address: "MM Alam Road, Lahore",
    hours: "12:00 – 02:00",
    note: "Outdoor seating, mango season gets loud.",
    maps: "https://maps.google.com/?q=MM+Alam+Road+Lahore",
  },
  {
    id: "f7",
    name: "F-7 Markaz",
    address: "Bhittai Road, Islamabad",
    hours: "12:00 – 01:00",
    note: "Coldest room we have.",
    maps: "https://maps.google.com/?q=F-7+Markaz+Islamabad",
  },
];

export const reviews = [
  { quote: ["THAT MANGO", "SHAKE IS", "DANGEROUS."], by: "Hira N.", stars: 5, flavor: "mango" },
  { quote: ["I ORDERED ONE.", "THEN", "ANOTHER."], by: "Bilal A.", stars: 5, flavor: "strawberry" },
  { quote: ["THICK ENOUGH", "TO STAND", "A SPOON IN."], by: "Zoya K.", stars: 5, flavor: "chocolate" },
];

export const site = {
  brandName: "WAVEHOUSE",
  tagline: "Taste the wave.",
  currency: "Rs.",
  orderUrl: "#order",
  whatsapp: "+92 300 0000000",
  delivery: ["Foodpanda", "Careem", "Own riders — 30 min"],
  socialLinks: [
    { name: "Instagram", url: "#" },
    { name: "TikTok", url: "#" },
    { name: "YouTube", url: "#" },
  ],
  nav: [
    { name: "Flavors", href: "#flavors" },
    { name: "Build Your Shake", href: "#builder" },
    { name: "Our Story", href: "#story" },
    { name: "Locations", href: "#locations" },
  ],
} as const;

export const money = (n: number) => `${site.currency} ${n}`;
