/**
 * combat.js
 * - Gestión de daño
 * - Detección de muerte
 * - Interacciones entre entidades
 */

const Combat = {
    // Coherente con los valores que ya existían en ControlTablero.
    DAÑO_JUGADOR: 25, // daño que inflige el aliado al enemigo
    DAÑO_ENEMIGO: 20, // daño que inflige el enemigo al aliado

    aplicarDaño(entidad, cantidad) {
        if (!entidad) return;
        if (typeof entidad.recibirDano === 'function') {
            entidad.recibirDano(cantidad);
            return;
        }
        // Fallback defensivo por si algún proyectil usa un API distinto.
        if (typeof entidad.getVida === 'function' && typeof entidad.getVidaMax === 'function' && typeof entidad.setVida === 'function') {
            const nuevaVida = entidad.getVida() - cantidad;
            entidad.setVida(nuevaVida);
        }
    },

    hayAliadosVivos(aliados) {
        if (!Array.isArray(aliados)) return false;
        for (const a of aliados) {
            if (a && typeof a.isVivo === 'function' && a.isVivo()) return true;
        }
        return false;
    },

    hayEnemigosVivos(enemigos) {
        if (!Array.isArray(enemigos)) return false;
        for (const e of enemigos) {
            if (e && typeof e.isVivo === 'function' && e.isVivo()) return true;
        }
        return false;
    },

    /**
     * Combate por contacto: aliado y enemigo se infligen daño entre sí.
     * @param {Array<Array<*|null>>} tablero
     * @param {*} aliado
     * @param {*} enemigo
     */
    combatirContacto(tablero, aliado, enemigo) {
        if (!aliado || !enemigo) return;

        // Daño según tipo de atacante (mismo comportamiento que ControlTablero.combate()).
        const dañoA_Enemigo = (typeof aliado.daño === 'number') ? aliado.daño : this.DAÑO_JUGADOR;
        const dañoE_Alio = (typeof enemigo.daño === 'number') ? enemigo.daño : this.DAÑO_ENEMIGO;

        this.aplicarDaño(aliado, dañoE_Alio);
        this.aplicarDaño(enemigo, dañoA_Enemigo);

        if (!aliado.isVivo()) {
            tablero[aliado.getFila()][aliado.getColumna()] = null;
        }
        if (!enemigo.isVivo()) {
            tablero[enemigo.getFila()][enemigo.getColumna()] = null;
        }
    },
};

if (typeof window !== 'undefined') {
    window.Combat = Combat;
}

