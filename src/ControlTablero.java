public class ControlTablero {
    /**
     * 
     * @param fila    tamaño de la fila
     * @param columna tamaño de la columna
     * @param tablero tablero con el tamaño seleccionado
     * @return matriz completa con filas y columnas
     */
    public static Jugador[][] crearTablero(int fila, int columna) {
        return new Jugador[fila][columna];
    }

    /**
     * 
     * @param tablero
     * @param jug1
     */
    public static void introducirJugador(Jugador[][] tablero, Jugador jug1) {
        tablero[jug1.getFila()][jug1.getColumna()] = jug1;
    }

    public static void mover(Jugador[][] tablero, Jugador jugPrin, int newFila, int newColumna) {

        if (tablero[newFila][newColumna] != null) {
            return;
        }

        tablero[jugPrin.getFila()][jugPrin.getColumna()] = null;
        jugPrin.moverJugador(newFila, newColumna);
        tablero[newFila][newColumna] = jugPrin;
    }

    /**
     * 
     * @param tablero
     * @return muestra el tablero matriz de la clase padre Jugadores relleno con los
     *         enemigos y su jugador principal
     */
    public static Jugador[][] mostrarTablero(Jugador[][] tablero) {
        System.out.println("------------------------------");
        System.out.println("      THE DUCK SLAYER");
        System.out.println("------------------------------");
        for (int i = 0; i < tablero.length; i++) {
            for (int j = 0; j < tablero[i].length; j++) {
                String simbolo = ".";
                if (tablero[i][j] != null) {
                    simbolo = tablero[i][j].getRepJug();
                } else {

                }
                System.out.printf("%-2s", simbolo);
            }
            System.out.println();
        }
        System.out.println("------------------------------");
        return tablero;
    }

    /**
     * 
     * @param tablero
     * @param jugPrin
     * @param enemigos
     */
    public static void perseguirsinParar(Jugador[][] tablero, Principal jugPrin, Enemigo[] enemigos) {
        while (jugPrin.getVida() > 0 || comprobadorEnemigosvivos(enemigos) ) {

            int newFila = jugPrin.getFila() + (int) (Math.random() * 3) - 1;
            int newColumna = jugPrin.getColumna() + (int) (Math.random() * 3) - 1;

            newFila = Math.max(0, Math.min(newFila, tablero.length - 1));
            newColumna = Math.max(0, Math.min(newColumna, tablero[0].length - 1));

            mover(tablero, jugPrin, newFila, newColumna);
            for (Enemigo enemigo : enemigos) {
                if (enemigo.isVivo()) {
                    enemigo.perseguirJugador(jugPrin, tablero);
                    if (enemigo.getFila() == jugPrin.getFila() - 1 && enemigo.getColumna() == jugPrin.getColumna()) {
                        boolean sigueVivo = combate(tablero, jugPrin, enemigo);
                        if (!sigueVivo) {
                            System.out.println("Los enemigos han ganado la partida.");
                        }
                    }
                    if (enemigo.getFila() == jugPrin.getFila() + 1 && enemigo.getColumna() == jugPrin.getColumna()) {
                        boolean sigueVivo = combate(tablero, jugPrin, enemigo);
                        if (!sigueVivo) {
                            System.out.println("Los enemigos han ganado la partida.");

                        }
                    }
                    if (enemigo.getFila() == jugPrin.getFila() && enemigo.getColumna() == jugPrin.getColumna() - 1) {
                        boolean sigueVivo = combate(tablero, jugPrin, enemigo);
                        if (!sigueVivo) {
                            System.out.println("Los enemigos han ganado la partida.");

                        }
                    }
                    if (enemigo.getFila() == jugPrin.getFila() && enemigo.getColumna() == jugPrin.getColumna() + 1) {
                        boolean sigueVivo = combate(tablero, jugPrin, enemigo);
                        if (!sigueVivo) {
                            System.out.println("Los enemigos han ganado la partida.");
                        }
                    }
                }
            }
            mostrarTablero(tablero);
            try {
                Thread.sleep(500);

            } catch (Exception e) {

            }
        }
    }

    /**
     * 
     * @param tablero
     * @param jugPrincipal
     * @param enemigo
     * @return true or false
     */
    public static boolean combate(Jugador[][] tablero, Principal jugPrincipal, Enemigo enemigo) {
        boolean ganar = Math.random() < 0.5;

        if (ganar) {
            System.out.println("Ganan los buenos!");
            enemigo.setVida(0);
            enemigo.setEstaVivo(false);
            tablero[enemigo.getFila()][enemigo.getColumna()] = null;
            return true;
        } else {
            System.out.println("Ganan los malos!");
            jugPrincipal.setVida(0);
            jugPrincipal.setEstaVivo(false);
            return false;
        }
    }

    public static boolean comprobadorEnemigosvivos(Enemigo[] enemigos) {
        for (Enemigo e : enemigos) {
            if (e.isVivo()) {
                return true;
            }
        }
        return false;
    }
}
