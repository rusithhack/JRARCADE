// StarComposer - Pure JavaScript Implementation
class StarComposer {
    constructor() {
        this.stars = [];
        this.selectedInstrument = 'synth';
        this.selectedColor = '#64ffda';
        this.isPlaying = false;
        this.isLoading = true;
        this.audioEngine = null;
        this.selectedStarId = null;
        this.editMode = false;
        this.starIdCounter = 0;
        this.playingStars = new Set();
        this.cameraPosition = 0;
        this.analyser = null;
        this.visualizerIntensity = 0;
        
        // History management
        this.history = [];
        this.historyIndex = -1;
        
        // Settings
        this.bpm = 120;
        this.musicalKey = 'C';
        this.musicalScale = 'pentatonic';
        this.playbackMode = 'linear';
        this.backgroundTheme = 'cosmic';
        
        // Game progress
        this.progress = {
            starsCreated: 0,
            constellationsPlayed: 0,
            constellationsSaved: 0,
            instrumentsUsed: new Set(),
            colorsUsed: new Set()
        };
        
        // Canvas references
        this.starCanvas = null;
        this.lineCanvas = null;
        this.visualizerCanvas = null;
        this.starfieldCanvas = null;
        
        // Starfield particles
        this.particles = [];
        this.nebulae = [];
        
        this.init();
    }
    
    async init() {
        this.loadProgress();
        this.setupCanvases();
        this.setupEventListeners();
        this.setupStarField();
        this.loadConstellationFromUrl();
        await this.initAudio();
        this.updateUI();
        this.hideLoading();
        this.startStarFieldAnimation();
    }
    
    setupCanvases() {
        this.starCanvas = document.getElementById('star-canvas');
        this.lineCanvas = document.getElementById('line-canvas');
        this.visualizerCanvas = document.getElementById('visualizer-canvas');
        this.starfieldCanvas = document.getElementById('starfield-canvas');
        
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }
    
    resizeCanvases() {
        // Resize main canvases
        const container = document.querySelector('.canvas-container');
        const rect = container.getBoundingClientRect();
        
        [this.starCanvas, this.lineCanvas, this.visualizerCanvas].forEach(canvas => {
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            const ctx = canvas.getContext('2d');
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        });
        
        // Resize starfield canvas
        this.starfieldCanvas.width = window.innerWidth;
        this.starfieldCanvas.height = window.innerHeight;
        
        this.drawStars();
        this.drawLines();
        this.initStarField();
    }
    
    setupEventListeners() {
        // Canvas click
        this.starCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Toolbar buttons
        document.getElementById('edit-btn').addEventListener('click', () => this.toggleEditMode());
        document.getElementById('delete-btn').addEventListener('click', () => this.deleteSelectedStar());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('save-btn').addEventListener('click', () => this.showModal('save-modal'));
        document.getElementById('load-btn').addEventListener('click', () => this.showModal('load-modal'));
        document.getElementById('share-btn').addEventListener('click', () => this.showShareModal());
        document.getElementById('play-btn').addEventListener('click', () => this.playConstellation());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopPlayback());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        
        // Header buttons
        document.getElementById('progress-btn').addEventListener('click', () => this.showProgressModal());
        document.getElementById('settings-btn').addEventListener('click', () => this.showModal('settings-modal'));
        
        // Selectors
        document.getElementById('instrument-select').addEventListener('change', (e) => {
            this.selectedInstrument = e.target.value;
        });
        
        document.getElementById('color-select').addEventListener('change', (e) => {
            this.selectedColor = e.target.value;
        });
        
