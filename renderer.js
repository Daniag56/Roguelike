/**
 * renderer.js
 * Renderer basado en Canvas que intenta cargar sprites (Warhammer-style).
 * Mantiene compatibilidad con el movimiento continuo usando {x,y} (mundo).
 */

class Renderer {
    static TILE = 56;

    static _sprites = null;
    static _spritesLoading = false;
    static _lastTableroForRedraw = null;

    static _lastAliados = [];
    static _lastEnemigos = [];
    static _lastProyectiles = [];

    static _lastNowMs = 0;

    static _spritePaths = {
        background: 'Modelos PJ/Fondo/Fondo_Cripta.png',
        playerIdle: 'Modelos PJ/Jugador/Jugador Estatico.png',
        playerMove: ['Modelos PJ/Jugador/Jugador en movimiento 2.png'],
        enemyIdle: ['Modelos PJ/Enemigo/alien estatico.png'],
        enemyMove: ['Modelos PJ/Enemigo/alien en movimiento.png'],
        projectile: 'assets/proyectil-warhammer.png',
    };

    static _nowMs() {
        return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    }

    static _loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`No se pudo cargar sprite: ${src}`));

            const base = typeof document !== 'undefined' && document.baseURI
                ? document.baseURI.replace(/[^/]+$/, '')
                : '';
            const url = new URL(src, base);
            img.src = url.href;
        });
    }

    static preloadSprites() {
        if (this._sprites || this._spritesLoading) return;
        this._spritesLoading = true;

        const p = this._spritePaths;
        Promise.all([
            this._loadImage(p.background).catch(() => null),
            this._loadImage(p.playerIdle).catch(() => null),
            ...p.playerMove.map((s) => this._loadImage(s).catch(() => null)),
            ...p.enemyIdle.map((s) => this._loadImage(s).catch(() => null)),
            ...p.enemyMove.map((s) => this._loadImage(s).catch(() => null)),
            this._loadImage(p.projectile).catch(() => null),
        ])
            .then((imgs) => {
                // bg, playerIdle, playerMove..., enemyIdle..., enemyMove..., projectile
                let idx = 0;
                const background = imgs[idx++];
                const playerIdle = imgs[idx++];
                const playerMoveImgs = [];
                for (let k = 0; k < p.playerMove.length; k++) playerMoveImgs.push(imgs[idx++]);
                const enemyIdleImgs = [];
                for (let k = 0; k < p.enemyIdle.length; k++) enemyIdleImgs.push(imgs[idx++]);
                const enemyMoveImgs = [];
                for (let k = 0; k < p.enemyMove.length; k++) enemyMoveImgs.push(imgs[idx++]);
                const projectileImg = imgs[idx++];

                this._sprites = {
                    background,
                    playerIdle,
                    playerMove: playerMoveImgs.filter(Boolean),
                    enemyIdle: enemyIdleImgs.filter(Boolean),
                    enemyMove: enemyMoveImgs.filter(Boolean),
                    projectile: projectileImg,
                };
            })
            .finally(() => {
                this._spritesLoading = false;
                if (this._lastTableroForRedraw) {
                    this.mostrarTablero(
                        this._lastTableroForRedraw,
                        this._lastAliados,
                        this._lastEnemigos,
                        this._lastProyectiles
                    );
                }
            });
    }

    static _drawTileBackground(ctx, cssWidth, cssHeight) {
        ctx.fillStyle = '#070812';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
    }

    static _drawWall(ctx, x, y, tile) {
        ctx.fillStyle = '#0d0e14';
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = '#14161d';
        ctx.fillRect(x + 2, y + 4, tile - 4, 4);
        ctx.fillRect(x + 2, y + 12, tile - 4, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y + tile - 3, tile, 3);
    }

    static _drawFloor(ctx, x, y, tile) {
        // Semitransparente para que se vea el fondo (Fondo_Cripta) debajo.
        ctx.fillStyle = 'rgba(11, 13, 22, 0.86)';
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x + 6, y + 9, 2, 2);
        ctx.fillRect(x + 15, y + 5, 1, 1);
        ctx.fillRect(x + 10, y + 16, 1, 1);
    }

    static _drawEntityFallback(ctx, xTL, yTL, base, glow, tile) {
        const pad = tile * 0.2;
        const w = tile - pad * 2;
        const h = tile * 0.65;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(xTL + tile / 2, yTL + tile * 0.78, tile * 0.3, tile * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = base;
        ctx.fillRect(xTL + pad + 2, yTL + pad, w - 4, h - 2);
        ctx.fillRect(xTL + pad, yTL + pad + 2, w, h - 4);
        ctx.fillStyle = glow;
        ctx.fillRect(xTL + pad + 4, yTL + pad + 4, 4, 4);
    }

    static _drawHealthBar(ctx, xTL, yTL, entidad, tile) {
        if (!entidad || typeof entidad.getVida !== 'function' || typeof entidad.getVidaMax !== 'function') return;
        const vida = entidad.getVida();
        const vidaMax = entidad.getVidaMax();
        if (!vidaMax || vidaMax <= 0) return;

        const ratio = Math.max(0, Math.min(1, vida / vidaMax));
        const barWidth = Math.floor(tile * 0.9);
        const barHeight = 4;
        const barX = xTL + Math.floor((tile - barWidth) / 2);
        const barY = yTL + 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        ctx.fillStyle = 'rgba(90, 0, 0, 0.85)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const currentWidth = Math.floor(barWidth * ratio);
        if (currentWidth > 0) {
            ctx.fillStyle = '#ff3b3b';
            ctx.fillRect(barX, barY, currentWidth, barHeight);
        }
    }

    static _drawSprite(ctx, img, xTL, yTL, frameIndex = 0, tile = Renderer.TILE) {
        if (!img) return false;
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return false;

        // Detecta strips horizontales (sprite sheet)
        const ratio = iw / ih;
        const approxFrames = Math.max(1, Math.round(ratio));
        const isStrip = approxFrames > 1 && Math.abs(ratio - approxFrames) < 0.22;

        const frames = isStrip ? approxFrames : 1;
        const fi = ((frameIndex % frames) + frames) % frames;

        const sw = iw / frames;
        const sh = ih;
        const sx = fi * sw;
        const sy = 0;

        const scale = Math.min(tile / sw, tile / sh) * 2.35;
        const w = Math.max(1, Math.floor(sw * scale));
        const h = Math.max(1, Math.floor(sh * scale));
        const dx = xTL + Math.floor((tile - w) / 2);
        const dy = yTL + Math.floor((tile - h) / 2);

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(xTL + tile / 2, yTL + tile * 0.82, tile * 0.26, tile * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
        return true;
    }

    static mostrarTablero(tablero, aliados = [], enemigos = [], proyectiles = []) {
        this._lastTableroForRedraw = tablero;
        this._lastAliados = Array.isArray(aliados) ? aliados : [];
        this._lastEnemigos = Array.isArray(enemigos) ? enemigos : [];
        this._lastProyectiles = Array.isArray(proyectiles) ? proyectiles : [];

        const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('game-canvas'));
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const filas = tablero.length;
        const columnas = tablero[0]?.length ?? 0;
        if (filas === 0 || columnas === 0) return;

        const tile = this.TILE;
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

        const cssWidth = columnas * tile;
        const cssHeight = filas * tile;

        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;

        const container = document.getElementById('tablero-container');
        let maxW = container ? container.clientWidth : cssWidth;
        let maxH = container ? container.clientHeight : cssHeight;
        if (maxW <= 0) maxW = cssWidth;
        if (maxH <= 0) maxH = cssHeight;

        const scale = Math.min(1, maxW / cssWidth, maxH / cssHeight);
        const displayW = Math.max(1, Math.floor(cssWidth * scale));
        const displayH = Math.max(1, Math.floor(cssHeight * scale));
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;

        this._lastNowMs = this._nowMs();

        this.preloadSprites();
        const sprites = this._sprites;

        // Fondo
        this._drawTileBackground(ctx, cssWidth, cssHeight);
        if (sprites?.background) {
            const img = sprites.background;
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (iw && ih) {
                const scaleImg = Math.max(cssWidth / iw, cssHeight / ih);
                const w = iw * scaleImg;
                const h = ih * scaleImg;
                const dx = (cssWidth - w) / 2;
                const dy = (cssHeight - h) / 2;
                ctx.drawImage(img, dx, dy, w, h);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                ctx.fillRect(0, 0, cssWidth, cssHeight);
            }
        }

        // Tiles (obstáculos)
        for (let f = 0; f < filas; f++) {
            for (let c = 0; c < columnas; c++) {
                const x = c * tile;
                const y = f * tile;
                const cell = tablero[f][c];
                if (cell instanceof Obstaculo) this._drawWall(ctx, x, y, tile);
                else this._drawFloor(ctx, x, y, tile);
            }
        }

        // Entities
        for (const ali of this._lastAliados) {
            if (!ali || typeof ali.isVivo !== 'function' || !ali.isVivo()) continue;
            const xTL = Number.isFinite(ali.x) ? ali.x - tile / 2 : ali.getColumna() * tile;
            const yTL = Number.isFinite(ali.y) ? ali.y - tile / 2 : ali.getFila() * tile;

            const isMoving = !!ali.moving && !!ali.target;
            const frameIndex = isMoving ? Math.floor(this._lastNowMs / 160) : 0;
            const img = isMoving
                ? (sprites?.playerMove?.[0] || sprites?.playerIdle)
                : (sprites?.playerIdle);

            const ok = this._drawSprite(ctx, img, xTL, yTL, frameIndex, tile);
            if (!ok) this._drawEntityFallback(ctx, xTL, yTL, '#10a6ff', 'rgba(255,255,255,0.35)', tile);
            this._drawHealthBar(ctx, xTL, yTL, ali, tile);
        }

        for (const en of this._lastEnemigos) {
            if (!en || typeof en.isVivo !== 'function' || !en.isVivo()) continue;
            const xTL = Number.isFinite(en.x) ? en.x - tile / 2 : en.getColumna() * tile;
            const yTL = Number.isFinite(en.y) ? en.y - tile / 2 : en.getFila() * tile;

            const isMoving = !!en.moving && !!en.target;
            const frameIndex = isMoving ? Math.floor(this._lastNowMs / 180) : 0;
            const img = isMoving
                ? (sprites?.enemyMove?.[0] || sprites?.enemyIdle?.[0])
                : (sprites?.enemyIdle?.[0]);

            const ok = this._drawSprite(ctx, img, xTL, yTL, frameIndex, tile);
            if (!ok) this._drawEntityFallback(ctx, xTL, yTL, '#ffd000', 'rgba(255,255,255,0.25)', tile);
            this._drawHealthBar(ctx, xTL, yTL, en, tile);
        }

        // Projectiles (rayo/energía)
        for (const proj of this._lastProyectiles) {
            if (!proj || typeof proj.isVivo !== 'function' || !proj.isVivo()) continue;
            const cx = Number.isFinite(proj.x) ? proj.x : proj.getColumna() * tile + tile / 2;
            const cy = Number.isFinite(proj.y) ? proj.y : proj.getFila() * tile + tile / 2;

            // Halo
            ctx.strokeStyle = 'rgba(80, 220, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, tile * 0.22, 0, Math.PI * 2);
            ctx.stroke();

            if (sprites?.projectile) {
                const s = tile * 0.6;
                ctx.save();
                ctx.globalAlpha = 0.95;
                ctx.drawImage(sprites.projectile, cx - s / 2, cy - s / 2, s, s);
                ctx.restore();
            } else {
                ctx.fillStyle = 'rgba(10, 10, 18, 0.95)';
                ctx.beginPath();
                ctx.arc(cx, cy, tile * 0.13, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // UI overlay suave (scanlines)
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let y = 0; y < cssHeight; y += 4) ctx.fillRect(0, y, cssWidth, 1);
    }
}

if (typeof window !== 'undefined') {
    window.Renderer = Renderer;
    window.__RENDERER_SCRIPT_RAN__ = true;

    if (!Renderer._resizeBound) {
        Renderer._resizeBound = true;
        window.addEventListener('resize', () => {
            if (Renderer._lastTableroForRedraw) {
                Renderer.mostrarTablero(
                    Renderer._lastTableroForRedraw,
                    Renderer._lastAliados,
                    Renderer._lastEnemigos,
                    Renderer._lastProyectiles
                );
            }
        });
    }
}

