import java.util.ArrayList;

public class Juego {

    public static void iniciarJuego() {

        ArrayList<ArrayList<Jugador>> tablero = ControlTablero.crearTablero(20, 20);

        Principal principal = new Principal(5, 5);
        ControlTablero.introducirJugador(tablero, principal);

        ArrayList<Enemigo> enemigos = new ArrayList<>();
        enemigos.add(new Enemigo(1, 1));
        enemigos.add(new Enemigo(3, 3));
        enemigos.add(new Enemigo(5, 5));

        for (Enemigo enemigo : enemigos) {
            ControlTablero.introducirJugador(tablero, enemigo);
        }
        ControlTablero.generarObstaculos(tablero, 5);
        ControlTablero.perseguirsinParar(tablero, principal, enemigos);
    }
}
