import java.util.ArrayList;

public class ControlTablero {

    /**
     * Crea un tablero usando ArrayList
     */
    public static ArrayList<ArrayList<Jugador>> crearTablero(int fila, int columna) {
        ArrayList<ArrayList<Jugador>> tablero = new ArrayList<>();

        for (int i = 0; i < fila; i++) {
            ArrayList<Jugador> filaLista = new ArrayList<>();
            for (int j = 0; j < columna; j++) {
                filaLista.add(null);
            }
            tablero.add(filaLista);
        }
        return tablero;
    }

    /**
     * Introduce un jugador en el tablero
     */
    public static void introducirJugador(ArrayList<ArrayList<Jugador>> tablero, Jugador jug1) {
        tablero.get(jug1.getFila()).set(jug1.getColumna(), jug1);
    }

    /**
     * Mueve un jugador si la casilla está libre
     */
    public static void mover(ArrayList<ArrayList<Jugador>> tablero, Jugador jugPrin, int newFila, int newColumna) {

        if (tablero.get(newFila).get(newColumna) != null) {
            return;
        }

        tablero.get(jugPrin.getFila()).set(jugPrin.getColumna(), null);
        jugPrin.moverJugador(newFila, newColumna);
        tablero.get(newFila).set(newColumna, jugPrin);
    }

    /**
     * Muestra el tablero por consola
     */
    public static void mostrarTablero(ArrayList<ArrayList<Jugador>> tablero) {
        System.out.println("------------------------------");
        System.out.println("      THE DUCK SLAYER");
        System.out.println("------------------------------");

        System.out.print("\033[H\033[2J");
        

        for (int i = 0; i < tablero.size(); i++) {
            for (int j = 0; j < tablero.get(i).size(); j++) {
                Jugador jug = tablero.get(i).get(j);
                if (jug == null) {
                    System.out.print(" ");
                } else {
                    System.out.print(jug.getRepJug() + " ");
                }
            }
            System.out.println();
        }

    }

    /**
     * Movimiento continuo del jugador y enemigos
     */
    public static void perseguirsinParar(ArrayList<ArrayList<Jugador>> tablero,
            Principal jugPrin,
            ArrayList<Enemigo> enemigos) {

        while (jugPrin.getVida() > 0 || comprobadorEnemigosvivos(enemigos)) {

            int newFila = jugPrin.getFila() + (int) (Math.random() * 3) - 1;
            int newColumna = jugPrin.getColumna() + (int) (Math.random() * 3) - 1;

            newFila = Math.max(0, Math.min(newFila, tablero.size() - 1));
            newColumna = Math.max(0, Math.min(newColumna, tablero.get(0).size() - 1));

            mover(tablero, jugPrin, newFila, newColumna);

            for (Enemigo enemigo : enemigos) {
                if (enemigo.isVivo()) {

                    enemigo.perseguirJugador(jugPrin, tablero);

                    boolean combate = false;

                    if (enemigo.getFila() == jugPrin.getFila() - 1 && enemigo.getColumna() == jugPrin.getColumna())
                        combate = true;

                    if (enemigo.getFila() == jugPrin.getFila() + 1 && enemigo.getColumna() == jugPrin.getColumna())
                        combate = true;

                    if (enemigo.getFila() == jugPrin.getFila() && enemigo.getColumna() == jugPrin.getColumna() - 1)
                        combate = true;

                    if (enemigo.getFila() == jugPrin.getFila() && enemigo.getColumna() == jugPrin.getColumna() + 1)
                        combate = true;

                    if (combate) {
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
     * Combate entre jugador y enemigo
     */
    public static boolean combate(ArrayList<ArrayList<Jugador>> tablero, Principal jugPrincipal, Enemigo enemigo) {
        boolean ganar = Math.random() < 0.5;

        if (ganar) {
            System.out.println("Ganan los buenos!");
            enemigo.setVida(0);
            enemigo.setEstaVivo(false);
            tablero.get(enemigo.getFila()).set(enemigo.getColumna(), null);
            return true;
        } else {
            System.out.println("Ganan los malos!");
            jugPrincipal.setVida(0);
            jugPrincipal.setEstaVivo(false);
            return false;
        }
    }

    /**
     * Comprueba si queda algún enemigo vivo
     */
    public static boolean comprobadorEnemigosvivos(ArrayList<Enemigo> enemigos) {
        for (Enemigo e : enemigos) {
            if (e.isVivo()) {
                return true;
            }
        }
        return false;
    }

    public static void generarObstaculos(ArrayList<ArrayList<Jugador>> tablero, int cantidad) {

        int filas = tablero.size();
        int columnas = tablero.get(0).size();

        for (int i = 0; i < cantidad; i++) {

            int newFila, newColumna;

            do {
                newFila = (int) (Math.random() * filas);
                newColumna = (int) (Math.random() * columnas);
            } while (tablero.get(newFila).get(newColumna) != null);

            Obstaculo obstacule = new Obstaculo(newFila, newColumna);
            tablero.get(newFila).set(newColumna, obstacule);
        }
    }

}
