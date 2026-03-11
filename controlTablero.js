/**
 * Control del tablero y lógica del juego
 */
class ControlTablero {
    // ----------------------------
    // Sprites (Modelos PJ)
    // ----------------------------
    static _sprites = null;
    static _spritesLoading = false;
    static _lastTableroForRedraw = null;
    static _lastPositions = new WeakMap(); // entity -> { f, c, movedAt }
    static _entityAnimations = new Map(); // entity -> { fromF, fromC, toF, toC, startTime, duration }
    static ANIM_DURATION = 380; // ms para interpolación continua (casi todo el ciclo entre turnos)

    // Rutas relativas al HTML (carpeta del proyecto = donde está index.html)
    static _spritePaths = {
        background: 'Modelos PJ/Fondo/Fondo_Cripta.png',
        playerIdle: 'Modelos PJ/Jugador/Jugador Estatico.png',
        playerMove: [
            'Modelos PJ/Jugador/Jugador en movimiento 2.png',
        ],
        enemyIdle: [
            'Modelos PJ/Enemigo/alien estatico.png',
        ],
        enemyMove: [
            'Modelos PJ/Enemigo/alien en movimiento.png',
        ],
    };

    static _loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`No se pudo cargar sprite: ${src}`));
            // Resolver ruta relativa al documento para que funcione con cualquier base
            const base = typeof document !== 'undefined' && document.baseURI
                ? document.baseURI.replace(/[^/]+$/, '')
                : '';
            const url = new URL(src, base);
            img.src = url.href;
        });
    }

    /**
     * Precarga sprites de jugador/enemigo (si existen).
     * No bloquea el render: si aún no están, se dibuja un fallback.
     */
    static preloadSprites() {
        if (this._sprites || this._spritesLoading) return;
        this._spritesLoading = true;

        const p = this._spritePaths;
        Promise.all([
            this._loadImage(p.background),
            this._loadImage(p.playerIdle),
            ...p.playerMove.map((s) => this._loadImage(s)),
            ...p.enemyIdle.map((s) => this._loadImage(s)),
            ...p.enemyMove.map((s) => this._loadImage(s)),
        ])
            .then((imgs) => {
                // Orden: idle jugador, mov jugador..., idle enemigo..., mov enemigo...
                let idx = 0;
                const background = imgs[idx++];
                const playerIdle = imgs[idx++];
                const playerMove = p.playerMove.map(() => imgs[idx++]);
                const enemyIdle = p.enemyIdle.map(() => imgs[idx++]);
                const enemyMove = p.enemyMove.map(() => imgs[idx++]);

                this._sprites = { background, playerIdle, playerMove, enemyIdle, enemyMove };
            })
            .catch((e) => {
                // Si falla, no rompemos el juego: seguirá con fallback.
                console.warn(e);
            })
            .finally(() => {
                this._spritesLoading = false;
                if (this._lastTableroForRedraw) {
                    this.mostrarTablero(this._lastTableroForRedraw);
                }
            });
    }

    /**
     * Crea un tablero usando arrays bidimensionales
     * @param {number} fila 
     * @param {number} columna 
     * @returns {Array<Array<Jugador|null>>}
     */
    static crearTablero(fila, columna) {
        const tablero = [];
        for (let i = 0; i < fila; i++) {
            const filaLista = [];
            for (let j = 0; j < columna; j++) {
                filaLista.push(null);
            }
            tablero.push(filaLista);
        }
        return tablero;
    }

    /**
     * Mueve un jugador si la casilla está libre
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Jugador} jugPrin 
     * @param {number} newFila 
     * @param {number} newColumna 
     */
    static mover(tablero, jugPrin, newFila, newColumna) {
        const destino = tablero[newFila][newColumna];

        if (destino !== null && destino instanceof Obstaculo) {
            return;
        }

        if (destino !== null) {
            return;
        }

        const oldF = jugPrin.getFila();
        const oldC = jugPrin.getColumna();
        tablero[oldF][oldC] = null;
        jugPrin.moverJugador(newFila, newColumna);
        tablero[newFila][newColumna] = jugPrin;
        // Registrar animación para interpolación suave
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        this._entityAnimations.set(jugPrin, { fromF: oldF, fromC: oldC, toF: newFila, toC: newColumna, startTime: now, duration: this.ANIM_DURATION });
    }

    /**
     * Muestra el tablero con gráficos en Canvas
     * @param {Array<Array<Jugador|null>>} tablero 
     */
    static mostrarTablero(tablero) {
        this._lastTableroForRedraw = tablero;
        this.preloadSprites();

        const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('game-canvas'));
        if (!canvas) return;

        const filas = tablero.length;
        const columnas = tablero[0]?.length ?? 0;
        if (filas === 0 || columnas === 0) return;

        // Tamaño del tile (px). Mayor = jugadores/enemigos más visibles.
        const tile = 56;
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

        const cssWidth = columnas * tile;
        const cssHeight = filas * tile;

        // Ajuste de tamaño (nítido en pantallas retina)
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;

        // Escalar para que el tablero quepa entero en pantalla
        const container = document.getElementById('tablero-container');
        let maxW = container ? container.clientWidth : 0;
        let maxH = container ? container.clientHeight : 0;
        if (maxW <= 0 || maxH <= 0) {
            maxW = Math.min(cssWidth, typeof window !== 'undefined' ? window.innerWidth - 80 : cssWidth);
            maxH = Math.min(cssHeight, typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.7) : cssHeight);
        }
        const scale = Math.min(1, maxW / cssWidth, maxH / cssHeight);
        const displayW = Math.max(1, Math.floor(cssWidth * scale));
        const displayH = Math.max(1, Math.floor(cssHeight * scale));
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;

        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false }) || canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;

        // Fondo general (un poco de viñeta)
        ctx.fillStyle = '#070812';
        ctx.fillRect(0, 0, cssWidth, cssHeight);

        // Helpers de dibujo (texturitas simples sin assets)
        const drawFloor = (x, y) => {
            ctx.fillStyle = '#0b0d16';
            ctx.fillRect(x, y, tile, tile);
            // ruido sutil
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(x + 6, y + 9, 2, 2);
            ctx.fillRect(x + 15, y + 5, 1, 1);
            ctx.fillRect(x + 10, y + 16, 1, 1);
        };

        const drawWall = (x, y) => {
            ctx.fillStyle = '#0d0e14';
            ctx.fillRect(x, y, tile, tile);
            // ladrillos más oscuros
            ctx.fillStyle = '#14161d';
            ctx.fillRect(x + 2, y + 4, tile - 4, 4);
            ctx.fillRect(x + 2, y + 12, tile - 4, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y + tile - 3, tile, 3);
        };

        const drawEntityFallback = (x, y, base, glow) => {
            const pad = tile * 0.2;
            const w = tile - pad * 2;
            const h = tile * 0.65;
            // sombra
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(x + tile / 2, y + tile * 0.78, tile * 0.3, tile * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            // cuerpo más grande
            ctx.fillStyle = base;
            ctx.fillRect(x + pad + 2, y + pad, w - 4, h - 2);
            ctx.fillRect(x + pad, y + pad + 2, w, h - 4);
            // brillo
            ctx.fillStyle = glow;
            ctx.fillRect(x + pad + 4, y + pad + 4, 4, 4);
        };

        const drawHealthBar = (x, y, entidad) => {
            if (!entidad || typeof entidad.getVida !== 'function' || typeof entidad.getVidaMax !== 'function') {
                return;
            }
            const vida = entidad.getVida();
            const vidaMax = entidad.getVidaMax();
            if (!vidaMax || vidaMax <= 0) return;

            const ratio = Math.max(0, Math.min(1, vida / vidaMax));
            const barWidth = Math.floor(tile * 0.9);
            const barHeight = 4;
            const barX = x + Math.floor((tile - barWidth) / 2);
            const barY = y + 2;

            // Fondo de la barra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

            // Barra completa
            ctx.fillStyle = 'rgba(90, 0, 0, 0.85)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Vida actual
            const currentWidth = Math.floor(barWidth * ratio);
            if (currentWidth > 0) {
                ctx.fillStyle = '#ff3b3b';
                ctx.fillRect(barX, barY, currentWidth, barHeight);
            }
        };

        /**
         * Dibuja un sprite. Si detecta que es una tira (sprite sheet horizontal),
         * renderiza el frame indicado.
         */
        const drawSprite = (img, x, y, frameIndex = 0) => {
            if (!img) return;
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (!iw || !ih) return;

            // Detectar sprite sheet horizontal (ej: 264x53 ~ 5 frames)
            const ratio = iw / ih;
            const approxFrames = Math.max(1, Math.round(ratio));
            const isStrip = approxFrames > 1 && Math.abs(ratio - approxFrames) < 0.22;

            const frames = isStrip ? approxFrames : 1;
            const fi = ((frameIndex % frames) + frames) % frames;

            const sw = iw / frames;
            const sh = ih;
            const sx = fi * sw;
            const sy = 0;

            // Escalar sprites más grandes (personajes bien visibles)
            const scale = Math.min(tile / sw, tile / sh) * 2.35;
            const w = Math.max(1, Math.floor(sw * scale));
            const h = Math.max(1, Math.floor(sh * scale));
            const dx = x + Math.floor((tile - w) / 2);
            const dy = y + Math.floor((tile - h) / 2);

            // sombra suave
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(x + tile / 2, y + tile * 0.82, tile * 0.26, tile * 0.10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
        };

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        const getDrawPos = (entity, gridF, gridC) => {
            const anim = this._entityAnimations.get(entity);
            if (!anim) return { x: gridC * tile, y: gridF * tile };
            const elapsed = now - anim.startTime;
            if (elapsed >= anim.duration) {
                this._entityAnimations.delete(entity);
                return { x: anim.toC * tile, y: anim.toF * tile };
            }
            const t = elapsed / anim.duration;
            const eased = 1 - Math.pow(1 - t, 3);
            const x = (1 - eased) * anim.fromC * tile + eased * anim.toC * tile;
            const y = (1 - eased) * anim.fromF * tile + eased * anim.toF * tile;
            return { x, y };
        };

        const sprites = this._sprites;
        const hayFondo = !!(sprites?.background);

        // Fondo del tablero: Fondo_Cripta desde Modelos PJ/Fondo/
        if (hayFondo) {
            // “cover” para que llene el canvas sin deformarse
            const img = sprites.background;
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (iw && ih) {
                const scale = Math.max(cssWidth / iw, cssHeight / ih);
                const w = iw * scale;
                const h = ih * scale;
                const dx = (cssWidth - w) / 2;
                const dy = (cssHeight - h) / 2;
                ctx.drawImage(img, dx, dy, w, h);
                // oscurecer un pelín para que se vean entidades/tiles
                ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                ctx.fillRect(0, 0, cssWidth, cssHeight);
            }
        }

        for (let i = 0; i < filas; i++) {
            for (let j = 0; j < columnas; j++) {
                const x = j * tile;
                const y = i * tile;

                const cell = tablero[i][j];
                if (cell instanceof Obstaculo) {
                    drawWall(x, y);
                } else {
                    if (!hayFondo) drawFloor(x, y);
                    if (cell instanceof Principal) {
                        const pos = getDrawPos(cell, i, j);
                        const prev = this._lastPositions.get(cell);
                        const moved = !prev || prev.f !== i || prev.c !== j;
                        const movedAt = moved ? now : prev.movedAt;
                        this._lastPositions.set(cell, { f: i, c: j, movedAt });

                        const isMoving = now - movedAt < this.ANIM_DURATION + 60;
                        if (sprites) {
                            if (isMoving) {
                                const frames = sprites.playerMove?.length ? sprites.playerMove : [sprites.playerIdle];
                                const img = frames[Math.floor(now / 160) % frames.length];
                                drawSprite(img, pos.x, pos.y, Math.floor(now / 120));
                            } else {
                                drawSprite(sprites.playerIdle, pos.x, pos.y, 0);
                            }
                        } else {
                            drawEntityFallback(pos.x, pos.y, '#10a6ff', 'rgba(255,255,255,0.35)');
                        }
                        drawHealthBar(pos.x, pos.y, cell);
                    } else if (cell instanceof Enemigo) {
                        const pos = getDrawPos(cell, i, j);
                        const prev = this._lastPositions.get(cell);
                        const moved = !prev || prev.f !== i || prev.c !== j;
                        const movedAt = moved ? now : prev.movedAt;
                        this._lastPositions.set(cell, { f: i, c: j, movedAt });

                        const isMoving = now - movedAt < this.ANIM_DURATION + 60;
                        if (sprites) {
                            const frames = isMoving ? sprites.enemyMove : sprites.enemyIdle;
                            const frame = frames[Math.floor(now / 180) % frames.length];
                            drawSprite(frame, pos.x, pos.y, Math.floor(now / 180));
                        } else {
                            drawEntityFallback(pos.x, pos.y, '#ffd000', 'rgba(255,255,255,0.25)');
                        }
                        drawHealthBar(pos.x, pos.y, cell);
                    }
                }
            }
        }

        // UI overlay suave (scanlines)
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let y = 0; y < cssHeight; y += 4) {
            ctx.fillRect(0, y, cssWidth, 1);
        }
    }

    /**
     * Ejecuta un turno del juego.
     * Devuelve false SOLO si ya no quedan jugadores vivos (fin de partida).
     * El control de rondas/enemigos lo gestiona la clase Juego.
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Array<Principal>} jugadores 
     * @param {Array<Enemigo>} enemigos 
     * @returns {boolean} true si el juego debe continuar, false si terminó
     */
    static ejecutarTurno(tablero, jugadores, enemigos) {
        const hayJugadores = this.comprobadorJugadoresPrinvivos(jugadores);
        if (!hayJugadores) {
            this.actualizarInfo(jugadores, enemigos);
            return false;
        }

        // Mover jugadores principales (movimiento aleatorio)
        for (const prin of jugadores) {
            if (prin.isVivo()) {
                let newFila = prin.getFila() + Math.floor(Math.random() * 3) - 1;
                let newColumna = prin.getColumna() + Math.floor(Math.random() * 3) - 1;

                if (newFila < 0) newFila = 0;
                else if (newFila >= tablero.length) newFila = tablero.length - 1;
                if (newColumna < 0) newColumna = 0;
                else if (newColumna >= tablero[0].length) newColumna = tablero[0].length - 1;

                this.mover(tablero, prin, newFila, newColumna);
            }
        }

        // Mover enemigos
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const enemigo = enemigos[i];

            if (enemigo.isVivo()) {
                let objetivo = null;
                for (const p of jugadores) {
                    if (p.isVivo() && objetivo === null) {
                        objetivo = p;
                    }
                }

                if (objetivo !== null) {
                    const oldF = enemigo.getFila();
                    const oldC = enemigo.getColumna();
                    enemigo.perseguirJugador(objetivo, tablero);
                    const newFila = enemigo.getFila();
                    const newColumna = enemigo.getColumna();
                    if (newFila !== oldF || newColumna !== oldC) {
                        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                        this._entityAnimations.set(enemigo, { fromF: oldF, fromC: oldC, toF: newFila, toC: newColumna, startTime: now, duration: this.ANIM_DURATION });
                    }

                    let jug = null;

                    if (newFila > 0 && tablero[newFila - 1][newColumna] instanceof Principal) {
                        jug = tablero[newFila - 1][newColumna];
                    } else if (newFila < tablero.length - 1 && tablero[newFila + 1][newColumna] instanceof Principal) {
                        jug = tablero[newFila + 1][newColumna];
                    } else if (newColumna > 0 && tablero[newFila][newColumna - 1] instanceof Principal) {
                        jug = tablero[newFila][newColumna - 1];
                    } else if (newColumna < tablero[0].length - 1 && tablero[newFila][newColumna + 1] instanceof Principal) {
                        jug = tablero[newFila][newColumna + 1];
                    }

                    if (jug !== null) {
                        this.combate(tablero, jug, enemigo);
                    }
                }
            } else {
                enemigos.splice(i, 1);
            }
        }

        this.actualizarInfo(jugadores, enemigos);
        return true;
    }

    /** Daño que inflige el jugador al enemigo por golpe */
    static DAÑO_JUGADOR = 25;
    /** Daño que inflige el enemigo al jugador por golpe */
    static DAÑO_ENEMIGO = 20;

    /**
     * Combate entre jugador y enemigo: se infligen daño; si vida <= 0 mueren.
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Principal} jugPrincipal 
     * @param {Enemigo} enemigo 
     */
    static combate(tablero, jugPrincipal, enemigo) {
        jugPrincipal.recibirDano(this.DAÑO_ENEMIGO);
        enemigo.recibirDano(this.DAÑO_JUGADOR);

        if (!jugPrincipal.isVivo()) {
            tablero[jugPrincipal.getFila()][jugPrincipal.getColumna()] = null;
        }
        if (!enemigo.isVivo()) {
            tablero[enemigo.getFila()][enemigo.getColumna()] = null;
        }
    }

    /**
     * Comprueba si queda algún enemigo vivo
     * @param {Array<Enemigo>} enemigos 
     * @returns {boolean}
     */
    static comprobadorEnemigosvivos(enemigos) {
        for (const e of enemigos) {
            if (e.isVivo()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Comprueba los jugadores vivos
     * @param {Array<Principal>} jugadores 
     * @returns {boolean}
     */
    static comprobadorJugadoresPrinvivos(jugadores) {
        for (const p of jugadores) {
            if (p.isVivo()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Crea aleatoriamente jugadores principales
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {number} cantidad 
     * @returns {Array<Principal>}
     */
    static crearPrincipalesAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;

            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const principal = new Principal(newFila, newColumna);
            tablero[newFila][newColumna] = principal;
            lista.push(principal);
        }

        return lista;
    }

    /**
     * Crea enemigos aleatoriamente
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {number} cantidad 
     * @returns {Array<Enemigo>}
     */
    static crearEnemigosAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;

            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const enemigo = new Enemigo(newFila, newColumna);
            tablero[newFila][newColumna] = enemigo;
            lista.push(enemigo);
        }

        return lista;
    }

    /**
     * Crea Obstáculos en el tablero
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {number} cantidad 
     * @returns {Array<Obstaculo>}
     */
    static crearObstaculosAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;

            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const obstacu = new Obstaculo(newFila, newColumna);
            tablero[newFila][newColumna] = obstacu;
            lista.push(obstacu);
        }

        return lista;
    }

    /**
     * Actualiza la información del juego en la interfaz
     * @param {Array<Principal>} jugadores 
     * @param {Array<Enemigo>} enemigos 
     */
    static actualizarInfo(jugadores, enemigos) {
        const jugadoresVivos = jugadores.filter(j => j.isVivo());
        const enemigosVivos = enemigos.filter(e => e.isVivo());
        const totalVidaJugadores = jugadoresVivos.reduce((s, j) => s + j.getVida(), 0);
        const totalVidaEnemigos = enemigosVivos.reduce((s, e) => s + e.getVida(), 0);

        const elJ = document.getElementById('jugadores-vivos');
        const elE = document.getElementById('enemigos-vivos');
        const elR = document.getElementById('ronda-actual');
        if (elJ) elJ.textContent = `${jugadoresVivos.length} (${totalVidaJugadores} HP)`;
        if (elE) elE.textContent = `${enemigosVivos.length} (${totalVidaEnemigos} HP)`;
        if (elR && typeof Juego !== 'undefined' && Number.isInteger(Juego.rondaActual)) {
            elR.textContent = `${Juego.rondaActual}`;
        }

        const estado = document.getElementById('estado-juego');
        if (!estado) return;
        if (jugadoresVivos.length === 0) {
            estado.textContent = '¡Derrota! Todos los jugadores han muerto.';
            estado.style.color = '#ff4444';
        } else if (enemigosVivos.length === 0) {
            estado.textContent = '¡Victoria! Todos los enemigos han sido derrotados.';
            estado.style.color = '#4ecdc4';
        } else {
            estado.textContent = 'En juego...';
            estado.style.color = '#4ecdc4';
        }
    }
}

// Redibujar tablero al redimensionar ventana para mantener escalado
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        if (ControlTablero._lastTableroForRedraw) {
            ControlTablero.mostrarTablero(ControlTablero._lastTableroForRedraw);
        }
    });
}
