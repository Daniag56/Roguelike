/**
 * rounds.js
 * - Control de rondas
 * - Eventos especiales (stub: curación/boss) pero sin implementar
 */

const Rounds = {
    rondaActual: 1,

    // Configurable desde game.js, pero con defaults del proyecto original.
    enemigosBasePorRonda: 5,
    incrementoEnemigosPorRonda: 3,

    configurar({ enemigosBasePorRonda, incrementoEnemigosPorRonda } = {}) {
        if (Number.isFinite(enemigosBasePorRonda)) this.enemigosBasePorRonda = enemigosBasePorRonda;
        if (Number.isFinite(incrementoEnemigosPorRonda)) this.incrementoEnemigosPorRonda = incrementoEnemigosPorRonda;
    },

    calcularEnemigosParaRonda() {
        return this.enemigosBasePorRonda + (this.rondaActual - 1) * this.incrementoEnemigosPorRonda;
    },

    /**
     * Fabrica enemigos aleatorios en celdas libres.
     * (Mantiene la lógica original: solo se coloca en null).
     */
    crearEnemigosAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;
            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const enemigo = new Enemy(newFila, newColumna);
            tablero[newFila][newColumna] = enemigo;
            lista.push(enemigo);
        }

        return lista;
    },

    /**
     * Inicia (o reinicia) la ronda actual colocando enemigos en el tablero.
     * @returns {Array<Enemy>}
     */
    iniciarRonda({ tablero } = {}) {
        if (!tablero) return [];
        const cantidadEnemigos = this.calcularEnemigosParaRonda();
        return this.crearEnemigosAleatorios(tablero, cantidadEnemigos);
    },

    iniciarSiguienteRonda({ tablero, enemigos } = {}) {
        this.rondaActual += 1;
        const nuevos = this.iniciarRonda({ tablero });
        if (Array.isArray(enemigos)) enemigos.splice(0, enemigos.length, ...nuevos);
        return nuevos;
    },

    // Placeholder: sin mecánicas nuevas por ahora.
    ejecutarEventoEspecialCuracion(/* params */) { /* noop */ },
    ejecutarEventoEspecialBoss(/* params */) { /* noop */ },

    /**
     * Ejecuta un turno (paso) de la ronda:
     * - mueve aliados aleatoriamente
     * - enemigos persiguen al primer jugador vivo
     * - combate por contacto (solo adyacencia ortogonal, igual que antes)
     * - aliados disparan proyectiles (sin impactos de área)
     *
     * Importante: este método SOLO planifica (lógica discreta) y crea proyectiles.
     * El movimiento continuo (x/y) y los impactos continuos se gestionan en `game.js`
     * usando `Movement.moveEntity()` con deltaTime.
     *
     * @returns {{ continuarJuego: boolean }}
     */
    ejecutarTurno({ tablero, aliados, enemigos, proyectiles } = {}) {
        if (!tablero || !Array.isArray(aliados) || !Array.isArray(enemigos)) {
            return { continuarJuego: false };
        }
        if (!Array.isArray(proyectiles)) proyectiles = [];

        const hayJugadores = Combat.hayAliadosVivos(aliados);
        if (!hayJugadores) {
            return { continuarJuego: false };
        }

        const filas = tablero.length;
        const columnas = tablero[0]?.length ?? 0;

        // Movimiento aleatorio aliados (misma mecánica original, pero planificando destino).
        for (const ali of aliados) {
            if (!ali || typeof ali.isVivo !== 'function' || !ali.isVivo()) continue;

            let newFila = ali.getFila() + Math.floor(Math.random() * 3) - 1;
            let newColumna = ali.getColumna() + Math.floor(Math.random() * 3) - 1;

            if (newFila < 0) newFila = 0;
            else if (newFila >= filas) newFila = filas - 1;
            if (newColumna < 0) newColumna = 0;
            else if (newColumna >= columnas) newColumna = columnas - 1;

            // Bloquear obstáculos / ocupación (igual que antes).
            const destino = tablero[newFila][newColumna];
            if (destino !== null && typeof Obstaculo !== 'undefined' && destino instanceof Obstaculo) continue;
            if (destino !== null) continue;

            const oldF = ali.getFila();
            const oldC = ali.getColumna();
            tablero[oldF][oldC] = null;
            ali.setFila(newFila);
            ali.setColumna(newColumna);
            tablero[newFila][newColumna] = ali;

            ali.target = Movement.cellToWorld(newFila, newColumna);
            ali.moving = true;
        }

        // Movimiento/enemigo y combate: iteración hacia atrás igual que antes.
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const enemigo = enemigos[i];
            if (!enemigo || typeof enemigo.isVivo !== 'function') continue;

            if (!enemigo.isVivo()) {
                // Se elimina del array (comportamiento idéntico al original para enemigos no vivos).
                enemigos.splice(i, 1);
                continue;
            }

            // Elegir objetivo: primer aliado vivo encontrado.
            let objetivo = null;
            for (const p of aliados) {
                if (p && typeof p.isVivo === 'function' && p.isVivo() && objetivo === null) {
                    objetivo = p;
                }
            }

            if (objetivo !== null) {
                // “perseguir” como en `Enemigo.perseguirJugador`: avanza 1 celda por eje (puede ser diagonal)
                // y solo si la celda destino está libre.
                let newFila = enemigo.getFila();
                let newColumna = enemigo.getColumna();

                if (objetivo.getFila() < enemigo.getFila()) newFila--;
                else if (objetivo.getFila() > enemigo.getFila()) newFila++;

                if (objetivo.getColumna() < enemigo.getColumna()) newColumna--;
                else if (objetivo.getColumna() > enemigo.getColumna()) newColumna++;

                const dentro = newFila >= 0 && newFila < filas && newColumna >= 0 && newColumna < columnas;
                if (dentro && tablero[newFila][newColumna] === null) {
                    const oldF = enemigo.getFila();
                    const oldC = enemigo.getColumna();
                    tablero[oldF][oldC] = null;
                    enemigo.setFila(newFila);
                    enemigo.setColumna(newColumna);
                    tablero[newFila][newColumna] = enemigo;

                    enemigo.target = Movement.cellToWorld(newFila, newColumna);
                    enemigo.moving = true;
                }

                const newFilaFinal = enemigo.getFila();
                const newColumnaFinal = enemigo.getColumna();

                // Igual que el código antiguo: se busca solo en una dirección por el else-if.
                let jug = null;
                if (newFilaFinal > 0 && tablero[newFilaFinal - 1][newColumnaFinal] instanceof Ally) {
                    jug = tablero[newFilaFinal - 1][newColumnaFinal];
                } else if (newFilaFinal < filas - 1 && tablero[newFilaFinal + 1][newColumnaFinal] instanceof Ally) {
                    jug = tablero[newFilaFinal + 1][newColumnaFinal];
                } else if (newColumnaFinal > 0 && tablero[newFilaFinal][newColumnaFinal - 1] instanceof Ally) {
                    jug = tablero[newFilaFinal][newColumnaFinal - 1];
                } else if (newColumnaFinal < columnas - 1 && tablero[newFilaFinal][newColumnaFinal + 1] instanceof Ally) {
                    jug = tablero[newFilaFinal][newColumnaFinal + 1];
                }

                if (jug !== null) {
                    Combat.combatirContacto(tablero, jug, enemigo);
                }
            }
        }

        // Disparo automático de aliados: si hay un enemigo en rango, dispara.
        const dispararDesdeAliados = () => {
            for (const ali of aliados) {
                if (!ali || typeof ali.isVivo !== 'function' || !ali.isVivo()) continue;

                const aliF = ali.getFila();
                const aliC = ali.getColumna();
                const rango = Number.isFinite(ali.rango) ? ali.rango : 0;

                let objetivo = null;
                let mejorDist = Infinity;
                for (const e of enemigos) {
                    if (!e || typeof e.isVivo !== 'function' || !e.isVivo()) continue;
                    const dF = Math.abs(e.getFila() - aliF);
                    const dC = Math.abs(e.getColumna() - aliC);
                    const distManhattan = dF + dC;
                    if (distManhattan <= rango && distManhattan < mejorDist) {
                        mejorDist = distManhattan;
                        objetivo = e;
                    }
                }

                if (objetivo) {
                    const p = new Projectile(aliF, aliC, {
                        daño: Number.isFinite(ali.daño) ? ali.daño : 25,
                        velocidad: Number.isFinite(ali.velocidadStep) ? ali.velocidadStep : 1,
                        rangoPasos: Math.max(3, rango + 2),
                        objetivo,
                    });
                    proyectiles.push(p);
                }
            }
        };

        dispararDesdeAliados();

        return { continuarJuego: true };
    },
};

if (typeof window !== 'undefined') {
    window.Rounds = Rounds;
}

