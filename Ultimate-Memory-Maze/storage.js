// LocalStorage management for Memory Maze game
class GameStorage {
    constructor() {
        this.storageKey = 'memoryMazeData';
        this.defaultData = {
            bestLevel: 1,
            gamesWon: 0,
            totalGamesPlayed: 0,
            levelTimes: {},
            unlockedLevel: 1,
            settings: {
                soundEnabled: true,
                animations: true
            }
        };
    }

    // Load game data from localStorage
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                return { ...this.defaultData, ...data };
            }
        } catch (error) {
            console.warn('Error loading game data:', error);
        }
        return { ...this.defaultData };
    }

    // Save game data to localStorage
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('Error saving game data:', error);
            return false;
        }
    }

    // Update best level
    updateBestLevel(level) {
        const data = this.loadData();
        if (level > data.bestLevel) {
            data.bestLevel = level;
            data.unlockedLevel = level;
            this.saveData(data);
            return true;
        }
        return false;
    }

    // Record level completion
    recordLevelCompletion(level, time, attempts = 1) {
        const data = this.loadData();
        
        // Update games won
        data.gamesWon++;
        data.totalGamesPlayed++;
        
        // Update best time for this level
        const levelKey = `level_${level}`;
        if (!data.levelTimes[levelKey] || time < data.levelTimes[levelKey].bestTime) {
            data.levelTimes[levelKey] = {
                bestTime: time,
                attempts: attempts,
                completedAt: Date.now()
            };
        }
        
        // Update best level if this is a new high
        if (level > data.bestLevel) {
            data.bestLevel = level;
            data.unlockedLevel = level + 1;
        }
        
        this.saveData(data);
        return data;
    }

    // Get best time for a level
    getBestTime(level) {
        const data = this.loadData();
        const levelKey = `level_${level}`;
        return data.levelTimes[levelKey]?.bestTime || null;
    }

    // Get statistics
    getStats() {
        return this.loadData();
    }

    // Reset all data
    resetData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.warn('Error resetting game data:', error);
            return false;
        }
    }

    // Get unlock status for level
    isLevelUnlocked(level) {
        const data = this.loadData();
        return level <= data.unlockedLevel;
    }

    // Update game played count
    recordGamePlayed() {
        const data = this.loadData();
        data.totalGamesPlayed++;
        this.saveData(data);
    }
}

// Create global storage instance
window.gameStorage = new GameStorage();