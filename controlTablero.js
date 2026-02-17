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

    static _spritePaths = {
        background: 'Roguelike/Modelos PJ/fondo/fondo.png',
        playerIdle: 'Roguelike/Modelos PJ/Jugador/Jugador Estatico.png',
        playerMove: [
            // Modelos actuales en carpeta Jugador
            'Roguelike/Modelos PJ/Jugador/Jugador en movimiento 2.png',
        ],
        enemyIdle: [
            // Modelos actuales en carpeta Enemigo
            'Roguelike/Modelos PJ/Enemigo/Enemigo estatico 2.png',
        ],
        enemyMove: [
            'Roguelike/Modelos PJ/Enemigo/Enemigo en movimiento 2.png',
        ],
    };

    static _loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`No se pudo cargar sprite: ${src}`));
            // Importante: rutas con espacios (Modelos PJ) en file://
            img.src = encodeURI(src);
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

        tablero[jugPrin.getFila()][jugPrin.getColumna()] = null;
        jugPrin.moverJugador(newFila, newColumna);
        tablero[newFila][newColumna] = jugPrin;
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

        // Tamaño del tile (px). Sube/baja esto si quieres más grande.
        const tile = 32;
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

        const cssWidth = columnas * tile;
        const cssHeight = filas * tile;

        // Ajuste de tamaño (nítido en pantallas retina)
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const ctx = canvas.getContext('2d');
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
            ctx.fillStyle = '#22242f';
            ctx.fillRect(x, y, tile, tile);
            // ladrillos
            ctx.fillStyle = '#2f3242';
            ctx.fillRect(x + 2, y + 4, tile - 4, 4);
            ctx.fillRect(x + 2, y + 12, tile - 4, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x, y + tile - 3, tile, 3);
        };

        const drawEntityFallback = (x, y, base, glow) => {
            // sombra
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(x + tile / 2, y + tile * 0.78, tile * 0.28, tile * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();

            // cuerpo (círculo pixelado)
            ctx.fillStyle = base;
            ctx.fillRect(x + 8, y + 6, 8, 10);
            ctx.fillRect(x + 7, y + 8, 10, 8);

            // brillo
            ctx.fillStyle = glow;
            ctx.fillRect(x + 9, y + 7, 2, 2);
            ctx.fillRect(x + 11, y + 6, 2, 2);
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

            // Centrar y escalar dentro del tile manteniendo aspecto (por frame)
            const scale = Math.min(tile / sw, tile / sh);
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
        const sprites = this._sprites;

        // Fondo del tablero (imagen)
        if (sprites?.background) {
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
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
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
                    drawFloor(x, y);
                    if (cell instanceof Principal) {
                        // Detectar movimiento (para usar sprite de movimiento)
                        const prev = this._lastPositions.get(cell);
                        const moved = !prev || prev.f !== i || prev.c !== j;
                        const movedAt = moved ? now : prev.movedAt;
                        this._lastPositions.set(cell, { f: i, c: j, movedAt });

                        const isMoving = now - movedAt < 220;
                        if (sprites) {
                            if (isMoving) {
                                const frames = sprites.playerMove?.length ? sprites.playerMove : [sprites.playerIdle];
                                const img = frames[Math.floor(now / 160) % frames.length];
                                drawSprite(img, x, y, Math.floor(now / 120));
                            } else {
                                drawSprite(sprites.playerIdle, x, y, 0);
                            }
                        } else {
                            drawEntityFallback(x, y, '#10a6ff', 'rgba(255,255,255,0.35)');
                        }
                    } else if (cell instanceof Enemigo) {
                        const prev = this._lastPositions.get(cell);
                        const moved = !prev || prev.f !== i || prev.c !== j;
                        const movedAt = moved ? now : prev.movedAt;
                        this._lastPositions.set(cell, { f: i, c: j, movedAt });

                        const isMoving = now - movedAt < 220;
                        if (sprites) {
                            const frames = isMoving ? sprites.enemyMove : sprites.enemyIdle;
                            const frame = frames[Math.floor(now / 180) % frames.length];
                            drawSprite(frame, x, y, Math.floor(now / 180));
                        } else {
                            drawEntityFallback(x, y, '#ffd000', 'rgba(255,255,255,0.25)');
                        }
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
     * Ejecuta un turno del juego
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Array<Principal>} jugadores 
     * @param {Array<Enemigo>} enemigos 
     * @returns {boolean} true si el juego debe continuar, false si terminó
     */
    static ejecutarTurno(tablero, jugadores, enemigos) {
        if (!this.comprobadorEnemigosvivos(enemigos) || !this.comprobadorJugadoresPrinvivos(jugadores)) {
            return false;
        }

        // Mover jugadores principales
        for (const prin of jugadores) {
            if (prin.isVivo()) {
                let newFila = prin.getFila() + Math.floor(Math.random() * 3) - 1;
                let newColumna = prin.getColumna() + Math.floor(Math.random() * 3) - 1;

                if (newFila < 0) {
                    newFila = 0;
                } else if (newFila >= tablero.length) {
                    newFila = tablero.length - 1;
                }

                if (newColumna < 0) {
                    newColumna = 0;
                } else if (newColumna >= tablero[0].length) {
                    newColumna = tablero[0].length - 1;
                }

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
                    enemigo.perseguirJugador(objetivo, tablero);

                    const newFila = enemigo.getFila();
                    const newColumna = enemigo.getColumna();

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

        this.mostrarTablero(tablero);
        this.actualizarInfo(jugadores, enemigos);

        return true;
    }

    /**
     * Combate entre jugador y enemigo
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Principal} jugPrincipal 
     * @param {Enemigo} enemigo 
     * @returns {boolean}
     */
    static combate(tablero, jugPrincipal, enemigo) {
        const ganar = Math.random() < 0.5;

        if (ganar) {
            tablero[enemigo.getFila()][enemigo.getColumna()] = null;
            enemigo.setEstaVivo(false);
            return true;
        } else {
            tablero[jugPrincipal.getFila()][jugPrincipal.getColumna()] = null;
            jugPrincipal.setEstaVivo(false);
            return false;
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
        const jugadoresVivos = jugadores.filter(j => j.isVivo()).length;
        const enemigosVivos = enemigos.filter(e => e.isVivo()).length;

        document.getElementById('jugadores-vivos').textContent = jugadoresVivos;
        document.getElementById('enemigos-vivos').textContent = enemigosVivos;

        if (jugadoresVivos === 0) {
            document.getElementById('estado-juego').textContent = '¡Derrota! Todos los jugadores han muerto.';
            document.getElementById('estado-juego').style.color = '#ff4444';
        } else if (enemigosVivos === 0) {
            document.getElementById('estado-juego').textContent = '¡Victoria! Todos los enemigos han sido derrotados.';
            document.getElementById('estado-juego').style.color = '#4ecdc4';
        } else {
            document.getElementById('estado-juego').textContent = 'En juego...';
            document.getElementById('estado-juego').style.color = '#4ecdc4';
        }
    }
}
