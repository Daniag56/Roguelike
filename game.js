/**
 * game.js
 * Punto central que conecta todos los módulos:
 * - movement.js (dirección/normalización + movimiento en rejilla)
 * - entities.js (Ally/Enemy/Boss/Projectile)
 * - combat.js (daño/muerte/interacciones)
 * - rounds.js (rondas + eventos especiales stub)
 * - renderer.js (dibujado Warhammer)
 */

class Juego {
    static tablero = null;
    static principal = null; // aliados (tipo Ally)
    static enemigos = null; // enemigos (tipo Enemy)
    static obstaculos = null;
    static proyectiles = null; // Projectile[]

    static intervaloJuego = null; // legado (no se usa, pero mantenido)
    static _rafId = null;
    static _renderRafId = null;
    static enPausa = false;

    static velocidadBase = 450;
    static factorVelocidad = 1;

    static rondaActual = 1;
    static enemigosBasePorRonda = 5;
    static incrementoEnemigosPorRonda = 3;

    static iniciarJuego() {
        // Limpiar juego anterior si existe
        if (this.intervaloJuego) clearTimeout(this.intervaloJuego);
        if (this._rafId != null) cancelAnimationFrame(this._rafId);
        if (this._renderRafId != null) cancelAnimationFrame(this._renderRafId);

        this.enPausa = false;

        // Reset de animaciones interpoladas (evita referencias de entidades antiguas).
        if (typeof Movement !== 'undefined' && Movement._entityAnimations?.clear) {
            Movement._entityAnimations.clear();
        }

        // Tablero nuevo
        this.tablero = this.crearTablero(20, 40);

        // Crear entidades aleatorias
        const numPrincipales = Math.floor(Math.random() * 3) + 15;
        const numObstacu = Math.floor(Math.random() * 3) + 5;

        this.principal = this.crearPrincipalesAleatorios(this.tablero, numPrincipales);
        this.obstaculos = this.crearObstaculosAleatorios(this.tablero, numObstacu);

        // Configurar rondas
        Rounds.configurar({
            enemigosBasePorRonda: this.enemigosBasePorRonda,
            incrementoEnemigosPorRonda: this.incrementoEnemigosPorRonda,
        });
        Rounds.rondaActual = 1;
        this.rondaActual = Rounds.rondaActual;

        // Inicializar ronda 1
        this.enemigos = [];
        this.proyectiles = [];
        this.iniciarRonda();

        // Render continuo a 60fps
        this.iniciarBucleRender();
        // Bucle lógico por turnos
        this.iniciarBucleJuego();
    }

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

