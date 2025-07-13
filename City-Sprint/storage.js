class GameStorage {
    constructor() {
        this.keys = {
            bestScore: 'citySprintBestScore',
            unlockedSkins: 'citySprintUnlockedSkins',
            selectedSkin: 'citySprintSelectedSkin',
            totalDistance: 'citySprintTotalDistance'
        };
        
        this.skins = [
            { id: 'default', name: 'Runner', emoji: '🏃', unlockDistance: 0 },
            { id: 'ninja', name: 'Ninja', emoji: '🥷', unlockDistance: 500 },
            { id: 'robot', name: 'Robot', emoji: '🤖', unlockDistance: 1000 },
            { id: 'superhero', name: 'Hero', emoji: '🦸', unlockDistance: 1500 },
            { id: 'alien', name: 'Alien', emoji: '👽', unlockDistance: 2000 },
            { id: 'wizard', name: 'Wizard', emoji: '🧙', unlockDistance: 2500 }
        ];
        
        this.motivationalQuotes = [
            "🏃‍♂️ Every step counts in the city that never sleeps!",
            "🌃 The streets are calling your name, runner!",
            "⚡ Speed is your ally, obstacles are your teachers.",
            "🏙️ In the urban jungle, only the swift survive.",
            "💪 Your legs are your engine, your heart is your fuel.",
            "✨ The city lights guide your way to greatness.",
            "📈 Every fall is a lesson, every run is progress.",
            "🏆 Urban legends are made one sprint at a time.",
            "👟 The pavement remembers every footstep of a champion.",
            "🎯 In the race of life, you set the pace!"
        ];
    }

    getBestScore() {
        return parseInt(localStorage.getItem(this.keys.bestScore) || '0');
    }

    setBestScore(score) {
        localStorage.setItem(this.keys.bestScore, score.toString());
    }

    getUnlockedSkins() {
        const stored = localStorage.getItem(this.keys.unlockedSkins);
        return stored ? JSON.parse(stored) : ['default'];
    }

    unlockSkin(skinId) {
        const unlocked = this.getUnlockedSkins();
        if (!unlocked.includes(skinId)) {
            unlocked.push(skinId);
            localStorage.setItem(this.keys.unlockedSkins, JSON.stringify(unlocked));
            return true;
        }
        return false;
    }

    getSelectedSkin() {
        return localStorage.getItem(this.keys.selectedSkin) || 'default';
    }

    setSelectedSkin(skinId) {
        localStorage.setItem(this.keys.selectedSkin, skinId);
    }

    getTotalDistance() {
        return parseInt(localStorage.getItem(this.keys.totalDistance) || '0');
    }

    addToTotalDistance(distance) {
        const current = this.getTotalDistance();
        const newTotal = current + distance;
        localStorage.setItem(this.keys.totalDistance, newTotal.toString());
        return newTotal;
    }

    checkForNewUnlocks(currentScore) {
        const unlocked = this.getUnlockedSkins();
        const newUnlocks = [];

        for (const skin of this.skins) {
            if (currentScore >= skin.unlockDistance && !unlocked.includes(skin.id)) {
                if (this.unlockSkin(skin.id)) {
                    newUnlocks.push(skin);
                }
            }
        }

        return newUnlocks;
    }

    getSkinById(skinId) {
        return this.skins.find(skin => skin.id === skinId) || this.skins[0];
    }

    getRandomMotivationalQuote() {
        return this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
    }

    getAllSkins() {
        return [...this.skins];
    }
}

// Global storage instance
const gameStorage = new GameStorage();