// Maze generation and pathfinding for Memory Maze
class MazeGenerator {
    constructor() {
        this.directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }  // left
        ];
    }

    // Generate a maze with guaranteed path from start to finish
    generateMaze(size, level = 1) {
        const maze = this.createEmptyMaze(size);
        const pathLength = Math.min(size * 2 + level, size * size * 0.7);
        
        // Choose start and finish positions
        const start = { x: 0, y: 0 };
        const finish = { x: size - 1, y: size - 1 };
        
        // Generate main path
        const mainPath = this.generatePath(maze, start, finish, size);
        
        // Add some walls but ensure path remains valid
        this.addWalls(maze, size, mainPath, level);
        
        // Extend the path to make it more challenging
        const finalPath = this.extendPath(maze, mainPath, pathLength, size);
        
        return {
            grid: maze,
            path: finalPath,
            start: start,
            finish: finish,
            size: size
        };
    }

    // Create empty maze filled with paths
    createEmptyMaze(size) {
        const maze = [];
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                row.push({
                    x: x,
                    y: y,
                    type: 'path', // 'path', 'wall', 'start', 'finish'
                    visited: false
                });
            }
            maze.push(row);
        }
        return maze;
    }

    // Generate a basic path from start to finish
    generatePath(maze, start, finish, size) {
        const path = [];
        let current = { ...start };
        
        // Add start position
        path.push({ ...current });
        maze[current.y][current.x].type = 'start';
        
        // Simple pathfinding - move towards finish with some randomness
        while (current.x !== finish.x || current.y !== finish.y) {
            const possibleMoves = [];
            
            // Prefer moves that get us closer to the finish
            if (current.x < finish.x) possibleMoves.push({ x: 1, y: 0 });
            if (current.x > finish.x) possibleMoves.push({ x: -1, y: 0 });
            if (current.y < finish.y) possibleMoves.push({ x: 0, y: 1 });
            if (current.y > finish.y) possibleMoves.push({ x: 0, y: -1 });
            
            // Add some random moves for variety
            if (Math.random() > 0.7) {
                this.directions.forEach(dir => {
                    const newX = current.x + dir.x;
                    const newY = current.y + dir.y;
                    if (this.isValidPosition(newX, newY, size)) {
                        possibleMoves.push(dir);
                    }
                });
            }
            
            if (possibleMoves.length === 0) break;
            
            // Choose a random move from possible moves
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            current.x += move.x;
            current.y += move.y;
            
            // Ensure we don't go out of bounds
            current.x = Math.max(0, Math.min(size - 1, current.x));
            current.y = Math.max(0, Math.min(size - 1, current.y));
            
            // Add to path if not already there
            if (!path.some(p => p.x === current.x && p.y === current.y)) {
                path.push({ ...current });
            }
        }
        
        // Set finish position
        maze[finish.y][finish.x].type = 'finish';
        
        return path;
    }

    // Add walls to make the maze more challenging
    addWalls(maze, size, mainPath, level) {
        const wallDensity = Math.min(0.3, level * 0.05); // Increase walls with level
        const pathPositions = new Set(mainPath.map(p => `${p.x},${p.y}`));
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Don't place walls on the main path
                if (pathPositions.has(`${x},${y}`)) continue;
                
                // Random wall placement
                if (Math.random() < wallDensity) {
                    maze[y][x].type = 'wall';
                }
            }
        }
    }

    // Extend the path to make it longer and more challenging
    extendPath(maze, basePath, targetLength, size) {
        const extended = [...basePath];
        const used = new Set(basePath.map(p => `${p.x},${p.y}`));
        
        while (extended.length < targetLength) {
            // Try to add adjacent tiles to existing path
            const candidates = [];
            
            for (const pathTile of extended) {
                for (const dir of this.directions) {
                    const newX = pathTile.x + dir.x;
                    const newY = pathTile.y + dir.y;
                    
                    if (this.isValidPosition(newX, newY, size) && 
                        !used.has(`${newX},${newY}`) &&
                        maze[newY][newX].type !== 'wall') {
                        candidates.push({ x: newX, y: newY });
                    }
                }
            }
            
            if (candidates.length === 0) break;
            
            // Choose random candidate
            const newTile = candidates[Math.floor(Math.random() * candidates.length)];
            extended.push(newTile);
            used.add(`${newTile.x},${newTile.y}`);
        }
        
        return extended;
    }

    // Check if position is valid
    isValidPosition(x, y, size) {
        return x >= 0 && x < size && y >= 0 && y < size;
    }

    // Get adjacent tiles
    getAdjacent(x, y, size) {
        const adjacent = [];
        for (const dir of this.directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            if (this.isValidPosition(newX, newY, size)) {
                adjacent.push({ x: newX, y: newY });
            }
        }
        return adjacent;
    }

    // Verify path is valid (all tiles are accessible)
    isPathValid(maze, path) {
        for (const tile of path) {
            if (maze[tile.y][tile.x].type === 'wall') {
                return false;
            }
        }
        return true;
    }
}

// Create global maze generator instance
window.mazeGenerator = new MazeGenerator();