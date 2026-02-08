// DeepseaCreatures_spritesheet.png is 96x1488
// 2 columns of 48px wide, each row is 48px tall
// Left column = frame 0, right column = frame 1
// 31 rows total (1488 / 48 = 31)

// Frame helper: row index -> source rectangles for both animation frames
function frames(row) {
    return [
        { sx: 0, sy: row * 48, sw: 48, sh: 48 },
        { sx: 48, sy: row * 48, sw: 48, sh: 48 },
    ];
}

export const CREATURE_TYPES = {
    anglerfish: {
        frames: frames(9),
        rarity: 'epic',
        points: 75,
        bonusHarpoons: 0,
        displaySize: 112,
        hitboxRadius: 32,
        baseSpeed: 135,
        name: 'Anglerfish',
    },
    barrelfish: {
        frames: frames(12),
        rarity: 'legendary',
        points: 100,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 24,
        baseSpeed: 75,
        name: 'Barrelfish',
    },
    blobfish: {
        frames: frames(6),
        rarity: 'rare',
        points: 50,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 26,
        baseSpeed: 135,
        name: 'Blobfish',
    },
    cookie_cutter_shark: {
        frames: frames(29),
        rarity: 'uncommon',
        points: 30,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 29,
        baseSpeed: 113,
        name: 'Cookie Cutter Shark',
    },
    dumbo_octopus: {
        frames: frames(0),
        rarity: 'rare',
        points: 50,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 30,
        baseSpeed: 120,
        name: 'Dumbo Octopus',
    },
    fangtooth: {
        frames: frames(19),
        rarity: 'uncommon',
        points: 30,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 26,
        baseSpeed: 75,
        name: 'Fangtooth',
    },
    frilled_shark: {
        frames: frames(2),
        rarity: 'rare',
        points: 50,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 23,
        baseSpeed: 210,
        name: 'Frilled Shark',
        waveAmplitude: 30,
        waveFrequency: 3,
    },
    giant_isopod: {
        frames: frames(3),
        rarity: 'common',
        points: 10,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 26,
        baseSpeed: 100,
        name: 'Giant Isopod',
    },
    goblin_shark: {
        frames: frames(7),
        rarity: 'epic',
        points: 75,
        bonusHarpoons: 0,
        displaySize: 128,
        hitboxRadius: 38,
        baseSpeed: 200,
        name: 'Goblin Shark',
    },
    gulper_eel: {
        frames: frames(4),
        rarity: 'legendary',
        points: 100,
        bonusHarpoons: 1,
        displaySize: 112,
        hitboxRadius: 34,
        baseSpeed: 205,
        name: 'Gulper Eel',
    },
    hatchetfish: {
        frames: frames(30),
        rarity: 'common',
        points: 10,
        bonusHarpoons: 0,
        displaySize: 80,
        hitboxRadius: 19,
        baseSpeed: 105,
        name: 'Hatchetfish',
    },
    lanternfish: {
        frames: frames(22),
        rarity: 'common',
        points: 10,
        bonusHarpoons: 0,
        displaySize: 112,
        hitboxRadius: 32,
        baseSpeed: 83,
        name: 'Lanternfish',
    },
    tubeworm: {
        frames: frames(20),
        rarity: 'common',
        points: 30,
        bonusHarpoons: 0,
        displaySize: 220,
        hitboxRadius: 80,
        baseSpeed: 100,
        name: 'Tubeworm',
    },
    sea_spider: {
        frames: frames(15),
        rarity: 'common',
        points: 20,
        bonusHarpoons: 0,
        displaySize: 128,
        hitboxRadius: 36,
        baseSpeed: 200,
        name: 'Sea Spider',
    },
    sea_toad: {
        frames: frames(13),
        rarity: 'uncommon',
        points: 30,
        bonusHarpoons: 0,
        displaySize: 80,
        hitboxRadius: 21,
        baseSpeed: 200,
        name: 'Sea Toad',
    },
    siphonophore: {
        frames: frames(1),
        rarity: 'common',
        points: 10,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 26,
        baseSpeed: 180,
        name: 'Siphonophore',
    },
    spider_crab: {
        frames: frames(8),
        rarity: 'rare',
        points: 50,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 29,
        baseSpeed: 100,
        name: 'Spider Crab',
    },
    squat_lobster: {
        frames: frames(14),
        rarity: 'common',
        points: 10,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 30,
        baseSpeed: 83,
        name: 'Squat Lobster',
    },
    vampire_squid: {
        frames: frames(5),
        rarity: 'uncommon',
        points: 30,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 29,
        baseSpeed: 200,
        name: 'Vampire Squid',
    },
    vantafish: {
        frames: frames(16),
        rarity: 'rare',
        points: 50,
        bonusHarpoons: 0,
        displaySize: 80,
        hitboxRadius: 23,
        baseSpeed: 150,
        name: 'Vantafish',
    },
    viperfish: {
        frames: frames(10),
        rarity: 'common',
        points: 10,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 29,
        baseSpeed: 165,
        name: 'Viperfish',
    },
    winged_comb_jelly: {
        frames: frames(11),
        rarity: 'common',
        points: 20,
        bonusHarpoons: 0,
        displaySize: 96,
        hitboxRadius: 26,
        baseSpeed: 195,
        name: 'Winged Comb Jelly',
    },
};

