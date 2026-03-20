/**
 * movement.js
 * Movimiento vectorial continuo en coordenadas mundo (x,y en píxeles del canvas).
 *
 * Regla obligatoria:
 *   posición.x += dirección_normalizada.x * velocidad * deltaTime * speedMultiplier
 *   posición.y += dirección_normalizada.y * velocidad * deltaTime * speedMultiplier
 */

const Movement = {
    TILE: 56,
    STOP_EPS_PX: 0.05, // umbral para considerar “llegado” sin teletransporte

    /**
     * getDirection(from, to)
     * @param {{x:number,y:number}} from
     * @param {{x:number,y:number}} to
     * @returns {{x:number,y:number}} vector dirección (no normalizado)
     */
    getDirection(from, to) {
        return {
            x: (to?.x ?? 0) - (from?.x ?? 0),
            y: (to?.y ?? 0) - (from?.y ?? 0),
        };
    },

    /**
     * normalize(vector)
     * @param {{x:number,y:number}} vector
     * @returns {{x:number,y:number}} vector unitario
     */
    normalize(vector) {
        const x = Number.isFinite(vector?.x) ? vector.x : 0;
        const y = Number.isFinite(vector?.y) ? vector.y : 0;
        const len = Math.hypot(x, y);
        if (!len) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    },

    /**
     * moveEntity(entity, target, deltaTime, speedMultiplier)
     * @param {*} entity Debe tener {x, y, velocidad} en píxeles/s
     * @param {{x:number,y:number}} target
     * @param {number} deltaTime segundos
     * @param {number} speedMultiplier factor (x1/x2/x3)
     * @returns {boolean} true si se movió
     */
    moveEntity(entity, target, deltaTime, speedMultiplier) {
        if (!entity || !target) return false;
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) return false;
        if (!Number.isFinite(speedMultiplier) || speedMultiplier <= 0) speedMultiplier = 1;

        if (!Number.isFinite(entity.x) || !Number.isFinite(entity.y)) return false;

        const dir = this.getDirection(entity, target);
        const dist = Math.hypot(dir.x, dir.y);

        // “Llegó” -> no avanzamos más en este frame (evita snapping/teletransporte).
        if (dist <= this.STOP_EPS_PX) {
            entity.moving = false;
            if ('target' in entity) entity.target = null;
            return false;
        }

        const dirN = this.normalize(dir);
        const baseSpeed = Number.isFinite(entity.velocidad) ? entity.velocidad : 0;
        const v = baseSpeed * speedMultiplier;
        if (!Number.isFinite(v) || v <= 0) return false;

        // Distancia a recorrer en este frame.
        const step = v * deltaTime;
        if (step <= 0) return false;

        // Evita overshoot manteniendo continuidad.
        const stepClamped = Math.min(step, dist);

        entity.x += dirN.x * stepClamped;
        entity.y += dirN.y * stepClamped;

        // Si ya casi llegó, lo marcamos como quieto.
        entity.moving = (dist - stepClamped) > this.STOP_EPS_PX;
        return true;
    },

    /**
     * Convierte celda de rejilla -> centro en mundo.
     * @param {number} fila
     * @param {number} columna
     * @param {number} tile
     */
    cellToWorld(fila, columna, tile = Movement.TILE) {
        return {
            x: columna * tile + tile / 2,
            y: fila * tile + tile / 2,
        };
    },
};

// Exponer en global (proyecto sin módulos ES).
if (typeof window !== 'undefined') {
    window.Movement = Movement;
}

