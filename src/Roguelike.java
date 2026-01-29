public class Roguelike {
    public static void main(String[] args) throws Exception {
        Jugador[][] tablero = ControlTablero.crearTablero(20, 20);
        Principal principal = new Principal(5, 5);
        ControlTablero.introducirJugador(tablero, principal);


        Enemigo[] enemigos ={new Enemigo(1, 1), new Enemigo(3, 3), new Enemigo(5, 5)};

        for (Enemigo enemigo : enemigos) {
            ControlTablero.introducirJugador(tablero, enemigo);
        }

        ControlTablero.perseguirsinParar(tablero, principal, enemigos);
    }
}
