/**
 * Clase Juego - Control principal del juego
 */
class Juego {
    static tablero = null;
    static principal = null;
    static enemigos = null;
    static obstaculos = null;
    static intervaloJuego = null;
    static _rafId = null;
    static _renderRafId = null;
    static enPausa = false;
    static velocidadBase = 450;
    static factorVelocidad = 1;
    static rondaActual = 1;
    static enemigosBasePorRonda = 5;
    static incrementoEnemigosPorRonda = 3;

    /**
     * Inicia el juego
     */
    static iniciarJuego() {
        // Limpiar juego anterior si existe
        if (this.intervaloJuego) clearTimeout(this.intervaloJuego);
        if (this._rafId != null) cancelAnimationFrame(this._rafId);
        if (this._renderRafId != null) cancelAnimationFrame(this._renderRafId);

        this.enPausa = false;
        this.tablero = ControlTablero.crearTablero(20, 40);

        // Crear entidades aleatorias
        const numPrincipales = Math.floor(Math.random() * 3) + 15;
        const numObstacu = Math.floor(Math.random() * 3) + 5;

        this.principal = ControlTablero.crearPrincipalesAleatorios(this.tablero, numPrincipales);
        this.obstaculos = ControlTablero.crearObstaculosAleatorios(this.tablero, numObstacu);

        // Inicializar rondas
        this.rondaActual = 1;
        this.enemigos = [];
        this.iniciarRonda();

        // Bucle de renderizado continuo a 60fps (fluidez sin tirones)
        this.iniciarBucleRender();
        // Iniciar bucle del juego (lógica por turnos)
        this.iniciarBucleJuego();
    }

    static iniciarBucleRender() {
        const renderLoop = () => {
            if (this.tablero) {
                if (!ControlTablero._lastTableroForRedraw) {
                    ControlTablero._lastTableroForRedraw = this.tablero;
                }
                if (ControlTablero._lastTableroForRedraw === this.tablero) {
                    ControlTablero.mostrarTablero(this.tablero);
                }
            }
            this._renderRafId = requestAnimationFrame(renderLoop);
        };
        this._renderRafId = requestAnimationFrame(renderLoop);
    }

    /**
     * Inicia el bucle principal del juego
     */
    static iniciarBucleJuego() {
        if (this.enPausa) {
            return;
        }

        let lastTick = 0;
        const bucle = (now) => {
            if (this.enPausa) return;

            const factor = this.factorVelocidad > 0 ? this.factorVelocidad : 1;
            const intervalo = this.velocidadBase / factor;
            if (lastTick > 0 && now - lastTick < intervalo) {
                this._rafId = requestAnimationFrame(bucle);
                return;
            }
            lastTick = now;

            const continuar = ControlTablero.ejecutarTurno(
                this.tablero,
                this.principal,
                this.enemigos
            );

            const hayJugadores = ControlTablero.comprobadorJugadoresPrinvivos(this.principal);
            const hayEnemigos = ControlTablero.comprobadorEnemigosvivos(this.enemigos);

            if (!hayJugadores || !continuar) {
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

            this._rafId = requestAnimationFrame(bucle);
        };

        this._rafId = requestAnimationFrame(bucle);
    }

    /**
     * Calcula cuántos enemigos debe tener la ronda actual.
     * Ronda 1 = 5 enemigos, y en cada ronda aumentan.
     */
    static calcularEnemigosParaRonda() {
        return this.enemigosBasePorRonda + (this.rondaActual - 1) * this.incrementoEnemigosPorRonda;
    }

    /**
     * Inicia (o reinicia) la ronda actual colocando los enemigos en el tablero.
     */
    static iniciarRonda() {
        const cantidadEnemigos = this.calcularEnemigosParaRonda();
        this.enemigos = ControlTablero.crearEnemigosAleatorios(this.tablero, cantidadEnemigos);
        ControlTablero.mostrarTablero(this.tablero);
        ControlTablero.actualizarInfo(this.principal, this.enemigos);
    }

    /**
     * Avanza a la siguiente ronda e inicia sus enemigos.
     */
    static iniciarSiguienteRonda() {
        this.rondaActual += 1;
        this.iniciarRonda();
    }

    /**
     * Muestra el modal de confirmación para pasar de ronda con jugadores restantes.
     */
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

    /**
     * Oculta el modal y continúa con la siguiente ronda.
     */
    static confirmarPasarRonda() {
        const modal = document.getElementById('modal-ronda');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.iniciarSiguienteRonda();
        this.reanudarJuego();
        if (typeof window !== 'undefined' && typeof window.setPausaUI === 'function') {
            window.setPausaUI(false);
        }
    }

    /**
     * Pausa el juego
     */
    static pausarJuego() {
        this.enPausa = true;
        if (this.intervaloJuego) clearTimeout(this.intervaloJuego);
        if (this._rafId != null) cancelAnimationFrame(this._rafId);
        // No cancelar render: sigue dibujando para mantener fluidez
    }

    /**
     * Reanuda el juego
     */
    static reanudarJuego() {
        if (this.enPausa) {
            this.enPausa = false;
            this.iniciarBucleJuego();
        }
    }

    /**
     * Reinicia el juego
     */
    static reiniciarJuego() {
        this.pausarJuego();
        this.iniciarJuego();
        const btnTogglePausa = document.getElementById('btn-toggle-pausa');
        const btnReiniciar = document.getElementById('btn-reiniciar');
        if (btnTogglePausa) btnTogglePausa.disabled = false;
        if (btnReiniciar) btnReiniciar.disabled = false;
    }

    /**
     * Cambia la velocidad del juego mediante un factor
     * factor 1 = normal, >1 más rápido, <1 más lento
     * @param {number} factor 
     */
    static setFactorVelocidad(factor) {
        if (!Number.isFinite(factor) || factor <= 0) {
            return;
        }
        this.factorVelocidad = factor;
    }
}
