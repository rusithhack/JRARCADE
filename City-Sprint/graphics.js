class GraphicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        
        this.particles = [];
        this.backgroundLayers = this.generateBackgroundLayers();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateBackgroundLayers() {
        return [
            { speed: 0.2, buildings: this.generateBuildings(50, 0.3) },
            { speed: 0.5, buildings: this.generateBuildings(30, 0.6) },
            { speed: 0.8, buildings: this.generateBuildings(20, 0.9) }
        ];
    }

    generateBuildings(count, intensity) {
        const buildings = [];
        for (let i = 0; i < count; i++) {
            buildings.push({
                x: (i * this.canvas.width * 2) / count,
                width: 80 + Math.random() * 120,
                height: 100 + Math.random() * 300,
                color: this.getRandomNeonColor(intensity),
                windows: Math.random() > 0.5
            });
        }
        return buildings;
    }

    getRandomNeonColor(intensity = 1) {
        const colors = [
            `rgba(0, 255, 255, ${intensity})`,
            `rgba(255, 0, 128, ${intensity})`,
            `rgba(255, 255, 0, ${intensity})`,
            `rgba(0, 255, 0, ${intensity})`,
            `rgba(255, 64, 255, ${intensity})`,
            `rgba(64, 255, 255, ${intensity})`
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground(scrollOffset, gameSpeed) {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.7, '#16213e');
        gradient.addColorStop(1, '#0f0f23');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw parallax building layers
        this.backgroundLayers.forEach((layer, index) => {
            this.drawBuildingLayer(layer, scrollOffset * layer.speed, gameSpeed);
        });
    }

    drawBuildingLayer(layer, offset, gameSpeed) {
        layer.buildings.forEach(building => {
            const x = building.x - offset;
            const groundY = this.canvas.height - 80;
            
            // Wrap buildings around screen
            if (x + building.width < 0) {
                building.x += this.canvas.width * 2;
            }
            
            if (x < this.canvas.width + building.width) {
                this.drawBuilding(x, groundY - building.height, building.width, building.height, building.color, building.windows);
            }
        });
    }

    drawBuilding(x, y, width, height, color, hasWindows) {
        // Building silhouette
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // Building outline glow
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Windows
        if (hasWindows) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            const windowSize = 8;
            const spacing = 20;
            
            for (let wx = x + 10; wx < x + width - windowSize; wx += spacing) {
                for (let wy = y + 10; wy < y + height - windowSize; wy += spacing * 1.5) {
                    if (Math.random() > 0.3) {
                        this.ctx.fillRect(wx, wy, windowSize, windowSize);
                    }
                }
            }
        }
    }

    drawGround(scrollOffset) {
        const groundY = this.canvas.height - 80;
        
        // Ground
        this.ctx.fillStyle = '#2a2a3a';
        this.ctx.fillRect(0, groundY, this.canvas.width, 80);
        
        // Road markings
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        
        const lineY = groundY + 40;
        this.ctx.beginPath();
        this.ctx.moveTo(-scrollOffset % 40, lineY);
        this.ctx.lineTo(this.canvas.width, lineY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawPlayer(x, y, width, height, action, animFrame, skin) {
        const skinData = gameStorage.getSkinById(skin);
        
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width/2, this.canvas.height - 80, width/2, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw custom character based on skin
        this.drawCustomCharacter(x, y, width, height, action, animFrame, skinData);
        
        // Action effects
        if (action === 'jumping') {
            this.drawJumpEffect(x, y + height);
        } else if (action === 'sliding') {
            this.drawSlideEffect(x, y + height);
        }
        
        // Running dust trail
        if (action === 'running') {
            this.addDustParticle(x - 10, y + height);
            
            // Add forward motion lines
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + width + 5 + i * 8, y + height/2 + i * 3);
                this.ctx.lineTo(x + width + 15 + i * 8, y + height/2 + i * 3);
                this.ctx.stroke();
            }
        }
    }

    drawCustomCharacter(x, y, width, height, action, animFrame, skinData) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const bobOffset = action === 'running' ? Math.sin(animFrame * 0.3) * 2 : 0;
        
        // Character colors based on skin
        const colors = this.getCharacterColors(skinData.id);
        
        this.ctx.save();
        
        // Apply sliding transformation
        if (action === 'sliding') {
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(1.2, 0.6);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // Body (main torso)
        this.ctx.fillStyle = colors.body;
        this.ctx.shadowColor = colors.glow;
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.roundRect(x + width * 0.3, y + height * 0.3 + bobOffset, width * 0.4, height * 0.5, 8);
        this.ctx.fill();
        
        // Head
        this.ctx.fillStyle = colors.head;
        this.ctx.beginPath();
        this.ctx.arc(centerX, y + height * 0.2 + bobOffset, width * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Arms (animated for running)
        const armSwing = action === 'running' ? Math.sin(animFrame * 0.4) * 0.3 : 0;
        
        // Left arm
        this.ctx.fillStyle = colors.limbs;
        this.ctx.beginPath();
        this.ctx.roundRect(
            x + width * 0.15, 
            y + height * 0.35 + bobOffset + armSwing * 5, 
            width * 0.12, 
            height * 0.3, 
            4
        );
        this.ctx.fill();
        
        // Right arm
        this.ctx.beginPath();
        this.ctx.roundRect(
            x + width * 0.73, 
            y + height * 0.35 + bobOffset - armSwing * 5, 
            width * 0.12, 
            height * 0.3, 
            4
        );
        this.ctx.fill();
        
        // Legs (animated for running)
        const legSwing = action === 'running' ? Math.sin(animFrame * 0.5) * 0.4 : 0;
        
        // Left leg
        this.ctx.beginPath();
        this.ctx.roundRect(
            x + width * 0.35 + legSwing * 3, 
            y + height * 0.65 + bobOffset, 
            width * 0.12, 
            height * 0.3, 
            4
        );
        this.ctx.fill();
        
        // Right leg
        this.ctx.beginPath();
        this.ctx.roundRect(
            x + width * 0.53 - legSwing * 3, 
            y + height * 0.65 + bobOffset, 
            width * 0.12, 
            height * 0.3, 
            4
        );
        this.ctx.fill();
        
        // Eyes (facing forward)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.arc(centerX - width * 0.05, y + height * 0.18 + bobOffset, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + width * 0.05, y + height * 0.18 + bobOffset, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Special skin features
        this.drawSkinFeatures(centerX, y + height * 0.2 + bobOffset, width, skinData.id, colors);
        
        // Character outline glow
        this.ctx.strokeStyle = colors.outline;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }
    
    getCharacterColors(skinId) {
        const colorSchemes = {
            default: {
                body: '#00ffff',
                head: '#00cccc',
                limbs: '#0099aa',
                glow: '#00ffff',
                outline: '#ffffff'
            },
            ninja: {
                body: '#2a2a2a',
                head: '#1a1a1a',
                limbs: '#333333',
                glow: '#8a2be2',
                outline: '#8a2be2'
            },
            robot: {
                body: '#c0c0c0',
                head: '#a0a0a0',
                limbs: '#808080',
                glow: '#00ff00',
                outline: '#00ff00'
            },
            superhero: {
                body: '#ff0000',
                head: '#ffddaa',
                limbs: '#cc0000',
                glow: '#ffff00',
                outline: '#ffff00'
            },
            alien: {
                body: '#00ff00',
                head: '#00cc00',
                limbs: '#009900',
                glow: '#00ff00',
                outline: '#ffffff'
            },
            wizard: {
                body: '#4b0082',
                head: '#ffddaa',
                limbs: '#6a0dad',
                glow: '#ff69b4',
                outline: '#ff69b4'
            }
        };
        
        return colorSchemes[skinId] || colorSchemes.default;
    }
    
    drawSkinFeatures(centerX, centerY, width, skinId, colors) {
        this.ctx.shadowBlur = 8;
        
        switch (skinId) {
            case 'ninja':
                // Ninja mask
                this.ctx.fillStyle = '#1a1a1a';
                this.ctx.fillRect(centerX - width * 0.12, centerY - width * 0.08, width * 0.24, width * 0.1);
                break;
                
            case 'robot':
                // Robot antenna
                this.ctx.fillStyle = colors.glow;
                this.ctx.fillRect(centerX - 1, centerY - width * 0.2, 2, width * 0.1);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY - width * 0.2, 3, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'superhero':
                // Cape
                this.ctx.fillStyle = '#0000ff';
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - width * 0.2, centerY);
                this.ctx.lineTo(centerX - width * 0.3, centerY + width * 0.4);
                this.ctx.lineTo(centerX - width * 0.1, centerY + width * 0.3);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'alien':
                // Alien antennae
                this.ctx.fillStyle = colors.glow;
                this.ctx.fillRect(centerX - width * 0.08, centerY - width * 0.18, 1, width * 0.08);
                this.ctx.fillRect(centerX + width * 0.08, centerY - width * 0.18, 1, width * 0.08);
                this.ctx.beginPath();
                this.ctx.arc(centerX - width * 0.08, centerY - width * 0.18, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(centerX + width * 0.08, centerY - width * 0.18, 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'wizard':
                // Wizard hat
                this.ctx.fillStyle = colors.body;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - width * 0.25);
                this.ctx.lineTo(centerX - width * 0.15, centerY - width * 0.05);
                this.ctx.lineTo(centerX + width * 0.15, centerY - width * 0.05);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Star on hat
                this.ctx.fillStyle = '#ffff00';
                this.drawStar(centerX, centerY - width * 0.15, 4, 2, 5);
                break;
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawStar(cx, cy, outerRadius, innerRadius, points) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawJumpEffect(x, y) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 10, 20, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Add upward motion lines
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 20 + i * 5, y + 15);
            this.ctx.lineTo(x + 20 + i * 5, y + 25);
            this.ctx.stroke();
        }
    }

    drawSlideEffect(x, y) {
        this.ctx.strokeStyle = '#ff0080';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#ff0080';
        this.ctx.shadowBlur = 8;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - 10 - i * 15, y);
            this.ctx.lineTo(x + 10 - i * 15, y - 10);
            this.ctx.stroke();
        }
        this.ctx.shadowBlur = 0;
    }

    drawObstacle(obstacle) {
        const { x, y, width, height, type } = obstacle;
        
        // Obstacle shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width/2, this.canvas.height - 80, width/2, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Obstacle body
        this.ctx.fillStyle = obstacle.color || '#ff4444';
        this.ctx.shadowColor = obstacle.color || '#ff4444';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.shadowBlur = 0;
        
        // Obstacle glow effect
        this.ctx.strokeStyle = obstacle.color || '#ff4444';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
        
        // Type-specific details
        if (type === 'trash') {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x + 5, y + 5, width - 10, height - 10);
            // Add trash can lid
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(x + 2, y, width - 4, 8);
        } else if (type === 'sign') {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText('!', x + width/2, y + height/2);
            this.ctx.shadowBlur = 0;
        } else if (type === 'cone') {
            // Draw cone shape
            this.ctx.fillStyle = '#ff6600';
            this.ctx.beginPath();
            this.ctx.moveTo(x + width/2, y);
            this.ctx.lineTo(x, y + height);
            this.ctx.lineTo(x + width, y + height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add white stripe
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 5, y + height/2, width - 10, 6);
        }
    }

    addDustParticle(x, y) {
        this.particles.push({
            x: x + Math.random() * 20 - 10,
            y: y + Math.random() * 10,
            vx: -2 - Math.random() * 3,
            vy: -1 - Math.random() * 2,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: 2 + Math.random() * 3,
            color: 'rgba(255, 255, 255, 0.6)'
        });
    }

    addCollisionEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                decay: 0.05,
                size: 3 + Math.random() * 5,
                color: this.getRandomNeonColor(0.8)
            });
        }
    }

    updateAndDrawParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            if (particle.life > 0) {
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                this.ctx.globalAlpha = 1;
                return true;
            }
            return false;
        });
    }

    drawSpeedBlur(speed) {
        if (speed > 1.5) {
            const intensity = Math.min((speed - 1.5) / 2, 0.3);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
            
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                this.ctx.fillRect(x, y, 100, 2);
            }
        }
    }
}