/**
 * Control del tablero y lógica del juego
 */
class ControlTablero {
    /**
     * Crea un tablero usando arrays bidimensionales
     * @param {number} fila 
     * @param {number} columna 
     * @returns {Array<Array<Jugador|null>>}
     */
    static crearTablero(fila, columna) {
        const tablero = [];
        for (let i = 0; i < fila; i++) {
            const filaLista = [];
            for (let j = 0; j < columna; j++) {
                filaLista.push(null);
            }
            tablero.push(filaLista);
        }
        return tablero;
    }

    /**
     * Mueve un jugador si la casilla está libre
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Jugador} jugPrin 
     * @param {number} newFila 
     * @param {number} newColumna 
     */
    static mover(tablero, jugPrin, newFila, newColumna) {
        const destino = tablero[newFila][newColumna];

        if (destino !== null && destino instanceof Obstaculo) {
            return;
        }

        if (destino !== null) {
            return;
        }

        tablero[jugPrin.getFila()][jugPrin.getColumna()] = null;
        jugPrin.moverJugador(newFila, newColumna);
        tablero[newFila][newColumna] = jugPrin;
    }

    /**
     * Muestra el tablero en el DOM
     * @param {Array<Array<Jugador|null>>} tablero 
     */
    static mostrarTablero(tablero) {
        const container = document.getElementById('tablero-container');
        let tabla = document.getElementById('tablero');
        
        if (!tabla) {
            tabla = document.createElement('table');
            tabla.id = 'tablero';
            container.innerHTML = '';
            container.appendChild(tabla);
        }

        // Limpiar tabla existente
        tabla.innerHTML = '';

        for (let i = 0; i < tablero.length; i++) {
            const fila = document.createElement('tr');
            for (let j = 0; j < tablero[i].length; j++) {
                const celda = document.createElement('td');
                const jug = tablero[i][j];
                
                if (jug === null) {
                    celda.className = 'celda-vacia';
                    celda.textContent = ' ';
                } else {
                    if (jug instanceof Principal) {
                        celda.className = 'jugador-principal';
                        celda.textContent = jug.getRepJug();
                    } else if (jug instanceof Enemigo) {
                        celda.className = 'enemigo';
                        celda.textContent = jug.getRepJug();
                    } else if (jug instanceof Obstaculo) {
                        celda.className = 'obstaculo';
                        celda.textContent = jug.getRepJug();
                    }
                }
                fila.appendChild(celda);
            }
            tabla.appendChild(fila);
        }
    }

    /**
     * Ejecuta un turno del juego
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Array<Principal>} jugadores 
     * @param {Array<Enemigo>} enemigos 
     * @returns {boolean} true si el juego debe continuar, false si terminó
     */
    static ejecutarTurno(tablero, jugadores, enemigos) {
        if (!this.comprobadorEnemigosvivos(enemigos) || !this.comprobadorJugadoresPrinvivos(jugadores)) {
            return false;
        }

        // Mover jugadores principales
        for (const prin of jugadores) {
            if (prin.isVivo()) {
                let newFila = prin.getFila() + Math.floor(Math.random() * 3) - 1;
                let newColumna = prin.getColumna() + Math.floor(Math.random() * 3) - 1;

                if (newFila < 0) {
                    newFila = 0;
                } else if (newFila >= tablero.length) {
                    newFila = tablero.length - 1;
                }

                if (newColumna < 0) {
                    newColumna = 0;
                } else if (newColumna >= tablero[0].length) {
                    newColumna = tablero[0].length - 1;
                }

                this.mover(tablero, prin, newFila, newColumna);
            }
        }

        // Mover enemigos
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const enemigo = enemigos[i];

            if (enemigo.isVivo()) {
                let objetivo = null;
                for (const p of jugadores) {
                    if (p.isVivo() && objetivo === null) {
                        objetivo = p;
                    }
                }

                if (objetivo !== null) {
                    enemigo.perseguirJugador(objetivo, tablero);

                    const newFila = enemigo.getFila();
                    const newColumna = enemigo.getColumna();

                    let jug = null;

                    if (newFila > 0 && tablero[newFila - 1][newColumna] instanceof Principal) {
                        jug = tablero[newFila - 1][newColumna];
                    } else if (newFila < tablero.length - 1 && tablero[newFila + 1][newColumna] instanceof Principal) {
                        jug = tablero[newFila + 1][newColumna];
                    } else if (newColumna > 0 && tablero[newFila][newColumna - 1] instanceof Principal) {
                        jug = tablero[newFila][newColumna - 1];
                    } else if (newColumna < tablero[0].length - 1 && tablero[newFila][newColumna + 1] instanceof Principal) {
                        jug = tablero[newFila][newColumna + 1];
                    }

                    if (jug !== null) {
                        this.combate(tablero, jug, enemigo);
                    }
                }
            } else {
                enemigos.splice(i, 1);
            }
        }

