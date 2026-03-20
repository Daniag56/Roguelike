/**
 * entities.js
 * - Clases: Ally, Enemy, Boss, Projectile
 * - Atributos: vida, daño, velocidad, posición, rango, etc.
 *
 * Nota: el proyecto actual usa una rejilla (fila/columna). Aquí se mantiene
 * esa misma interfaz para que el renderer/movimiento/combate no cambien mecánicas.
 */

const TILE = 56; // debe coincidir con Movement.TILE

class Ally extends Jugador {
    constructor(fila, columna, opts = {}) {
        const vidaMax = Number.isFinite(opts.vidaMax) ? opts.vidaMax : 100;
        super(fila, columna, "@", vidaMax);

        this.daño = Number.isFinite(opts.daño) ? opts.daño : 25; // daño por turno (aliado -> enemigo)
        // velocidadStep se convertirá a píxeles/s en game.js
        this.velocidadStep = Number.isFinite(opts.velocidad) ? opts.velocidad : 1;
        this.velocidad = this.velocidadStep; // placeholder hasta que game.js la convierta
        // Rango de disparo (en distancia Manhattan en rejilla).
        this.rango = Number.isFinite(opts.rango) ? opts.rango : 6;

        // Estado de movimiento continuo (render).
        this.x = columna * TILE + TILE / 2;
        this.y = fila * TILE + TILE / 2;
        this.target = null; // {x,y}
        this.moving = false;
    }

    isVivo() {
        return this.estaVivo;
    }

    setVivo(vivo) {
        this.estaVivo = !!vivo;
    }
}

class Enemy extends Jugador {
    constructor(fila, columna, opts = {}) {
        const vidaMax = Number.isFinite(opts.vidaMax) ? opts.vidaMax : 100;
        super(fila, columna, "E", vidaMax);

        this.daño = Number.isFinite(opts.daño) ? opts.daño : 20; // daño por turno (enemigo -> aliado)
        this.velocidadStep = Number.isFinite(opts.velocidad) ? opts.velocidad : 1;
        this.velocidad = this.velocidadStep; // placeholder hasta que game.js la convierta
        this.rango = Number.isFinite(opts.rango) ? opts.rango : 1;

        this.x = columna * TILE + TILE / 2;
        this.y = fila * TILE + TILE / 2;
        this.target = null;
        this.moving = false;
    }

    isVivo() {
        return this.estaVivo;
    }

    setVivo(vivo) {
        this.estaVivo = !!vivo;
    }

    /**
     * Mantiene compatibilidad con el API viejo (por si queda algún código no refactorizado).
     * Este método NO mueve x/y; solo planifica un destino lógico y objetivo de render.
     */
    perseguirJugador(jugPrin, tablero) {
        if (!tablero || !jugPrin) return;
        let newFila = this.fila;
        let newColumna = this.columna;

        if (jugPrin.getFila() < this.fila) newFila--;
        else if (jugPrin.getFila() > this.fila) newFila++;

        if (jugPrin.getColumna() < this.columna) newColumna--;
        else if (jugPrin.getColumna() > this.columna) newColumna++;

        if (newFila < 0 || newFila >= tablero.length || newColumna < 0 || newColumna >= tablero[0].length) {
            return;
        }

        if (tablero[newFila][newColumna] === null) {
            tablero[this.fila][this.columna] = null;
            this.setFila(newFila);
            this.setColumna(newColumna);
            tablero[newFila][newColumna] = this;

            this.target = { x: newColumna * TILE + TILE / 2, y: newFila * TILE + TILE / 2 };
            this.moving = true;
        }
    }
}

// Siguiente jefe: por ahora es un stub (no se instancia aún).
class Boss extends Enemy {
    constructor(fila, columna, opts = {}) {
        super(fila, columna, opts);
        // Sin mecánicas nuevas: cualquier ajuste de stats queda a futuro.
    }
}

// Proyectil del aliado (rayo/bala). Se mueve con Movement.moveEntity.
class Projectile {
    constructor(fila, columna, opts = {}) {
        this.fila = fila;
        this.columna = columna;

        this.daño = Number.isFinite(opts.daño) ? opts.daño : 10;
        this.velocidadStep = Number.isFinite(opts.velocidad) ? opts.velocidad : 1;
        this.velocidad = this.velocidadStep; // placeholder hasta game.js (px/s)

        // Rango (para desaparecer si no impacta). Convertimos a píxeles.
        this.rangoPasos = Number.isFinite(opts.rangoPasos) ? opts.rangoPasos : 10;
        this.rangoPx = this.rangoPasos * TILE;
        this.recorridoPx = 0;

        this.objetivo = opts.objetivo ?? null;
        this.estaVivo = true;

        this.x = columna * TILE + TILE / 2;
        this.y = fila * TILE + TILE / 2;
        this.target = null; // se recalcula hacia el enemigo cada frame
        this.moving = true;

        this.hitRadius = TILE * 0.18;
    }

    getFila() {
        return Math.floor((this.y - TILE / 2) / TILE);
    }

    getColumna() {
        return Math.floor((this.x - TILE / 2) / TILE);
    }

    isVivo() {
        return this.estaVivo;
    }

    setObjetivo(objetivo) {
        this.objetivo = objetivo ?? null;
    }
}

if (typeof window !== 'undefined') {
    window.Ally = Ally;
    window.Enemy = Enemy;
    window.Boss = Boss;
    window.Projectile = Projectile;
}

