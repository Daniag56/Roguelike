import java.util.ArrayList;

public class ControlTablero {

    /**
     * Crea un tablero usando ArrayList
     * 
     * @param fila,columna
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
     * 
     * @param tablero
     * @param jug1
     */
    public static void introducirJugador(ArrayList<ArrayList<Jugador>> tablero, Jugador jug1) {
        tablero.get(jug1.getFila()).set(jug1.getColumna(), jug1);
    }

    /**
     * Mueve un jugador si la casilla esta libre
     * 
     * @param tablero
     * @param jugPrin
     * @param newFila
     * @param newColumna
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
     * 
     * @param tablero
     */
    public static void mostrarTablero(ArrayList<ArrayList<Jugador>> tablero) {

        System.out.print("\u001b[H\u001b[2J");

        for (int i = 0; i < tablero.size(); i++) {
            for (int j = 0; j < tablero.get(i).size(); j++) {
                Jugador jug = tablero.get(i).get(j);
                if (jug == null) {
                    System.out.print("  ");
                } else {
                    System.out.print(jug.getRepJug() + " ");
                }

            }
            System.out.println();
        }
    }

    /**
     * Movimiento del jugador y enemigos
     * 
     * @param tablero
     * @param jugadores
     * @param enemigos
     */
   public static void perseguirsinParar(ArrayList<ArrayList<Jugador>> tablero, ArrayList<Principal> jugadores,
        ArrayList<Enemigo> enemigos) {

    while (comprobadorEnemigosvivos(enemigos) && comprobadorJugadoresPrinvivos(jugadores)) {

        for (Principal prin : jugadores) {
            if (prin.isVivo()) {

                int newFila = prin.getFila() + (int) (Math.random() * 3) - 1;
                int newColumna = prin.getColumna() + (int) (Math.random() * 3) - 1;

                if (newFila < 0) newFila = 0;
                else if (newFila >= tablero.size()) newFila = tablero.size() - 1;

                if (newColumna < 0) newColumna = 0;
                else if (newColumna >= tablero.get(0).size()) newColumna = tablero.get(0).size() - 1;

                mover(tablero, prin, newFila, newColumna);
            }
        }

        for (int i = 0; i < enemigos.size(); i++) {
            Enemigo enemigo = enemigos.get(i);

            if (enemigo.isVivo()) {

                Principal objetivo = null;
                for (Principal p : jugadores) {
                    if (p.isVivo() && objetivo == null) {
                        objetivo = p;
                    }
                }

                if (objetivo != null) {

                    enemigo.perseguirJugador(objetivo, tablero);

                    int newFila = enemigo.getFila();
                    int newColumna = enemigo.getColumna();

                    Principal jug = null;

                    if (newFila > 0 && tablero.get(newFila - 1).get(newColumna) instanceof Principal)
                        jug = (Principal) tablero.get(newFila - 1).get(newColumna);
                    else if (newFila < tablero.size() - 1 && tablero.get(newFila + 1).get(newColumna) instanceof Principal)
                        jug = (Principal) tablero.get(newFila + 1).get(newColumna);
                    else if (newColumna > 0 && tablero.get(newFila).get(newColumna - 1) instanceof Principal)
                        jug = (Principal) tablero.get(newFila).get(newColumna - 1);
                    else if (newColumna < tablero.get(0).size() - 1 && tablero.get(newFila).get(newColumna + 1) instanceof Principal)
                        jug = (Principal) tablero.get(newFila).get(newColumna + 1);

                    if (jug != null) {
                        combate(tablero, jug, enemigo);
                    }

                }

            } else {
                enemigos.remove(i);
                i--;
            }
        }

        mostrarTablero(tablero);

        try {
            Thread.sleep(500);
        } catch (Exception e) {}
    }
}


    /**
     * Combate entre jugador y enemigo
     * 
     * @param tablero
     * @param jugPrincipal
     * @param enemigo
     */
    public static boolean combate(ArrayList<ArrayList<Jugador>> tablero, Principal jugPrincipal, Enemigo enemigo) {
        boolean ganar = Math.random() < 0.5;

        if (ganar) {
            tablero.get(enemigo.getFila()).set(enemigo.getColumna(), null);
            enemigo.setEstaVivo(false);
            return true;
        } else {
            tablero.get(jugPrincipal.getFila()).set(jugPrincipal.getColumna(), null);
            jugPrincipal.setEstaVivo(false);
            return false;
        }
    }

    /**
     * Comprueba si queda algun enemigo vivo
     * 
     * @param enemigos
     * @return false
     */
    public static boolean comprobadorEnemigosvivos(ArrayList<Enemigo> enemigos) {
        for (Enemigo e : enemigos) {
            if (e.isVivo()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Comprueba los jugadores vivos
     * 
     * @param jugadores
     * @return false
     */
    public static boolean comprobadorJugadoresPrinvivos(ArrayList<Principal> jugadores) {
        for (Principal p : jugadores) {
            if (p.isVivo())
                return true;
        }
        return false;
    }

  
    /**
     * Crea aleatoriamente jugadores principales
     * 
     * @param tablero
     * @param cantidad
     * @return lista
     */
    public static ArrayList<Principal> crearPrincipalesAleatorios(ArrayList<ArrayList<Jugador>> tablero, int cantidad) {
        ArrayList<Principal> lista = new ArrayList<>();

        int filas = tablero.size();
        int columnas = tablero.get(0).size();

        for (int i = 0; i < cantidad; i++) {

            int newFila, newColumna;

            do {
                newFila = (int) (Math.random() * filas);
                newColumna = (int) (Math.random() * columnas);
            } while (tablero.get(newFila).get(newColumna) != null);

            Principal principal = new Principal(newFila, newColumna);
            tablero.get(newFila).set(newColumna, principal);
            lista.add(principal);
        }

        return lista;
    }

    /**
     * Crea enemigos aleatoriamente
     * 
     * @param tablero
     * @param cantidad
     * @return lista
     */
    public static ArrayList<Enemigo> crearEnemigosAleatorios(ArrayList<ArrayList<Jugador>> tablero, int cantidad) {
        ArrayList<Enemigo> lista = new ArrayList<>();

        int filas = tablero.size();
        int columnas = tablero.get(0).size();

        for (int i = 0; i < cantidad; i++) {

            int newFila, newColumna;

            do {
                newFila = (int) (Math.random() * filas);
                newColumna = (int) (Math.random() * columnas);
            } while (tablero.get(newFila).get(newColumna) != null);

            Enemigo enemigo = new Enemigo(newFila, newColumna);
            tablero.get(newFila).set(newColumna, enemigo);
            lista.add(enemigo);
        }

        return lista;
    }

}
