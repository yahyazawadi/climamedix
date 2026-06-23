import { useEffect, useRef } from 'preact/hooks';

export function InteractiveParticles() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = canvas.width = containerRef.current.clientWidth;
    let height = canvas.height = containerRef.current.clientHeight;

    const handleResize = () => {
      if (containerRef.current) {
        width = canvas.width = containerRef.current.clientWidth;
        height = canvas.height = containerRef.current.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    const particles = [];
    const particleCount = 80;
    const colorTemplates = [
      { r: 21, g: 180, b: 122, baseAlpha: 0.65 }, // Mint Green
      { r: 11, g: 40, b: 73, baseAlpha: 0.45 },   // Navy Blue
      { r: 2, g: 90, b: 110, baseAlpha: 0.55 },   // Deep Teal Blue
      { r: 21, g: 180, b: 122, baseAlpha: 0.35 }  // Soft Mint
    ];

    const mouse = {
      x: null,
      y: null,
      radius: 160 // attraction radius
    };

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const template = colorTemplates[Math.floor(Math.random() * colorTemplates.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 4 + 1.5,
        r: template.r,
        g: template.g,
        b: template.b,
        baseAlpha: template.baseAlpha,
        alpha: 0.0, // starts invisible and fades in gradually
        isDespawning: false,
        originalVx: 0,
        originalVy: 0
      });
      // Store original velocity
      particles[i].originalVx = particles[i].vx;
      particles[i].originalVy = particles[i].vy;
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Pre-calculate neighbor counts within 50px to identify clusters
      const neighborCounts = new Array(particles.length).fill(0);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 50) {
            neighborCounts[i]++;
            neighborCounts[j]++;
          }
        }
      }

      // 2. Draw connection lines (with cluster-based connection blocking)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // If either node is in a cluster (> 4 neighbors), restrict connection distance heavily to block new connections
          const isCrowded = neighborCounts[i] > 4 || neighborCounts[j] > 4;
          const maxConnectionDist = isCrowded ? 25 : 75;

          if (dist < maxConnectionDist) {
            ctx.beginPath();
            // Lines fade dynamically as connection points fade out
            const combinedAlpha = 0.38 * (1 - dist / maxConnectionDist) * particles[i].alpha * particles[j].alpha;
            ctx.strokeStyle = `rgba(21, 180, 122, ${combinedAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Calculate distances to mouse for all particles
      let mouseInteractions = [];
      if (mouse.x !== null && mouse.y !== null) {
        particles.forEach((p, idx) => {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            mouseInteractions.push({ idx, dist, dx, dy });
          }
        });
        
        // Sort by distance (closest first)
        mouseInteractions.sort((a, b) => a.dist - b.dist);
      }

      // We only allow the closest 15 particles to be attracted/heavy
      const activeLimit = 15;
      const attractedIndices = new Set(
        mouseInteractions.slice(0, activeLimit).map(item => item.idx)
      );

      // 3. Particle-to-particle repulsion with cluster dispersion
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // If either node is crowded (> 4 neighbors), expand range and push gently to disperse
          const isCrowded = neighborCounts[i] > 4 || neighborCounts[j] > 4;
          const minDistance = isCrowded ? 32 : 22;
          const forceFactor = isCrowded ? 0.32 : 0.25;

          if (dist < minDistance) {
            const force = (minDistance - dist) / minDistance;
            const pushX = (dx / (dist || 1)) * force * forceFactor;
            const pushY = (dy / (dist || 1)) * force * forceFactor;

            particles[i].vx -= pushX;
            particles[i].vy -= pushY;
            particles[j].vx += pushX;
            particles[j].vy += pushY;
          }
        }
      }

      // Update and draw particles
      particles.forEach((p, idx) => {
        // 3. Dynamic entropy movement (Brownian noise) - crowded particles shake gently to break clusters
        const isCrowded = neighborCounts[idx] > 4;
        const crowdAgitation = isCrowded ? 0.07 : 0.05;
        p.vx += (Math.random() - 0.5) * crowdAgitation;
        p.vy += (Math.random() - 0.5) * crowdAgitation;

        // Cap speed of free floating particles (allow crowded nodes to move slightly faster to disperse)
        const maxSpeed = isCrowded ? 1.35 : 1.2;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > maxSpeed && !attractedIndices.has(idx)) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx;
        p.y += p.vy;

        // 1. Unfavorable border zone (gentle center-seeking nudge near the edges)
        const borderZone = 60;
        const nudgeStrength = 0.03;

        if (p.x < borderZone) {
          p.vx += (1 - p.x / borderZone) * nudgeStrength;
        } else if (p.x > width - borderZone) {
          p.vx -= (1 - (width - p.x) / borderZone) * nudgeStrength;
        }

        if (p.y < borderZone) {
          p.vy += (1 - p.y / borderZone) * nudgeStrength;
        } else if (p.y > height - borderZone) {
          p.vy -= (1 - (height - p.y) / borderZone) * nudgeStrength;
        }

        // 2. Off-screen recycling & random entropy
        let shouldRespawn = false;
        const margin = 5;

        if (p.x < -margin || p.x > width + margin || p.y < -margin || p.y > height + margin) {
          shouldRespawn = true;
        }

        // 0.03% chance per frame for calming, noticeable node renewal
        if (Math.random() < 0.0003) {
          shouldRespawn = true;
        }

        // Only queue for despawn if it is not currently held by the mouse
        if (shouldRespawn && !attractedIndices.has(idx) && !p.isDespawning) {
          p.isDespawning = true;
        }

        // Handle gradual opacity fade transitions (fade out / fade in)
        if (p.isDespawning) {
          p.alpha -= 0.02; // slow fade-out over ~50 frames
          if (p.alpha <= 0) {
            p.alpha = 0;
            // Teleport and reset once fully invisible
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.vx = (Math.random() - 0.5) * 0.8;
            p.vy = (Math.random() - 0.5) * 0.8;
            p.originalVx = p.vx;
            p.originalVy = p.vy;
            p.isDespawning = false; // Transition to fade-in
          }
        } else if (p.alpha < 1.0) {
          p.alpha += 0.02; // slow fade-in
          if (p.alpha > 1.0) p.alpha = 1.0;
        }

        // Mouse interaction (only if within the closest 15 within range)
        const interaction = mouseInteractions.find(item => item.idx === idx);
        if (interaction && attractedIndices.has(idx)) {
          const { dist, dx, dy } = interaction;
          const proximity = (mouse.radius - dist) / mouse.radius; // 0 at outer boundary, 1 at center
          
          // 1. Friction / Viscosity (Damping) - makes them feel very heavy (15% speed loss per frame)
          const damping = 1 - (proximity * 0.15); 
          p.vx *= damping;
          p.vy *= damping;

          // 2. Gentle attraction pull - small pull force so they get left behind easily on fast movement
          const pullForce = proximity * 0.08;
          p.vx -= (dx / (dist || 1)) * pullForce;
          p.vy -= (dy / (dist || 1)) * pullForce;
        } else {
          // Decay back to normal drift speed faster to prevent sluggish groupings
          p.vx += (p.originalVx - p.vx) * 0.08;
          p.vy += (p.originalVy - p.vy) * 0.08;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.baseAlpha * p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        background: 'rgba(255, 255, 255, 0.25)', 
        backdropFilter: 'blur(12px)', 
        borderRadius: '24px', 
        border: '1px solid rgba(255, 255, 255, 0.3)',
        overflow: 'hidden' 
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