        this.mostrarTablero(tablero);
        this.actualizarInfo(jugadores, enemigos);

        return true;
    }

    /**
     * Combate entre jugador y enemigo
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {Principal} jugPrincipal 
     * @param {Enemigo} enemigo 
     * @returns {boolean}
     */
    static combate(tablero, jugPrincipal, enemigo) {
        const ganar = Math.random() < 0.5;

        if (ganar) {
            tablero[enemigo.getFila()][enemigo.getColumna()] = null;
            enemigo.setEstaVivo(false);
            return true;
        } else {
            tablero[jugPrincipal.getFila()][jugPrincipal.getColumna()] = null;
            jugPrincipal.setEstaVivo(false);
            return false;
        }
    }

    /**
     * Comprueba si queda algún enemigo vivo
     * @param {Array<Enemigo>} enemigos 
     * @returns {boolean}
     */
    static comprobadorEnemigosvivos(enemigos) {
        for (const e of enemigos) {
            if (e.isVivo()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Comprueba los jugadores vivos
     * @param {Array<Principal>} jugadores 
     * @returns {boolean}
     */
    static comprobadorJugadoresPrinvivos(jugadores) {
        for (const p of jugadores) {
            if (p.isVivo()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Crea aleatoriamente jugadores principales
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {number} cantidad 
     * @returns {Array<Principal>}
     */
    static crearPrincipalesAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;

            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const principal = new Principal(newFila, newColumna);
            tablero[newFila][newColumna] = principal;
            lista.push(principal);
        }

        return lista;
    }

    /**
     * Crea enemigos aleatoriamente
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {number} cantidad 
     * @returns {Array<Enemigo>}
     */
    static crearEnemigosAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;

            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const enemigo = new Enemigo(newFila, newColumna);
            tablero[newFila][newColumna] = enemigo;
            lista.push(enemigo);
        }

        return lista;
    }

    /**
     * Crea Obstáculos en el tablero
     * @param {Array<Array<Jugador|null>>} tablero 
     * @param {number} cantidad 
     * @returns {Array<Obstaculo>}
     */
    static crearObstaculosAleatorios(tablero, cantidad) {
        const lista = [];
        const filas = tablero.length;
        const columnas = tablero[0].length;

        for (let i = 0; i < cantidad; i++) {
            let newFila, newColumna;

            do {
                newFila = Math.floor(Math.random() * filas);
                newColumna = Math.floor(Math.random() * columnas);
            } while (tablero[newFila][newColumna] !== null);

            const obstacu = new Obstaculo(newFila, newColumna);
            tablero[newFila][newColumna] = obstacu;
            lista.push(obstacu);
        }

        return lista;
    }

    /**
     * Actualiza la información del juego en la interfaz
     * @param {Array<Principal>} jugadores 
     * @param {Array<Enemigo>} enemigos 
     */
    static actualizarInfo(jugadores, enemigos) {
        const jugadoresVivos = jugadores.filter(j => j.isVivo()).length;
        const enemigosVivos = enemigos.filter(e => e.isVivo()).length;

        document.getElementById('jugadores-vivos').textContent = jugadoresVivos;
        document.getElementById('enemigos-vivos').textContent = enemigosVivos;

        if (jugadoresVivos === 0) {
            document.getElementById('estado-juego').textContent = '¡Derrota! Todos los jugadores han muerto.';
            document.getElementById('estado-juego').style.color = '#ff4444';
        } else if (enemigosVivos === 0) {
            document.getElementById('estado-juego').textContent = '¡Victoria! Todos los enemigos han sido derrotados.';
            document.getElementById('estado-juego').style.color = '#4ecdc4';
        } else {
            document.getElementById('estado-juego').textContent = 'En juego...';
            document.getElementById('estado-juego').style.color = '#4ecdc4';
        }
    }
}
