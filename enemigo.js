/**
 * Clase Enemigo que extiende Jugador
 */
class Enemigo extends Jugador {
    constructor(fila, columna) {
        // Roguelike clásico: enemigo como 'E'
        super(fila, columna, "E");
    }

    isVivo() {
        return this.estaVivo;
    }

    setVivo(vivo) {
        this.estaVivo = vivo;
    }

    perseguirJugador(jugPrin, tablero) {
        let newFila = this.fila;
        let newColumna = this.columna;

        if (jugPrin.getFila() < this.fila) {
            newFila--;
        } else if (jugPrin.getFila() > this.fila) {
            newFila++;
        }

        if (jugPrin.getColumna() < this.columna) {
            newColumna--;
        } else if (jugPrin.getColumna() > this.columna) {
            newColumna++;
        }

        if (newFila < 0 || newFila >= tablero.length ||
            newColumna < 0 || newColumna >= tablero[0].length) {
            return;
        }

        if (tablero[newFila][newColumna] === null) {
            tablero[this.fila][this.columna] = null;
            this.moverJugador(newFila, newColumna);
            tablero[newFila][newColumna] = this;
        }
    }
}
