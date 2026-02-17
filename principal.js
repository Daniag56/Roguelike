/**
 * Clase Principal que extiende Jugador
 */
class Principal extends Jugador {
    constructor(fila, columna) {
        // Roguelike clásico: jugador como '@'
        super(fila, columna, "@");
    }

    isVivo() {
        return this.estaVivo;
    }

    setVivo(vivo) {
        this.estaVivo = true;
    }
}