            const aliado = new Ally(newFila, newColumna);
            tablero[newFila][newColumna] = aliado;
            lista.push(aliado);
        }

        return lista;
    }

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

    static iniciarBucleRender() {
        const renderLoop = () => {
            if (this.tablero) {
                if (!Renderer._lastTableroForRedraw) {
                    Renderer._lastTableroForRedraw = this.tablero;
                }
                if (Renderer._lastTableroForRedraw === this.tablero) {
                    Renderer.mostrarTablero(
                        this.tablero,
                        this.principal,
                        this.enemigos,
                        this.proyectiles
                    );
                }
            }
            this._renderRafId = requestAnimationFrame(renderLoop);
        };
        this._renderRafId = requestAnimationFrame(renderLoop);
    }

    static iniciarBucleJuego() {
        if (this.enPausa) return;

        let lastNow = null;
        let acumuladorMs = 0;

        const convertirVelocidadBase = () => {
            // Para que 1 “paso” lógico ocurra aproximadamente en el intervalo de tick,
            // fijamos velocidad en px/s según el tiempo base de un turno.
            const baseSpeedPxPerSec = Movement.TILE * 1000 / this.velocidadBase;

            for (const a of this.principal || []) {
                if (!a || !Number.isFinite(a.velocidadStep)) continue;
                a.velocidad = a.velocidadStep * baseSpeedPxPerSec;
            }
            for (const e of this.enemigos || []) {
                if (!e || !Number.isFinite(e.velocidadStep)) continue;
                e.velocidad = e.velocidadStep * baseSpeedPxPerSec;
            }
            for (const p of this.proyectiles || []) {
                if (!p || !Number.isFinite(p.velocidadStep)) continue;
                p.velocidad = p.velocidadStep * baseSpeedPxPerSec;
            }
        };

        const update = (now) => {
            if (this.enPausa) return;

            if (lastNow == null) lastNow = now;
            const deltaMs = Math.min(50, Math.max(0, now - lastNow)); // evita saltos al cambiar de pestaña
            const deltaTime = deltaMs / 1000;
            lastNow = now;

            const factor = this.factorVelocidad > 0 ? this.factorVelocidad : 1;
            const intervaloMs = this.velocidadBase / factor;

            // 1) Movimiento continuo (x/y) para entidades.
            convertirVelocidadBase();

            for (const ent of this.principal || []) {
                if (!ent || typeof ent.isVivo !== 'function' || !ent.isVivo()) continue;
                if (ent.target) Movement.moveEntity(ent, ent.target, deltaTime, factor);
            }
            for (const ent of this.enemigos || []) {
                if (!ent || typeof ent.isVivo !== 'function' || !ent.isVivo()) continue;
                if (ent.target) Movement.moveEntity(ent, ent.target, deltaTime, factor);
            }

            // 2) Movimiento continuo + impactos de proyectiles.
            for (let i = this.proyectiles.length - 1; i >= 0; i--) {
                const proj = this.proyectiles[i];
                if (!proj || typeof proj.isVivo !== 'function' || !proj.isVivo()) {
                    this.proyectiles.splice(i, 1);
                    continue;
                }

                const objetivo = proj.objetivo;
                if (!objetivo || typeof objetivo.isVivo !== 'function' || !objetivo.isVivo()) {
                    this.proyectiles.splice(i, 1);
                    continue;
                }

                proj.target = { x: objetivo.x, y: objetivo.y };
                const oldX = proj.x;
                const oldY = proj.y;

                const moved = Movement.moveEntity(proj, proj.target, deltaTime, factor);
                if (moved) {
                    proj.recorridoPx += Math.hypot(proj.x - oldX, proj.y - oldY);
                }

                // Impacto continuo por proximidad.
                const distToTarget = Math.hypot(proj.x - objetivo.x, proj.y - objetivo.y);
                if (distToTarget <= proj.hitRadius) {
                    Combat.aplicarDaño(objetivo, proj.daño);

                    if (!objetivo.isVivo()) {
                        const f = objetivo.getFila();
                        const c = objetivo.getColumna();
                        if (this.tablero?.[f]?.[c] === objetivo) this.tablero[f][c] = null;
                        const idx = this.enemigos.indexOf(objetivo);
                        if (idx >= 0) this.enemigos.splice(idx, 1);
                    }

                    this.proyectiles.splice(i, 1);
                    continue;
                }

                // Desaparece si excede rango.
                if (proj.recorridoPx > proj.rangoPx) {
                    this.proyectiles.splice(i, 1);
                    continue;
                }

                // Desaparece al tocar un obstáculo.
                const pf = proj.getFila();
                const pc = proj.getColumna();
                const celda = this.tablero?.[pf]?.[pc];
                if (celda instanceof Obstaculo) {
                    this.proyectiles.splice(i, 1);
                    continue;
                }
            }

            // 3) Avance discreto de ronda (ticks) con pausa respetada.
            acumuladorMs += deltaMs;
            if (acumuladorMs >= intervaloMs) {
                acumuladorMs = 0;

                const res = Rounds.ejecutarTurno({
                    tablero: this.tablero,
                    aliados: this.principal,
                    enemigos: this.enemigos,
                    proyectiles: this.proyectiles,
                });

                this.actualizarInfo();

                const hayJugadores = Combat.hayAliadosVivos(this.principal);
                const hayEnemigos = Combat.hayEnemigosVivos(this.enemigos);

                if (!hayJugadores || !res.continuarJuego) {
                    const btnTogglePausa = document.getElementById('btn-toggle-pausa');
                    const btnReiniciar = document.getElementById('btn-reiniciar');
                    if (btnTogglePausa) btnTogglePausa.disabled = true;
                    if (btnReiniciar) btnReiniciar.disabled = false;
                    return;
                }

                if (!hayEnemigos && hayJugadores) {
                    this.mostrarModalPasarRonda();
                    return;
                }
            }

            this._rafId = requestAnimationFrame(update);
        };

        this._rafId = requestAnimationFrame(update);
    }


    static iniciarRonda() {
        this.enemigos = Rounds.iniciarRonda({ tablero: this.tablero });
        this.rondaActual = Rounds.rondaActual;
        // velocidades/targets se convierten y se aplican dentro del bucle (continua)
        Renderer.mostrarTablero(this.tablero, this.principal, this.enemigos, this.proyectiles);
        this.actualizarInfo();
    }

    static iniciarSiguienteRonda() {
        this.enemigos = Rounds.iniciarSiguienteRonda({ tablero: this.tablero, enemigos: this.enemigos });
        this.rondaActual = Rounds.rondaActual;
        Renderer.mostrarTablero(this.tablero, this.principal, this.enemigos, this.proyectiles);
        this.actualizarInfo();
    }

    static mostrarModalPasarRonda() {
        this.pausarJuego();
        if (typeof window !== 'undefined' && typeof window.setPausaUI === 'function') {
            window.setPausaUI(true);
        }

        const jugadoresVivos = this.principal.filter(j => j.isVivo()).length;
        const modal = document.getElementById('modal-ronda');
        const countEl = document.getElementById('modal-jugadores-count');
        if (modal && countEl) {
            countEl.textContent = String(jugadoresVivos);
            modal.classList.remove('hidden');
        }
    }

    static confirmarPasarRonda() {
        const modal = document.getElementById('modal-ronda');
        if (modal) modal.classList.add('hidden');

        this.iniciarSiguienteRonda();
        this.reanudarJuego();

        if (typeof window !== 'undefined' && typeof window.setPausaUI === 'function') {
            window.setPausaUI(false);
        }
    }

    static pausarJuego() {
        this.enPausa = true;
        if (this.intervaloJuego) clearTimeout(this.intervaloJuego);
        if (this._rafId != null) cancelAnimationFrame(this._rafId);
        // No cancelar render: sigue dibujando para mantener fluidez.
    }

    static reanudarJuego() {
        if (this.enPausa) {
            this.enPausa = false;
            this.iniciarBucleJuego();
        }
    }

    static reiniciarJuego() {
        this.pausarJuego();
        this.iniciarJuego();

        const btnTogglePausa = document.getElementById('btn-toggle-pausa');
        const btnReiniciar = document.getElementById('btn-reiniciar');
        if (btnTogglePausa) btnTogglePausa.disabled = false;
        if (btnReiniciar) btnReiniciar.disabled = false;
    }

    /**
     * Cambia la velocidad del juego mediante un factor.
     * factor 1 = normal, >1 más rápido, <1 más lento
     */
    static setFactorVelocidad(factor) {
        if (!Number.isFinite(factor) || factor <= 0) {
            return;
        }
        this.factorVelocidad = factor;
    }

    static actualizarInfo() {
        const jugadoresVivos = this.principal.filter(j => j.isVivo());
        const enemigosVivos = this.enemigos.filter(e => e.isVivo());

        const totalVidaJugadores = jugadoresVivos.reduce((s, j) => s + j.getVida(), 0);
        const totalVidaEnemigos = enemigosVivos.reduce((s, e) => s + e.getVida(), 0);

        const elJ = document.getElementById('jugadores-vivos');
        const elE = document.getElementById('enemigos-vivos');
        const elR = document.getElementById('ronda-actual');
        if (elJ) elJ.textContent = `${jugadoresVivos.length} (${totalVidaJugadores} HP)`;
        if (elE) elE.textContent = `${enemigosVivos.length} (${totalVidaEnemigos} HP)`;
        if (elR) elR.textContent = `${this.rondaActual}`;

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

if (typeof window !== 'undefined') {
    window.Juego = Juego;
}