        // Settings
        document.getElementById('bpm-slider').addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            document.getElementById('bpm-value').textContent = `${this.bpm} BPM`;
            this.updateMusicalInfo();
        });
        
        document.getElementById('key-select').addEventListener('change', (e) => {
            this.musicalKey = e.target.value;
            this.updateMusicalInfo();
        });
        
        document.getElementById('scale-select').addEventListener('change', (e) => {
            this.musicalScale = e.target.value;
            this.updateMusicalInfo();
        });
        
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.backgroundTheme = e.target.value;
            this.initStarField();
        });
        
        document.getElementById('playback-mode-select').addEventListener('change', (e) => {
            this.playbackMode = e.target.value;
            this.updateModeIndicators();
        });
        
        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.hideModal(modalId);
            });
        });
        
        // Save constellation
        document.getElementById('save-confirm-btn').addEventListener('click', () => this.saveConstellation());
        document.getElementById('constellation-name').addEventListener('input', (e) => {
            document.getElementById('save-confirm-btn').disabled = !e.target.value.trim();
        });
        
        // Share modal
        document.getElementById('copy-url-btn').addEventListener('click', () => this.copyShareUrl());
        document.getElementById('open-url-btn').addEventListener('click', () => this.openShareUrl());
        
        // Tooltips
        this.setupTooltips();
    }
    
    setupTooltips() {
        const tooltip = document.getElementById('tooltip');
        const tooltipContent = tooltip.querySelector('.tooltip-content');
        let tooltipTimeout;
        
        document.querySelectorAll('[title]').forEach(element => {
            const originalTitle = element.getAttribute('title');
            element.removeAttribute('title');
            
            element.addEventListener('mouseenter', () => {
                tooltipTimeout = setTimeout(() => {
                    tooltipContent.textContent = originalTitle;
                    this.showTooltip(tooltip, element);
                }, 500);
            });
            
            element.addEventListener('mouseleave', () => {
                clearTimeout(tooltipTimeout);
                this.hideTooltip(tooltip);
            });
        });
    }
    
    showTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Position tooltip above element by default
        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Adjust if tooltip goes off screen
        if (top < 10) {
            top = rect.bottom + 10;
            tooltip.className = 'tooltip bottom';
        } else {
            tooltip.className = 'tooltip top';
        }
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.classList.remove('hidden');
    }
    
    hideTooltip(tooltip) {
        tooltip.classList.add('hidden');
    }
    
    async initAudio() {
        if (typeof Tone === 'undefined') {
            console.error('Tone.js not loaded');
            return;
        }
        
        try {
            // Create analyser for visualizations
            this.analyser = new Tone.Analyser('waveform', 1024);
            
            // Enhanced effects chain
            const reverb = new Tone.Reverb({
                decay: 4,
                wet: 0.4
            }).toDestination();
            
            const delay = new Tone.FeedbackDelay({
                delayTime: '8n',
                feedback: 0.3,
                wet: 0.2
            }).connect(reverb);
            
            const chorus = new Tone.Chorus({
                frequency: 1.5,
                delayTime: 3.5,
                depth: 0.7,
                wet: 0.3
            }).connect(delay);
            
            // Connect analyser to the effects chain
            chorus.connect(this.analyser);
            
            this.audioEngine = {
                synth: new Tone.Synth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
                }).connect(chorus),
                amsynth: new Tone.AMSynth({
                    harmonicity: 2.5,
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 1.0 }
                }).connect(chorus),
                fmsynth: new Tone.FMSynth({
                    harmonicity: 3,
                    modulationIndex: 12,
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 1.0 }
                }).connect(chorus),
                pluck: new Tone.PluckSynth({
                    attackNoise: 1,
                    dampening: 4000,
                    resonance: 0.8
                }).connect(chorus)
            };
            
            await reverb.generate();
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }
    
    setupStarField() {
        this.initStarField();
    }
    
    initStarField() {
        const canvas = this.starfieldCanvas;
        const particleCount = Math.floor((canvas.width * canvas.height) / 12000);
        const colors = this.getThemeColors();
        
        this.particles = [];
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
        
        // Initialize nebulae for certain themes
        this.nebulae = [];
        if (this.backgroundTheme === 'nebula' || this.backgroundTheme === 'galaxy') {
            const nebulaCount = Math.floor((canvas.width * canvas.height) / 200000) + 2;
            
            for (let i = 0; i < nebulaCount; i++) {
                this.nebulae.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 300 + 200,
                    opacity: Math.random() * 0.1 + 0.05,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.001
                });
            }
        }
    }
    
    getThemeColors() {
        switch (this.backgroundTheme) {
            case 'nebula':
                return ['#ff6b9d', '#c44569', '#f8b500', '#ff3838', '#ff9ff3'];
            case 'galaxy':
                return ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'];
            case 'aurora':
                return ['#64ffda', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
            default:
                return ['#64ffda', '#ff6b9d', '#ffd93d', '#6bcf7f', '#a78bfa'];
        }
    }
    
    startStarFieldAnimation() {
        const animate = () => {
            this.animateStarField();
            if (this.isPlaying) {
                this.animateVisualizer();
            }
            requestAnimationFrame(animate);
        };
        animate();
        
        // Animate lines separately
        setInterval(() => this.drawLines(), 50);
    }
    
    animateStarField() {
        const canvas = this.starfieldCanvas;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw nebulae
        this.nebulae.forEach(nebula => {
            nebula.rotation += nebula.rotationSpeed;
            
            ctx.save();
            ctx.translate(nebula.x, nebula.y);
            ctx.rotate(nebula.rotation);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);
            gradient.addColorStop(0, nebula.color + Math.floor(nebula.opacity * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(0.5, nebula.color + '20');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-nebula.size, -nebula.size, nebula.size * 2, nebula.size * 2);
            ctx.restore();
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
            
            // Twinkle effect
            particle.opacity += (Math.random() - 0.5) * particle.twinkleSpeed;
            particle.opacity = Math.max(0.1, Math.min(1, particle.opacity));
            
            // Draw particle
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size * 3;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Cross sparkle for larger stars
            if (particle.size > 1.5 && particle.opacity > 0.7) {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 0.5;
                ctx.shadowBlur = particle.size * 2;
                
                ctx.beginPath();
                ctx.moveTo(particle.x - particle.size * 2, particle.y);
                ctx.lineTo(particle.x + particle.size * 2, particle.y);
                ctx.moveTo(particle.x, particle.y - particle.size * 2);
                ctx.lineTo(particle.x, particle.y + particle.size * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }
    
    animateVisualizer() {
        if (!this.analyser) return;
        
        const canvas = this.visualizerCanvas;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.visualizerIntensity > 0) {
            const waveform = this.analyser.getValue();
            const avgAmplitude = waveform.reduce((sum, val) => sum + Math.abs(val), 0) / waveform.length;
            const pulseIntensity = avgAmplitude * this.visualizerIntensity * 100;
            
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            
            gradient.addColorStop(0, `rgba(100, 255, 218, ${pulseIntensity * 0.1})`);
            gradient.addColorStop(0.5, `rgba(167, 139, 250, ${pulseIntensity * 0.05})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    loadConstellationFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const constellationData = urlParams.get('constellation');
        
        if (constellationData) {
            try {
                const decoded = atob(decodeURIComponent(constellationData));
                const data = JSON.parse(decoded);
                
                if (data.version === 1 && Array.isArray(data.stars)) {
                    this.stars = data.stars;
                    this.addToHistory(this.stars);
                    const maxId = Math.max(...this.stars.map(s => s.id), 0);
                    this.starIdCounter = maxId + 1;
                }
            } catch (error) {
                console.error('Failed to decode constellation from URL:', error);
            }
        }
    }
    
    handleCanvasClick(event) {
        const canvas = this.starCanvas;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if clicking on existing star
        const clickedStar = this.stars.find(star => {
            const distance = Math.sqrt((star.x - x) ** 2 + (star.y - y) ** 2);
            return distance <= 20;
        });
        
        if (clickedStar && this.editMode) {
            this.selectedStarId = this.selectedStarId === clickedStar.id ? null : clickedStar.id;
            this.updateUI();
            this.drawStars();
            return;
        }
        
        // Create new star
        const newStar = {
            x,
            y,
            color: this.selectedColor,
            instrument: this.selectedInstrument,
            id: this.starIdCounter++
        };
        
        this.stars.push(newStar);
        this.addToHistory([...this.stars]);
        
        // Track progress
        this.progress.starsCreated++;
        this.progress.instrumentsUsed.add(this.selectedInstrument);
        this.progress.colorsUsed.add(this.selectedColor);
        this.saveProgress();
        
        this.updateUI();
        this.createRippleEffect(x, y);
        this.drawStars();
    }
    
    createRippleEffect(x, y) {
        const canvas = this.starCanvas;
        const ctx = canvas.getContext('2d');
        
        let radius = 0;
        const maxRadius = 50;
        let opacity = 1;
        
        const animate = () => {
            if (radius < maxRadius) {
                ctx.strokeStyle = this.selectedColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = 3;
                ctx.shadowColor = this.selectedColor;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                
                radius += 3;
                opacity = 1 - (radius / maxRadius);
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    drawStars() {
        const canvas = this.starCanvas;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.stars.forEach(star => {
            const isPlaying = this.playingStars.has(star.id);
            const isSelected = star.id === this.selectedStarId;
            
            // Enhanced glow effect
            const cameraDistance = this.playbackMode === 'journey' && isPlaying ? 
                Math.abs(star.x - this.cameraPosition) : 0;
            const focusMultiplier = this.playbackMode === 'journey' && isPlaying ? 
                Math.max(0.5, 1 - cameraDistance / 200) : 1;
            
            const glowSize = (isPlaying ? 45 : isSelected ? 30 : 25) * focusMultiplier;
            const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
            
            if (isPlaying) {
                gradient.addColorStop(0, star.color);
                gradient.addColorStop(0.2, star.color + 'DD');
                gradient.addColorStop(0.5, star.color + '88');
                gradient.addColorStop(1, 'transparent');
            } else {
                gradient.addColorStop(0, star.color);
                gradient.addColorStop(0.3, star.color + (isSelected ? 'BB' : '90'));
                gradient.addColorStop(1, 'transparent');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(star.x - glowSize, star.y - glowSize, glowSize * 2, glowSize * 2);
            
            // Selection ring
            if (isSelected) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(star.x, star.y, 18, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Star core
            const coreSize = (isPlaying ? 6 : isSelected ? 5 : 4) * focusMultiplier;
            ctx.fillStyle = star.color;
            ctx.shadowColor = star.color;
            ctx.shadowBlur = isPlaying ? 25 : isSelected ? 18 : 12;
            ctx.beginPath();
            ctx.arc(star.x, star.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Sparkle effect
            if (isPlaying) {
                const sparkleCount = 8;
                for (let i = 0; i < sparkleCount; i++) {
                    const angle = (i / sparkleCount) * Math.PI * 2 + Date.now() * 0.005;
                    const sparkleDistance = 15 * focusMultiplier;
                    const sparkleX = star.x + Math.cos(angle) * sparkleDistance;
                    const sparkleY = star.y + Math.sin(angle) * sparkleDistance;
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
            }
        });
    }
    
    drawLines() {
        const canvas = this.lineCanvas;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.stars.length < 2) return;
        
        // Draw constellation lines
        for (let i = 0; i < this.stars.length - 1; i++) {
            const star1 = this.stars[i];
            const star2 = this.stars[i + 1];
            
            const gradient = ctx.createLinearGradient(star1.x, star1.y, star2.x, star2.y);
            gradient.addColorStop(0, star1.color + '90');
            gradient.addColorStop(0.5, '#ffffff60');
            gradient.addColorStop(1, star2.color + '90');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#64ffda';
            ctx.shadowBlur = 12;
            
            // Animated flow effect
            const time = Date.now() * 0.003;
            const flowOffset = (time + i * 0.5) % 20;
            ctx.setLineDash([10, 10]);
            ctx.lineDashOffset = flowOffset;
            
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
        }
    }
    
    async playConstellation() {
        if (!this.audioEngine || this.stars.length === 0) return;
        
        try {
            await Tone.start();
            this.isPlaying = true;
            this.playingStars.clear();
            this.cameraPosition = 0;
            
            const sortedStars = [...this.stars].sort((a, b) => a.x - b.x);
            const canvas = this.starCanvas;
            const rect = canvas.getBoundingClientRect();
            const totalDuration = (60 / this.bpm) * 4;
            
            this.visualizerIntensity = Math.min(this.stars.length / 20, 1);
            
            sortedStars.forEach((star, index) => {
                const time = (star.x / rect.width) * totalDuration;
                const normalizedY = star.y / rect.height;
                const note = this.quantizeToScale(normalizedY);
                
                const instrument = this.audioEngine[star.instrument] || this.audioEngine.synth;
                
                Tone.Transport.schedule(() => {
                    this.playingStars.add(star.id);
                    
                    if (this.playbackMode === 'journey') {
                        this.cameraPosition = star.x;
                    }
                    
                    instrument.triggerAttackRelease(note, '8n');
                    this.drawStars();
                    
                    setTimeout(() => {
                        this.playingStars.delete(star.id);
                        this.drawStars();
                    }, 300);
                }, `+${time}`);
            });
            
            Tone.Transport.bpm.value = this.bpm;
            Tone.Transport.start();
            
            this.progress.constellationsPlayed++;
            this.saveProgress();
            this.updateUI();
            
            setTimeout(() => {
                this.stopPlayback();
            }, totalDuration * 1000 + 1000);
        } catch (error) {
            console.error('Playback error:', error);
            this.isPlaying = false;
            this.updateUI();
        }
    }
    
    stopPlayback() {
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }
        this.playingStars.clear();
        this.isPlaying = false;
        this.visualizerIntensity = 0;
        this.cameraPosition = 0;
        this.updateUI();
        this.drawStars();
    }
    
    quantizeToScale(normalizedY) {
        const scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            blues: [0, 3, 5, 6, 7, 10],
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        };
        
        const keyOffsets = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const scaleIntervals = scales[this.musicalScale];
        const keyOffset = keyOffsets[this.musicalKey];
        const notes = [];
        
        for (let octave = 3; octave <= 6; octave++) {
            scaleIntervals.forEach(interval => {
                const noteIndex = (keyOffset + interval) % 12;
                const noteName = noteNames[noteIndex];
                notes.push(`${noteName}${octave}`);
            });
        }
        
        const noteIndex = Math.floor((1 - normalizedY) * notes.length);
        return notes[Math.max(0, Math.min(noteIndex, notes.length - 1))];
    }
    
    toggleEditMode() {
        this.editMode = !this.editMode;
        if (!this.editMode) {
            this.selectedStarId = null;
        }
        this.updateUI();
        this.updateModeIndicators();
        this.drawStars();
    }
    
    deleteSelectedStar() {
        if (this.selectedStarId !== null) {
            this.stars = this.stars.filter(star => star.id !== this.selectedStarId);
            this.addToHistory([...this.stars]);
            this.selectedStarId = null;
            this.updateUI();
            this.drawStars();
        }
    }
    
    addToHistory(newStars) {
        const newHistory = this.history.slice(0, this.historyIndex + 1);
        newHistory.push([...newStars]);
        this.history = newHistory;
        this.historyIndex = newHistory.length - 1;
        this.updateUI();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.stars = [...this.history[this.historyIndex]];
            this.updateUI();
            this.drawStars();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.stars = [...this.history[this.historyIndex]];
            this.updateUI();
            this.drawStars();
        }
    }
    
    clearCanvas() {
        this.stars = [];
        this.addToHistory([]);
        this.selectedStarId = null;
        this.stopPlayback();
        this.updateUI();
        this.drawStars();
    }
    
    updateUI() {
        // Update button states
        document.getElementById('edit-btn').classList.toggle('active', this.editMode);
        document.getElementById('delete-btn').classList.toggle('hidden', !this.selectedStarId);
        document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
        document.getElementById('redo-btn').disabled = this.historyIndex >= this.history.length - 1;
        document.getElementById('save-btn').disabled = this.stars.length === 0;
        document.getElementById('share-btn').disabled = this.stars.length === 0;
        document.getElementById('play-btn').disabled = this.isPlaying || this.stars.length === 0;
        document.getElementById('stop-btn').disabled = !this.isPlaying;
        
        // Update star count
        document.getElementById('star-count').textContent = `${this.stars.length} stars`;
        document.getElementById('stars-created-count').textContent = this.progress.starsCreated;
        
        // Update unlocked instruments and colors
        this.updateUnlockedOptions();
    }
    
    updateUnlockedOptions() {
        const instrumentSelect = document.getElementById('instrument-select');
        const colorSelect = document.getElementById('color-select');
        
        // Update instruments
        const unlockedInstruments = this.getUnlockedInstruments();
        Array.from(instrumentSelect.options).forEach(option => {
            if (unlockedInstruments.includes(option.value)) {
                option.disabled = false;
                option.textContent = option.textContent.replace('🔒 ', '');
            }
        });
        
        // Update colors
        const unlockedColors = this.getUnlockedColors();
        Array.from(colorSelect.options).forEach(option => {
            if (unlockedColors.includes(option.value)) {
                option.disabled = false;
                option.textContent = option.textContent.replace('🔒 ', '');
            }
        });
    }
    
    getUnlockedInstruments() {
        const base = ['synth'];
        if (this.progress.starsCreated >= 5) base.push('amsynth');
        if (this.progress.starsCreated >= 15) base.push('fmsynth');
        if (this.progress.starsCreated >= 30) base.push('pluck');
        return base;
    }
    
    getUnlockedColors() {
        const base = ['#64ffda'];
        if (this.progress.constellationsPlayed >= 2) base.push('#ff6b9d');
        if (this.progress.constellationsPlayed >= 5) base.push('#ffd93d');
        if (this.progress.constellationsPlayed >= 8) base.push('#6bcf7f');
        if (this.progress.constellationsPlayed >= 12) base.push('#a78bfa');
        return base;
    }
    
    updateMusicalInfo() {
        document.getElementById('musical-key-scale').textContent = `${this.musicalKey} ${this.musicalScale}`;
        document.getElementById('bpm-display').textContent = `${this.bpm} BPM`;
    }
    
    updateModeIndicators() {
        document.getElementById('edit-mode-indicator').classList.toggle('hidden', !this.editMode);
        document.getElementById('journey-mode-indicator').classList.toggle('hidden', this.playbackMode !== 'journey');
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        
        if (modalId === 'load-modal') {
            this.populateLoadModal();
        }
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        
        if (modalId === 'save-modal') {
            document.getElementById('constellation-name').value = '';
            document.getElementById('save-confirm-btn').disabled = true;
        }
    }
    
    showProgressModal() {
        this.populateProgressModal();
        this.showModal('progress-modal');
    }
    
    populateProgressModal() {
        const achievements = this.getAchievements();
        const list = document.getElementById('achievements-list');
        
        list.innerHTML = achievements.map(achievement => `
            <div class="achievement ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-header">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                    ${achievement.unlocked ? '<div class="achievement-check">✓</div>' : ''}
                </div>
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${(achievement.progress / achievement.maxProgress) * 100}%"></div>
                </div>
                <div class="achievement-progress-text">${achievement.progress}/${achievement.maxProgress}</div>
            </div>
        `).join('');
    }
    
    getAchievements() {
        return [
            {
                id: 'first_star',
                name: 'First Light',
                description: 'Create your first star',
                icon: '⭐',
                unlocked: this.progress.starsCreated >= 1,
                progress: Math.min(this.progress.starsCreated, 1),
                maxProgress: 1
            },
            {
                id: 'constellation_master',
                name: 'Constellation Master',
                description: 'Create 50 stars',
                icon: '🌟',
                unlocked: this.progress.starsCreated >= 50,
                progress: Math.min(this.progress.starsCreated, 50),
                maxProgress: 50
            },
            {
                id: 'composer',
                name: 'Cosmic Composer',
                description: 'Play 10 constellations',
                icon: '🎵',
                unlocked: this.progress.constellationsPlayed >= 10,
                progress: Math.min(this.progress.constellationsPlayed, 10),
                maxProgress: 10
            },
            {
                id: 'collector',
                name: 'Star Collector',
                description: 'Save 5 constellations',
                icon: '🏆',
                unlocked: this.progress.constellationsSaved >= 5,
                progress: Math.min(this.progress.constellationsSaved, 5),
                maxProgress: 5
            },
            {
                id: 'artist',
                name: 'Cosmic Artist',
                description: 'Use all instrument types',
                icon: '🎨',
                unlocked: this.progress.instrumentsUsed.size >= 4,
                progress: this.progress.instrumentsUsed.size,
                maxProgress: 4
            }
        ];
    }
    
    saveConstellation() {
        const name = document.getElementById('constellation-name').value.trim();
        if (!name) return;
        
        const constellation = {
            name,
            stars: [...this.stars],
            createdAt: new Date().toISOString()
        };
        
        const saved = this.getSavedConstellations();
        const updated = saved.filter(c => c.name !== name);
        updated.push(constellation);
        
        localStorage.setItem('starcomposer_constellations', JSON.stringify(updated));
        
        this.progress.constellationsSaved++;
        this.saveProgress();
        
        this.hideModal('save-modal');
        this.updateUI();
    }
    
    populateLoadModal() {
        const saved = this.getSavedConstellations();
        const list = document.getElementById('saved-constellations-list');
        
        if (saved.length === 0) {
            list.innerHTML = '<p class="no-constellations">No saved constellations yet.</p>';
            return;
        }
        
        list.innerHTML = saved.map(constellation => `
            <div class="constellation-item">
                <div class="constellation-info">
                    <div class="constellation-name">${constellation.name}</div>
                    <div class="constellation-details">
                        ${constellation.stars.length} stars • ${new Date(constellation.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="constellation-actions">
                    <button class="constellation-load-btn" onclick="starComposer.loadConstellation('${constellation.name}')">
                        Load
                    </button>
                    <button class="constellation-delete-btn" onclick="starComposer.deleteConstellation('${constellation.name}')">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    loadConstellation(name) {
        const saved = this.getSavedConstellations();
        const constellation = saved.find(c => c.name === name);
        
        if (constellation) {
            this.stars = [...constellation.stars];
            this.addToHistory(this.stars);
            this.selectedStarId = null;
            
            const maxId = Math.max(...this.stars.map(s => s.id), 0);
            this.starIdCounter = maxId + 1;
            
            this.updateUI();
            this.drawStars();
            this.hideModal('load-modal');
        }
    }
    
    deleteConstellation(name) {
        const saved = this.getSavedConstellations();
        const updated = saved.filter(c => c.name !== name);
        localStorage.setItem('starcomposer_constellations', JSON.stringify(updated));
        this.populateLoadModal();
    }
    
    getSavedConstellations() {
        try {
            const saved = localStorage.getItem('starcomposer_constellations');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load constellations:', error);
            return [];
        }
    }
    
    showShareModal() {
        const shareUrl = this.generateShareUrl();
        document.getElementById('share-url').textContent = shareUrl;
        this.showModal('share-modal');
    }
    
    generateShareUrl() {
        const data = {
            stars: this.stars.map(star => ({
                x: Math.round(star.x * 1000) / 1000,
                y: Math.round(star.y * 1000) / 1000,
                color: star.color,
                instrument: star.instrument,
                id: star.id
            })),
            version: 1
        };
        
        const compressed = btoa(JSON.stringify(data));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?constellation=${encodeURIComponent(compressed)}`;
    }
    
    async copyShareUrl() {
        const shareUrl = document.getElementById('share-url').textContent;
        const button = document.getElementById('copy-url-btn');
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            button.innerHTML = '<span class="icon">✓</span> Copied!';
            setTimeout(() => {
                button.innerHTML = '<span class="icon">📋</span> Copy Link';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }
    
    openShareUrl() {
        const shareUrl = document.getElementById('share-url').textContent;
        window.open(shareUrl, '_blank');
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('starcomposer_progress');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.progress = {
                    ...parsed,
                    instrumentsUsed: new Set(parsed.instrumentsUsed || []),
                    colorsUsed: new Set(parsed.colorsUsed || [])
                };
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }
    
    saveProgress() {
        const toSave = {
            ...this.progress,
            instrumentsUsed: Array.from(this.progress.instrumentsUsed),
            colorsUsed: Array.from(this.progress.colorsUsed)
        };
        localStorage.setItem('starcomposer_progress', JSON.stringify(toSave));
    }
    
    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }
}

// Initialize the application
let starComposer;
document.addEventListener('DOMContentLoaded', () => {
    starComposer = new StarComposer();
});

// Make functions available globally for onclick handlers
window.starComposer = starComposer;