// Treasure items from Treasure+.png (16x16 cells, rows 4-8)
// Each treasure has: frame coords (sx, sy), name, points, bonusHarpoons
export const TREASURE_ITEMS = [
    // Row 4 (y=48) - gems and coins
    { sx: 0, sy: 64, name: 'Diamond Ring', points: 200, bonusHarpoons: 2 },
    { sx: 16, sy: 64, name: 'Emerald Ring', points: 200, bonusHarpoons: 2 },
    { sx: 32, sy: 64, name: 'Sapphire Ring', points: 200, bonusHarpoons: 2 },
    { sx: 48, sy: 64, name: 'Ruby Ring', points: 200, bonusHarpoons: 2 },
    { sx: 240, sy: 64, name: 'Chalice', points: 300, bonusHarpoons: 2 },
    // Row 5 (y=80) - more valuables
    { sx: 64, sy: 80, name: 'Gold Necklace', points: 150, bonusHarpoons: 2 },
    // Row 6 (y=96) - treasures
    { sx: 64, sy: 96, name: 'Golden Ankh', points: 250, bonusHarpoons: 2 },
    { sx: 128, sy: 96, name: 'Golden Lamp', points: 300, bonusHarpoons: 2 },
    { sx: 144, sy: 96, name: 'Golden Comb', points: 300, bonusHarpoons: 2 },
    { sx: 240, sy: 96, name: 'Ruby Crown', points: 350, bonusHarpoons: 3 },
    { sx: 224, sy: 96, name: 'Ruby Tiara', points: 350, bonusHarpoons: 2 },
    { sx: 192, sy: 96, name: 'Ruby Scepter', points: 300, bonusHarpoons: 2 },
    // Row 7 (y=112) - artifacts
    { sx: 64, sy: 112, name: 'Golden Elephant', points: 400, bonusHarpoons: 2 },
    { sx: 80, sy: 112, name: 'Golden Eagle', points: 400, bonusHarpoons: 2 },
    { sx: 96, sy: 112, name: 'Zlatorog', points: 450, bonusHarpoons: 3 },
    // Row 8 (y=128) - rare finds
    { sx: 32, sy: 48, name: 'Gold Bars', points: 300, bonusHarpoons: 3 },
    { sx: 96, sy: 80, name: 'Golden Horn', points: 300, bonusHarpoons: 3 },
];

// Build a lookup for treasure items by typeKey (for score screen gallery)
export const TREASURE_TYPES_MAP = {};
for (const item of TREASURE_ITEMS) {
    const key = 'treasure_' + item.name.toLowerCase().replace(/\s+/g, '_');
    TREASURE_TYPES_MAP[key] = {
        frame: { sx: item.sx, sy: item.sy, sw: 16, sh: 16 },
        name: item.name,
        rarity: 'legendary',
    };
}

// Ghost creature from Silly_Placeholders.png (col 9, row 4 = pixel 128,48, 16x16)
export const GHOST_CREATURE = {
    frames: [
        { sx: 128, sy: 48, sw: 16, sh: 16 },
        { sx: 128, sy: 48, sw: 16, sh: 16 },
    ],
    rarity: 'legendary',
    points: 0,
    bonusHarpoons: 10,
    displaySize: 56,
    hitboxRadius: 21,
    baseSpeed: 120,
    name: 'Ghost',
    useSillySpriteSheet: true,
};

// Grouping by rarity for spawn manager
export const CREATURES_BY_RARITY = {
    common: [
        'giant_isopod',
        'hatchetfish',
        'lanternfish',
        'sea_spider',
        'siphonophore',
        'squat_lobster',
        'viperfish',
        'winged_comb_jelly',
    ],
    uncommon: ['cookie_cutter_shark', 'fangtooth', 'sea_toad', 'vampire_squid'],
    rare: ['blobfish', 'dumbo_octopus', 'frilled_shark', 'spider_crab', 'vantafish'],
    epic: ['anglerfish', 'goblin_shark'],
    legendary: ['barrelfish', 'gulper_eel'],
};
