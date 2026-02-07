export const CONFIG = {
    DESIGN_WIDTH: 1920,
    DESIGN_HEIGHT: 1080,

    // Harpoon
    HARPOON_SPEED: 1500,
    HARPOON_MAX_ROPE: 2250, // diagonal of 1920x1080, reaches all corners
    RETRACT_SPEED: 900,
    AIM_ANGLE_MIN: -85,   // degrees from vertical
    AIM_ANGLE_MAX: 85,

    // Gameplay
    STARTING_HARPOONS: 10,

    // Treasure chest
    CHEST_X: 960,
    CHEST_Y: 525,
    CHEST_OPEN_INTERVAL_MIN: 15000,
    CHEST_OPEN_INTERVAL_MAX: 30000,
    CHEST_OPEN_DURATION: 5000,
    TREASURE_TUBEWORM_RING_ENABLED: true,

    // Spawning
    CREATURE_DESPAWN_MARGIN: 100,
    MAX_CREATURES_ON_SCREEN: 25,

    // Rarity colors
    RARITY_COLORS: {
        common: '#FFFFFF',
        uncommon: '#2ECC71',
        rare: '#3498DB',
        epic: '#9B59B6',
        legendary: '#F1C40F',
    },
};
