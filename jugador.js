/**
 * Clase base Jugador
 */
class Jugador {
    constructor(fila, columna, repJug, vidaMax = 100) {
        this.fila = fila;
        this.columna = columna;
        this.repJug = repJug;
        this.estaVivo = true;
        this.vidaMax = vidaMax;
        this.vida = vidaMax;
    }

    getVida() { return this.vida; }
    getVidaMax() { return this.vidaMax; }
    setVida(v) { this.vida = Math.max(0, Math.min(v, this.vidaMax)); }
    recibirDano(cantidad) {
        this.vida = Math.max(0, this.vida - cantidad);
        if (this.vida <= 0) this.estaVivo = false;
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
