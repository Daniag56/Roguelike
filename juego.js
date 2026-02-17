/**
 * Clase Juego - Control principal del juego
 */
class Juego {
    static tablero = null;
    static principal = null;
    static enemigos = null;
    static obstaculos = null;
    static intervaloJuego = null;
    static enPausa = false;

    /**
     * Inicia el juego
     */
    static iniciarJuego() {
        // Limpiar juego anterior si existe
        if (this.intervaloJuego) {
            clearTimeout(this.intervaloJuego);
        }

        this.enPausa = false;
        this.tablero = ControlTablero.crearTablero(20, 40);

        // Crear entidades aleatorias
        const numPrincipales = Math.floor(Math.random() * 3) + 15;
        const numEnemigos = Math.floor(Math.random() * 3) + 15;
        const numObstacu = Math.floor(Math.random() * 3) + 5;

        this.principal = ControlTablero.crearPrincipalesAleatorios(this.tablero, numPrincipales);
        this.enemigos = ControlTablero.crearEnemigosAleatorios(this.tablero, numEnemigos);
        this.obstaculos = ControlTablero.crearObstaculosAleatorios(this.tablero, numObstacu);

        // Mostrar tablero inicial
        ControlTablero.mostrarTablero(this.tablero);
        ControlTablero.actualizarInfo(this.principal, this.enemigos);

        // Iniciar bucle del juego
        this.iniciarBucleJuego();
    }

    /**
     * Inicia el bucle principal del juego
     */
    static iniciarBucleJuego() {
        if (this.enPausa) {
            return;
        }

        const bucle = () => {
            if (this.enPausa) {
                return;
            }

            const continuar = ControlTablero.ejecutarTurno(
                this.tablero,
                this.principal,
                this.enemigos
            );

            if (continuar) {
                this.intervaloJuego = setTimeout(bucle, 500);
            } else {
                // El juego terminó
                document.getElementById('btn-pausar').disabled = true;
                document.getElementById('btn-reiniciar').disabled = false;
            }
        };

        bucle();
    }

    /**
     * Pausa el juego
     */
    static pausarJuego() {
        this.enPausa = true;
        if (this.intervaloJuego) {
            clearTimeout(this.intervaloJuego);
        }
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
        document.getElementById('btn-pausar').disabled = false;
        document.getElementById('btn-reiniciar').disabled = false;
    }
}
