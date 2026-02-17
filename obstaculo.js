/**
 * Clase Obstaculo que extiende Jugador
 */
class Obstaculo extends Jugador {
    constructor(fila, columna) {
        // Roguelike clásico: muro/obstáculo como '#'
        super(fila, columna, "#");
    }
}
