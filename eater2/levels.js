const LEVELS = [
    {
        id: 1,
        name: '肉包子',
        emoji: '🍞',
        bites: 3,
        foodCount: 1,
        timeLimit: 20,
        speed: 0.5,
        description: '教学关，学会抛接和吃东西',
        bgColor: '#FFF8E1',
        bgGradient: 'linear-gradient(180deg, #FFECB3 0%, #FFF8E1 100%)'
    },
    {
        id: 2,
        name: '油条',
        emoji: '🥖',
        bites: 4,
        foodCount: 1,
        timeLimit: 25,
        speed: 0.55,
        description: '细长的油条，考验精准度',
        bgColor: '#FFECB3',
        bgGradient: 'linear-gradient(180deg, #FFE082 0%, #FFECB3 100%)'
    },
    {
        id: 3,
        name: '糖葫芦',
        emoji: '🍡',
        bites: 5,
        foodCount: 1,
        timeLimit: 30,
        speed: 0.6,
        description: '旋转的糖葫芦，小心别眼花',
        bgColor: '#FFEBEE',
        bgGradient: 'linear-gradient(180deg, #FFCDD2 0%, #FFEBEE 100%)'
    },
    {
        id: 4,
        name: '棉花糖',
        emoji: '🍬',
        bites: 6,
        foodCount: 1,
        timeLimit: 35,
        speed: 0.65,
        description: '轻飘飘的棉花糖，节奏要把握好',
        bgColor: '#FCE4EC',
        bgGradient: 'linear-gradient(180deg, #F8BBD9 0%, #FCE4EC 100%)'
    },
    {
        id: 5,
        name: '汉堡包',
        emoji: '🍔',
        bites: 7,
        foodCount: 2,
        timeLimit: 40,
        speed: 0.65,
        description: '首次双手抛接，两只汉堡交替',
        bgColor: '#E3F2FD',
        bgGradient: 'linear-gradient(180deg, #BBDEFB 0%, #E3F2FD 100%)'
    },
    {
        id: 6,
        name: '热狗',
        emoji: '🌭',
        bites: 8,
        foodCount: 2,
        timeLimit: 45,
        speed: 0.75,
        description: '长条热狗，判定窗口更短',
        bgColor: '#EFEBE9',
        bgGradient: 'linear-gradient(180deg, #D7CCC8 0%, #EFEBE9 100%)'
    },
    {
        id: 7,
        name: '披萨饼',
        emoji: '🍕',
        bites: 9,
        foodCount: 2,
        timeLimit: 50,
        speed: 0.85,
        description: '宽大的披萨，遮挡视线',
        bgColor: '#FFF3E0',
        bgGradient: 'linear-gradient(180deg, #FFE0B2 0%, #FFF3E0 100%)'
    },
    {
        id: 8,
        name: '三明治',
        emoji: '🥪',
        bites: 10,
        foodCount: 3,
        timeLimit: 55,
        speed: 0.85,
        description: '三个三明治，一心多用的挑战',
        bgColor: '#E8F5E9',
        bgGradient: 'linear-gradient(180deg, #C8E6C9 0%, #E8F5E9 100%)'
    },
    {
        id: 9,
        name: '千层蛋糕',
        emoji: '🎂',
        bites: 11,
        foodCount: 3,
        timeLimit: 60,
        speed: 0.95,
        description: '绚丽的千层蛋糕，视觉干扰强',
        bgColor: '#FCE4EC',
        bgGradient: 'linear-gradient(180deg, #F48FB1 0%, #FCE4EC 100%)'
    },
    {
        id: 10,
        name: '红苹果',
        emoji: '🍎',
        bites: 12,
        foodCount: 3,
        timeLimit: 65,
        speed: 1.05,
        description: '最终Boss关，吃货之王的考验',
        bgColor: '#FFEBEE',
        bgGradient: 'linear-gradient(180deg, #EF5350 0%, #FFEBEE 100%)'
    }
];

const ACHIEVEMENTS = [
    {
        id: 'first_taste',
        name: '初次品尝',
        description: '通关第1关',
        icon: '🍽️',
        condition: (stats) => stats.completedLevels >= 1
    },
    {
        id: 'little_eater',
        name: '小吃货',
        description: '通关第5关',
        icon: '🍔',
        condition: (stats) => stats.completedLevels >= 5
    },
    {
        id: 'big_stomach',
        name: '大胃王',
        description: '通关第10关',
        icon: '👑',
        condition: (stats) => stats.completedLevels >= 10
    },
    {
        id: 'perfect_star',
        name: '完美三星',
        description: '全部关卡三星通关',
        icon: '⭐',
        condition: (stats) => stats.starCount >= 30
    },
    {
        id: 'speed_eater',
        name: '速食达人',
        description: '单关卡5秒内通关',
        icon: '⚡',
        condition: (stats) => stats.fastestTime <= 5
    },
    {
        id: 'no_mistake',
        name: '零失误',
        description: '通关任意关卡一口不落',
        icon: '🎯',
        condition: (stats) => stats.perfectRuns >= 1
    },
    {
        id: 'food_collector',
        name: '美食收藏家',
        description: '解锁全部吃货图鉴',
        icon: '📚',
        condition: (stats) => stats.unlockedFoods >= 10
    }
];

function getDefaultStats() {
    return {
        totalScore: 0,
        completedLevels: 0,
        starCount: 0,
        levelStars: {},
        fastestTime: Infinity,
        perfectRuns: 0,
        unlockedFoods: 0,
        unlockedLevels: 1,
        unlockedAchievements: []
    };
}

function loadStats() {
    const saved = localStorage.getItem('eater2_stats');
    if (saved) {
        return JSON.parse(saved);
    }
    return getDefaultStats();
}

function saveStats(stats) {
    localStorage.setItem('eater2_stats', JSON.stringify(stats));
}
