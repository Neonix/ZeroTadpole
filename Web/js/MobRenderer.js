/**
 * ZeroTadpole - Advanced Mob Renderer
 * Système de rendu avancé pour requins, mobs élites et animations de mort
 */

(function() {
    'use strict';

    // ============================================
    // MOB DEFINITIONS
    // ============================================
    
    const MOB_VISUALS = {
        // Petit crabe - design mignon
        'crab_small': {
            bodyColor: '#ff6b6b',
            secondaryColor: '#ff4757',
            eyeColor: '#ffffff',
            pupilColor: '#1a1a2e',
            render: renderCrab,
            deathAnimation: 'sink',
            deathDuration: 1200
        },
        
        // Méduse - translucide et flottante
        'jellyfish': {
            bodyColor: 'rgba(255, 158, 234, 0.7)',
            secondaryColor: 'rgba(186, 137, 255, 0.5)',
            glowColor: 'rgba(255, 200, 255, 0.4)',
            render: renderJellyfish,
            deathAnimation: 'dissolve',
            deathDuration: 1500
        },
        
        // Requin juvénile - design détaillé
        'shark_mini': {
            bodyColor: '#4a6fa5',
            bellyColor: '#a8c8e8',
            finColor: '#3a5f8a',
            eyeColor: '#0d1117',
            render: renderShark,
            deathAnimation: 'floatUp',
            deathDuration: 2000
        },
        
        // Poulpe boss - tentacules animées
        'octopus_boss': {
            bodyColor: '#9b59b6',
            tentacleColor: '#7d3c98',
            eyeColor: '#f1c40f',
            pupilColor: '#1a1a2e',
            render: renderOctopus,
            deathAnimation: 'explode',
            deathDuration: 2500
        },
        
        // Léviathan - boss épique
        'leviathan': {
            bodyColor: '#e74c3c',
            scaleColor: '#c0392b',
            finColor: '#922b21',
            eyeColor: '#f39c12',
            glowColor: 'rgba(231, 76, 60, 0.3)',
            render: renderLeviathan,
            deathAnimation: 'vaporize',
            deathDuration: 3000
        }
    };

    // ============================================
    // DEATH ANIMATIONS
    // ============================================
    
    const deathAnimations = [];
    
    class DeathAnimation {
        constructor(mob, type, duration) {
            this.mob = { ...mob };
            this.type = type;
            this.duration = duration;
            this.startTime = Date.now();
            this.x = mob.x;
            this.y = mob.y;
            this.size = mob.size;
            this.angle = mob.angle || 0;
            this.particles = [];
            
            // Générer les particules pour certains types
            if (type === 'explode' || type === 'vaporize') {
                this.generateParticles();
            }
        }
        
        generateParticles() {
            const count = this.type === 'vaporize' ? 40 : 20;
            const color = MOB_VISUALS[this.mob.mobType]?.bodyColor || '#ff6b6b';
            
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
                const speed = 2 + Math.random() * 4;
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4,
                    color: color,
                    alpha: 1,
                    rotation: Math.random() * Math.PI * 2
                });
            }
        }
        
        getProgress() {
            return Math.min(1, (Date.now() - this.startTime) / this.duration);
        }
        
        isComplete() {
            return this.getProgress() >= 1;
        }
        
        update() {
            const progress = this.getProgress();
            
            // Mettre à jour les particules
            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravité légère
                p.alpha = 1 - progress;
                p.rotation += 0.1;
            }
        }
        
        draw(context) {
            const progress = this.getProgress();
            
            switch (this.type) {
                case 'sink':
                    this.drawSink(context, progress);
                    break;
                case 'dissolve':
                    this.drawDissolve(context, progress);
                    break;
                case 'floatUp':
                    this.drawFloatUp(context, progress);
                    break;
                case 'explode':
                    this.drawExplode(context, progress);
                    break;
                case 'vaporize':
                    this.drawVaporize(context, progress);
                    break;
                default:
                    this.drawFade(context, progress);
            }
        }
        
        drawSink(context, progress) {
            const alpha = 1 - progress;
            const y = this.y + progress * 30;
            const scale = 1 - progress * 0.5;
            
            context.save();
            context.globalAlpha = alpha;
            context.translate(this.x, y);
            context.scale(scale, scale);
            context.rotate(progress * 0.5);
            
            // Cercles qui s'enfoncent
            context.beginPath();
            context.fillStyle = MOB_VISUALS[this.mob.mobType]?.bodyColor || '#ff6b6b';
            context.arc(0, 0, this.size, 0, Math.PI * 2);
            context.fill();
            
            // Bulles qui remontent
            for (let i = 0; i < 5; i++) {
                const bubbleProgress = (progress + i * 0.1) % 1;
                const bubbleY = -bubbleProgress * 40;
                const bubbleX = Math.sin(bubbleProgress * Math.PI * 3) * 10;
                
                context.beginPath();
                context.fillStyle = `rgba(255, 255, 255, ${0.5 - bubbleProgress * 0.5})`;
                context.arc(bubbleX, bubbleY, 2 + i, 0, Math.PI * 2);
                context.fill();
            }
            
            context.restore();
        }
        
        drawDissolve(context, progress) {
            const alpha = 1 - progress;
            
            // Fragments qui se dispersent
            const fragments = 12;
            for (let i = 0; i < fragments; i++) {
                const angle = (Math.PI * 2 / fragments) * i;
                const distance = progress * 30;
                const fragX = this.x + Math.cos(angle) * distance;
                const fragY = this.y + Math.sin(angle) * distance;
                const fragSize = this.size / 3 * (1 - progress);
                
                context.beginPath();
                context.fillStyle = `rgba(255, 158, 234, ${alpha})`;
                context.arc(fragX, fragY, fragSize, 0, Math.PI * 2);
                context.fill();
            }
            
            // Lueur centrale
            const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * (1 + progress));
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(186, 137, 255, 0)`);
            
            context.beginPath();
            context.fillStyle = gradient;
            context.arc(this.x, this.y, this.size * (1 + progress), 0, Math.PI * 2);
            context.fill();
        }
        
        drawFloatUp(context, progress) {
            const alpha = 1 - progress;
            const y = this.y - progress * 50;
            const rotation = progress * Math.PI;
            
            context.save();
            context.globalAlpha = alpha;
            context.translate(this.x, y);
            context.rotate(rotation);
            
            // Corps du requin qui flotte
            renderSharkSilhouette(context, 0, 0, this.size, this.angle);
            
            // Bulles
            for (let i = 0; i < 8; i++) {
                const bubblePhase = (progress * 3 + i * 0.3) % 1;
                const bubbleX = (Math.random() - 0.5) * this.size * 2;
                const bubbleY = this.size + bubblePhase * 40;
                
                context.beginPath();
                context.fillStyle = `rgba(200, 230, 255, ${0.6 - bubblePhase * 0.6})`;
                context.arc(bubbleX, bubbleY, 1.5 + Math.random() * 2, 0, Math.PI * 2);
                context.fill();
            }
            
            context.restore();
        }
        
        drawExplode(context, progress) {
            // Dessiner les particules
            for (const p of this.particles) {
                context.save();
                context.globalAlpha = p.alpha;
                context.translate(p.x, p.y);
                context.rotate(p.rotation);
                
                // Fragment de tentacule
                context.beginPath();
                context.fillStyle = p.color;
                context.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                context.fill();
                
                context.restore();
            }
            
            // Onde de choc
            if (progress < 0.5) {
                const shockProgress = progress * 2;
                const shockRadius = this.size + shockProgress * 60;
                
                context.beginPath();
                context.strokeStyle = `rgba(155, 89, 182, ${1 - shockProgress})`;
                context.lineWidth = 3 - shockProgress * 2;
                context.arc(this.x, this.y, shockRadius, 0, Math.PI * 2);
                context.stroke();
            }
        }
        
        drawVaporize(context, progress) {
            // Particules de vapeur ascendantes
            for (const p of this.particles) {
                p.vy -= 0.2; // Flotte vers le haut
                
                context.save();
                context.globalAlpha = p.alpha * (1 - progress);
                
                // Traînée de vapeur
                const gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                context.beginPath();
                context.fillStyle = gradient;
                context.arc(p.x, p.y, p.size * (1 + progress), 0, Math.PI * 2);
                context.fill();
                
                context.restore();
            }
            
            // Éclat central
            if (progress < 0.3) {
                const flashProgress = progress / 0.3;
                const flashRadius = this.size * 2 * flashProgress;
                
                const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, flashRadius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${1 - flashProgress})`);
                gradient.addColorStop(0.5, `rgba(231, 76, 60, ${0.5 - flashProgress * 0.5})`);
                gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
                
                context.beginPath();
                context.fillStyle = gradient;
                context.arc(this.x, this.y, flashRadius, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        drawFade(context, progress) {
            context.globalAlpha = 1 - progress;
            context.beginPath();
            context.fillStyle = MOB_VISUALS[this.mob.mobType]?.bodyColor || '#ff6b6b';
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1;
        }
    }

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    
    function renderCrab(context, mob, time) {
        const visual = MOB_VISUALS['crab_small'];
        const wobble = Math.sin(time * 0.008) * 0.1;
        const walk = Math.sin(time * 0.02) * 3;
        
        context.save();
        context.translate(mob.x, mob.y);
        context.rotate(mob.angle + wobble);
        
        // Corps ovale
        const bodyGradient = context.createRadialGradient(-2, -2, 0, 0, 0, mob.size);
        bodyGradient.addColorStop(0, '#ff8787');
        bodyGradient.addColorStop(1, visual.bodyColor);
        
        context.fillStyle = bodyGradient;
        context.beginPath();
        context.ellipse(0, 0, mob.size, mob.size * 0.7, 0, 0, Math.PI * 2);
        context.fill();
        
        // Pinces
        const pincerAngle = Math.sin(time * 0.01) * 0.2;
        
        [-1, 1].forEach(side => {
            context.save();
            context.translate(mob.size * 0.8 * side, 0);
            context.rotate(pincerAngle * side);
            
            // Bras de la pince
            context.fillStyle = visual.secondaryColor;
            context.beginPath();
            context.ellipse(mob.size * 0.3 * side, 0, mob.size * 0.4, mob.size * 0.25, 0, 0, Math.PI * 2);
            context.fill();
            
            // Partie de la pince
            context.beginPath();
            context.moveTo(mob.size * 0.5 * side, -mob.size * 0.2);
            context.lineTo(mob.size * 0.9 * side, -mob.size * 0.15);
            context.lineTo(mob.size * 0.7 * side, 0);
            context.lineTo(mob.size * 0.9 * side, mob.size * 0.15);
            context.lineTo(mob.size * 0.5 * side, mob.size * 0.2);
            context.closePath();
            context.fill();
            
            context.restore();
        });
        
        // Pattes
        for (let i = 0; i < 3; i++) {
            const legOffset = (i - 1) * mob.size * 0.5;
            const legWobble = Math.sin(time * 0.02 + i) * 3;
            
            [-1, 1].forEach(side => {
                context.strokeStyle = visual.secondaryColor;
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(mob.size * 0.3 * side, legOffset);
                context.lineTo(mob.size * 0.7 * side, legOffset + legWobble);
                context.lineTo(mob.size * 0.9 * side, legOffset + mob.size * 0.3 * side + legWobble);
                context.stroke();
            });
        }
        
        // Yeux sur tiges
        [-1, 1].forEach(side => {
            const eyeX = mob.size * 0.25 * side;
            const eyeY = -mob.size * 0.5;
            const eyeBounce = Math.sin(time * 0.01 + side) * 2;
            
            // Tige
            context.strokeStyle = visual.bodyColor;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(eyeX, -mob.size * 0.3);
            context.lineTo(eyeX, eyeY + eyeBounce);
            context.stroke();
            
            // Œil
            context.fillStyle = visual.eyeColor;
            context.beginPath();
            context.arc(eyeX, eyeY + eyeBounce - 3, 3, 0, Math.PI * 2);
            context.fill();
            
            context.fillStyle = visual.pupilColor;
            context.beginPath();
            context.arc(eyeX + 1, eyeY + eyeBounce - 3, 1.5, 0, Math.PI * 2);
            context.fill();
        });
        
        context.restore();
    }
    
    function renderJellyfish(context, mob, time) {
        const visual = MOB_VISUALS['jellyfish'];
        const pulse = Math.sin(time * 0.006) * 0.2;
        const float = Math.sin(time * 0.003) * 3;
        
        context.save();
        context.translate(mob.x, mob.y + float);
        
        // Lueur de fond
        const glowGradient = context.createRadialGradient(0, 0, 0, 0, 0, mob.size * 2);
        glowGradient.addColorStop(0, visual.glowColor);
        glowGradient.addColorStop(1, 'rgba(255, 200, 255, 0)');
        
        context.fillStyle = glowGradient;
        context.beginPath();
        context.arc(0, 0, mob.size * 2, 0, Math.PI * 2);
        context.fill();
        
        // Tentacules (dessiner d'abord)
        for (let i = 0; i < 8; i++) {
            const tentacleX = (i - 3.5) * mob.size * 0.25;
            const waveOffset = Math.sin(time * 0.008 + i * 0.5) * 8;
            
            context.strokeStyle = visual.secondaryColor;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(tentacleX, mob.size * 0.3);
            
            // Courbe ondulante
            for (let j = 1; j <= 4; j++) {
                const y = mob.size * 0.3 + j * mob.size * 0.4;
                const wave = Math.sin(time * 0.01 + i + j * 0.5) * (3 + j * 2);
                context.lineTo(tentacleX + wave, y);
            }
            context.stroke();
        }
        
        // Corps (dôme)
        const bodyGradient = context.createRadialGradient(0, -mob.size * 0.3, mob.size * 0.2, 0, 0, mob.size);
        bodyGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        bodyGradient.addColorStop(0.5, visual.bodyColor);
        bodyGradient.addColorStop(1, 'rgba(186, 137, 255, 0.3)');
        
        context.fillStyle = bodyGradient;
        context.beginPath();
        context.ellipse(0, 0, mob.size * (1 + pulse), mob.size * 0.7 * (1 - pulse * 0.5), 0, Math.PI, 0);
        context.quadraticCurveTo(mob.size, mob.size * 0.3, 0, mob.size * 0.4);
        context.quadraticCurveTo(-mob.size, mob.size * 0.3, -mob.size * (1 + pulse), 0);
        context.fill();
        
        // Motifs internes
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const radius = mob.size * (0.3 + i * 0.15);
            context.beginPath();
            context.arc(0, -mob.size * 0.1, radius, Math.PI * 1.2, Math.PI * 1.8);
            context.stroke();
        }
        
        context.restore();
    }
    
    function renderShark(context, mob, time) {
        const visual = MOB_VISUALS['shark_mini'];
        const swim = Math.sin(time * 0.01) * 0.1;
        const tailWag = Math.sin(time * 0.02) * 0.3;
        
        context.save();
        context.translate(mob.x, mob.y);
        context.rotate(mob.angle);
        
        // Corps principal - forme de requin réaliste
        const bodyLength = mob.size * 2.5;
        const bodyHeight = mob.size * 0.8;
        
        // Gradient du corps
        const bodyGradient = context.createLinearGradient(0, -bodyHeight, 0, bodyHeight);
        bodyGradient.addColorStop(0, visual.bodyColor);
        bodyGradient.addColorStop(0.4, visual.bodyColor);
        bodyGradient.addColorStop(0.5, visual.bellyColor);
        bodyGradient.addColorStop(1, visual.bellyColor);
        
        // Corps
        context.fillStyle = bodyGradient;
        context.beginPath();
        context.moveTo(-bodyLength * 0.5, 0); // Queue
        context.quadraticCurveTo(-bodyLength * 0.2, -bodyHeight, bodyLength * 0.1, -bodyHeight * 0.8);
        context.quadraticCurveTo(bodyLength * 0.4, -bodyHeight * 0.5, bodyLength * 0.5, 0); // Museau
        context.quadraticCurveTo(bodyLength * 0.4, bodyHeight * 0.5, bodyLength * 0.1, bodyHeight * 0.6);
        context.quadraticCurveTo(-bodyLength * 0.2, bodyHeight * 0.5, -bodyLength * 0.5, 0);
        context.closePath();
        context.fill();
        
        // Aileron dorsal
        context.save();
        context.translate(0, -bodyHeight * 0.8);
        context.rotate(swim);
        
        context.fillStyle = visual.finColor;
        context.beginPath();
        context.moveTo(-mob.size * 0.3, 0);
        context.lineTo(mob.size * 0.1, -mob.size * 0.8);
        context.quadraticCurveTo(mob.size * 0.2, -mob.size * 0.4, mob.size * 0.4, 0);
        context.closePath();
        context.fill();
        context.restore();
        
        // Nageoire pectorale
        context.fillStyle = visual.finColor;
        context.beginPath();
        context.moveTo(bodyLength * 0.05, bodyHeight * 0.3);
        context.quadraticCurveTo(bodyLength * 0.15, bodyHeight * 0.9, -bodyLength * 0.1, bodyHeight * 0.6);
        context.lineTo(bodyLength * 0.05, bodyHeight * 0.3);
        context.fill();
        
        // Queue (avec animation)
        context.save();
        context.translate(-bodyLength * 0.5, 0);
        context.rotate(tailWag);
        
        const tailGradient = context.createLinearGradient(0, 0, -mob.size * 0.8, 0);
        tailGradient.addColorStop(0, visual.finColor);
        tailGradient.addColorStop(1, 'rgba(58, 95, 138, 0.6)');
        
        context.fillStyle = tailGradient;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-mob.size * 0.8, -mob.size * 0.6);
        context.quadraticCurveTo(-mob.size * 0.5, 0, -mob.size * 0.8, mob.size * 0.5);
        context.closePath();
        context.fill();
        context.restore();
        
        // Branchies
        context.strokeStyle = 'rgba(30, 50, 80, 0.5)';
        context.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            context.beginPath();
            context.moveTo(bodyLength * 0.15 + i * 4, -bodyHeight * 0.3);
            context.lineTo(bodyLength * 0.12 + i * 4, bodyHeight * 0.1);
            context.stroke();
        }
        
        // Œil
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.ellipse(bodyLength * 0.3, -bodyHeight * 0.2, 4, 3, 0, 0, Math.PI * 2);
        context.fill();
        
        context.fillStyle = visual.eyeColor;
        context.beginPath();
        context.arc(bodyLength * 0.31, -bodyHeight * 0.2, 2, 0, Math.PI * 2);
        context.fill();
        
        // Bouche
        context.strokeStyle = 'rgba(20, 30, 50, 0.8)';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(bodyLength * 0.45, bodyHeight * 0.1);
        context.quadraticCurveTo(bodyLength * 0.35, bodyHeight * 0.25, bodyLength * 0.2, bodyHeight * 0.2);
        context.stroke();
        
        // Dents (visibles quand la bouche est ouverte)
        context.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const toothX = bodyLength * 0.42 - i * 4;
            const toothY = bodyHeight * 0.12 + Math.abs(i - 2) * 2;
            context.beginPath();
            context.moveTo(toothX, toothY);
            context.lineTo(toothX - 1, toothY + 3);
            context.lineTo(toothX + 1, toothY + 3);
            context.closePath();
            context.fill();
        }
        
        context.restore();
    }
    
    function renderSharkSilhouette(context, x, y, size, angle) {
        context.fillStyle = 'rgba(74, 111, 165, 0.5)';
        context.beginPath();
        context.save();
        context.translate(x, y);
        context.rotate(angle || 0);
        
        const bodyLength = size * 2.5;
        const bodyHeight = size * 0.8;
        
        context.moveTo(-bodyLength * 0.5, 0);
        context.quadraticCurveTo(-bodyLength * 0.2, -bodyHeight, bodyLength * 0.5, 0);
        context.quadraticCurveTo(-bodyLength * 0.2, bodyHeight, -bodyLength * 0.5, 0);
        context.fill();
        
        context.restore();
    }
    
    function renderOctopus(context, mob, time) {
        const visual = MOB_VISUALS['octopus_boss'];
        const pulse = Math.sin(time * 0.004) * 0.15;
        
        context.save();
        context.translate(mob.x, mob.y);
        
        // Tentacules (8)
        for (let i = 0; i < 8; i++) {
            const baseAngle = (Math.PI * 2 / 8) * i - Math.PI / 2;
            const wavePhase = time * 0.008 + i * 0.5;
            
            context.strokeStyle = visual.tentacleColor;
            context.lineWidth = 4;
            context.lineCap = 'round';
            context.beginPath();
            
            const startX = Math.cos(baseAngle) * mob.size * 0.6;
            const startY = Math.sin(baseAngle) * mob.size * 0.6;
            context.moveTo(startX, startY);
            
            // Segments ondulants
            let prevX = startX, prevY = startY;
            for (let j = 1; j <= 6; j++) {
                const segmentLength = mob.size * 0.4;
                const wave = Math.sin(wavePhase + j * 0.8) * (10 + j * 3);
                const angle = baseAngle + wave * 0.02;
                
                const x = prevX + Math.cos(angle) * segmentLength;
                const y = prevY + Math.sin(angle) * segmentLength + wave * 0.3;
                
                context.quadraticCurveTo(
                    (prevX + x) / 2 + wave * 0.2,
                    (prevY + y) / 2,
                    x, y
                );
                
                prevX = x;
                prevY = y;
            }
            context.stroke();
            
            // Ventouses
            context.fillStyle = 'rgba(200, 150, 220, 0.5)';
            let ventX = startX, ventY = startY;
            for (let j = 1; j <= 4; j++) {
                const wave = Math.sin(wavePhase + j * 0.8) * (10 + j * 3);
                ventX += Math.cos(baseAngle) * mob.size * 0.35;
                ventY += Math.sin(baseAngle) * mob.size * 0.35 + wave * 0.15;
                
                context.beginPath();
                context.arc(ventX, ventY, 2 + j * 0.3, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        // Corps (manteau)
        const bodyGradient = context.createRadialGradient(-5, -5, 0, 0, 0, mob.size * (1 + pulse));
        bodyGradient.addColorStop(0, '#c39bd3');
        bodyGradient.addColorStop(0.7, visual.bodyColor);
        bodyGradient.addColorStop(1, visual.tentacleColor);
        
        context.fillStyle = bodyGradient;
        context.beginPath();
        context.ellipse(0, 0, mob.size * (1 + pulse), mob.size * 1.2 * (1 - pulse * 0.3), 0, 0, Math.PI * 2);
        context.fill();
        
        // Yeux
        [-1, 1].forEach(side => {
            const eyeX = mob.size * 0.3 * side;
            const eyeY = -mob.size * 0.2;
            
            // Blanc de l'œil
            context.fillStyle = '#ffffff';
            context.beginPath();
            context.ellipse(eyeX, eyeY, mob.size * 0.25, mob.size * 0.3, 0, 0, Math.PI * 2);
            context.fill();
            
            // Iris
            const irisGradient = context.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, mob.size * 0.15);
            irisGradient.addColorStop(0, '#f39c12');
            irisGradient.addColorStop(1, visual.eyeColor);
            
            context.fillStyle = irisGradient;
            context.beginPath();
            context.arc(eyeX + side * 2, eyeY, mob.size * 0.15, 0, Math.PI * 2);
            context.fill();
            
            // Pupille
            context.fillStyle = visual.pupilColor;
            context.beginPath();
            context.ellipse(eyeX + side * 3, eyeY, mob.size * 0.06, mob.size * 0.1, 0, 0, Math.PI * 2);
            context.fill();
            
            // Reflet
            context.fillStyle = 'rgba(255, 255, 255, 0.7)';
            context.beginPath();
            context.arc(eyeX - 2, eyeY - 3, 2, 0, Math.PI * 2);
            context.fill();
        });
        
        context.restore();
    }
    
    function renderLeviathan(context, mob, time) {
        const visual = MOB_VISUALS['leviathan'];
        const breathe = Math.sin(time * 0.003) * 0.1;
        const undulate = Math.sin(time * 0.005);
        
        context.save();
        context.translate(mob.x, mob.y);
        context.rotate(mob.angle);
        
        // Aura de feu
        const auraGradient = context.createRadialGradient(0, 0, mob.size, 0, 0, mob.size * 2);
        auraGradient.addColorStop(0, visual.glowColor);
        auraGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
        
        context.fillStyle = auraGradient;
        context.beginPath();
        context.arc(0, 0, mob.size * 2, 0, Math.PI * 2);
        context.fill();
        
        // Corps serpentin
        const bodyLength = mob.size * 4;
        const segments = 12;
        
        for (let i = segments - 1; i >= 0; i--) {
            const progress = i / segments;
            const segmentSize = mob.size * (1 - progress * 0.6) * (1 + breathe);
            const segX = -progress * bodyLength + Math.sin(undulate + i * 0.5) * 10;
            const segY = Math.sin(undulate * 2 + i * 0.3) * 5;
            
            // Écailles
            const scaleGradient = context.createRadialGradient(segX, segY, 0, segX, segY, segmentSize);
            scaleGradient.addColorStop(0, visual.bodyColor);
            scaleGradient.addColorStop(0.7, visual.scaleColor);
            scaleGradient.addColorStop(1, visual.finColor);
            
            context.fillStyle = scaleGradient;
            context.beginPath();
            context.arc(segX, segY, segmentSize, 0, Math.PI * 2);
            context.fill();
            
            // Motif d'écailles
            if (i < segments - 2) {
                context.strokeStyle = 'rgba(100, 30, 20, 0.3)';
                context.lineWidth = 1;
                for (let j = 0; j < 3; j++) {
                    const scaleAngle = (Math.PI / 3) * j - Math.PI / 3;
                    context.beginPath();
                    context.arc(segX, segY, segmentSize * 0.7, scaleAngle, scaleAngle + 0.5);
                    context.stroke();
                }
            }
        }
        
        // Tête
        const headGradient = context.createRadialGradient(mob.size * 0.5, 0, 0, mob.size * 0.5, 0, mob.size * 1.5);
        headGradient.addColorStop(0, '#ff6b6b');
        headGradient.addColorStop(0.5, visual.bodyColor);
        headGradient.addColorStop(1, visual.scaleColor);
        
        context.fillStyle = headGradient;
        context.beginPath();
        context.ellipse(mob.size * 0.5, 0, mob.size * 1.5, mob.size * (1 + breathe), 0, 0, Math.PI * 2);
        context.fill();
        
        // Cornes
        [-1, 1].forEach(side => {
            context.fillStyle = visual.finColor;
            context.beginPath();
            context.moveTo(mob.size * 0.8, side * mob.size * 0.5);
            context.lineTo(mob.size * 1.5, side * mob.size * 1.2);
            context.lineTo(mob.size * 1.8, side * mob.size * 0.8);
            context.quadraticCurveTo(mob.size * 1.2, side * mob.size * 0.6, mob.size * 0.8, side * mob.size * 0.5);
            context.fill();
        });
        
        // Yeux ardents
        [-1, 1].forEach(side => {
            const eyeX = mob.size * 1.2;
            const eyeY = side * mob.size * 0.3;
            
            // Lueur de l'œil
            const eyeGlow = context.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, 8);
            eyeGlow.addColorStop(0, '#ffffff');
            eyeGlow.addColorStop(0.3, visual.eyeColor);
            eyeGlow.addColorStop(1, 'rgba(243, 156, 18, 0)');
            
            context.fillStyle = eyeGlow;
            context.beginPath();
            context.arc(eyeX, eyeY, 8, 0, Math.PI * 2);
            context.fill();
            
            // Pupille fendue
            context.fillStyle = '#1a1a2e';
            context.beginPath();
            context.ellipse(eyeX, eyeY, 2, 5, 0, 0, Math.PI * 2);
            context.fill();
        });
        
        // Gueule avec flammes
        const mouthOpen = Math.abs(Math.sin(time * 0.008)) * 0.5;
        
        context.fillStyle = '#2c0e0e';
        context.beginPath();
        context.ellipse(mob.size * 1.8, 0, mob.size * 0.4, mob.size * 0.3 * (1 + mouthOpen), 0, 0, Math.PI * 2);
        context.fill();
        
        // Flammes de la gueule
        if (mouthOpen > 0.2) {
            for (let i = 0; i < 5; i++) {
                const flamePhase = time * 0.02 + i;
                const flameHeight = 10 + Math.sin(flamePhase) * 8;
                const flameX = mob.size * 2 + i * 3;
                const flameY = Math.sin(flamePhase * 2) * 5;
                
                const flameGrad = context.createLinearGradient(flameX, flameY, flameX + flameHeight, flameY);
                flameGrad.addColorStop(0, '#ff6b35');
                flameGrad.addColorStop(0.5, '#f7dc6f');
                flameGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
                
                context.fillStyle = flameGrad;
                context.beginPath();
                context.moveTo(flameX, flameY - 3);
                context.quadraticCurveTo(flameX + flameHeight * 0.5, flameY - 6, flameX + flameHeight, flameY);
                context.quadraticCurveTo(flameX + flameHeight * 0.5, flameY + 6, flameX, flameY + 3);
                context.fill();
            }
        }
        
        // Crête dorsale
        context.fillStyle = visual.finColor;
        for (let i = 0; i < 8; i++) {
            const spineX = mob.size * 0.5 - i * mob.size * 0.4;
            const spineHeight = mob.size * 0.4 * (1 - i * 0.08);
            const waveY = Math.sin(undulate + i * 0.5) * 3;
            
            context.beginPath();
            context.moveTo(spineX - 5, -mob.size * (0.8 - i * 0.05) + waveY);
            context.lineTo(spineX, -mob.size * (0.8 - i * 0.05) - spineHeight + waveY);
            context.lineTo(spineX + 5, -mob.size * (0.8 - i * 0.05) + waveY);
            context.fill();
        }
        
        context.restore();
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    window.MobRenderer = {
        MOB_VISUALS,
        deathAnimations,
        
        render(context, mob, time) {
            const visual = MOB_VISUALS[mob.mobType];
            if (visual && visual.render) {
                visual.render(context, mob, time || Date.now());
            } else {
                // Fallback: cercle simple
                context.beginPath();
                const gradient = context.createRadialGradient(mob.x - 2, mob.y - 2, 1, mob.x, mob.y, mob.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, mob.color || '#ff6b6b');
                context.fillStyle = gradient;
                context.arc(mob.x, mob.y, mob.size, 0, Math.PI * 2);
                context.fill();
            }
        },
        
        startDeathAnimation(mob) {
            const visual = MOB_VISUALS[mob.mobType];
            const type = visual?.deathAnimation || 'fade';
            const duration = visual?.deathDuration || 1000;
            
            const anim = new DeathAnimation(mob, type, duration);
            deathAnimations.push(anim);
            
            return anim;
        },
        
        updateDeathAnimations() {
            for (let i = deathAnimations.length - 1; i >= 0; i--) {
                deathAnimations[i].update();
                if (deathAnimations[i].isComplete()) {
                    deathAnimations.splice(i, 1);
                }
            }
        },
        
        drawDeathAnimations(context) {
            for (const anim of deathAnimations) {
                anim.draw(context);
            }
        },
        
        hasDeathAnimations() {
            return deathAnimations.length > 0;
        }
    };

})();
