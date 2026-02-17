/**
 * Clase base Jugador
 */
class Jugador {
    constructor(fila, columna, repJug) {
        this.fila = fila;
        this.columna = columna;
        this.repJug = repJug;
        this.estaVivo = true;
    }

    getRepJug() {
        return this.repJug;
    }

    setRepJug(repJug) {
        this.repJug = repJug;
    }

    getFila() {
        return this.fila;
    }

    setFila(fila) {
        this.fila = fila;
    }

    getColumna() {
        return this.columna;
    }

    setColumna(columna) {
        this.columna = columna;
    }

    moverJugador(newFila, newColumna) {
        this.fila = newFila;
        this.columna = newColumna;
    }

    isEstaVivo() {
        return this.estaVivo;
    }

    setEstaVivo(estaVivo) {
        this.estaVivo = estaVivo;
    }
}
