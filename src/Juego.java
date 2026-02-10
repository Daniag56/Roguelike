import java.util.ArrayList;

public class Juego {

    public static void iniciarJuego() {

        ArrayList<ArrayList<Jugador>> tablero = ControlTablero.crearTablero(20, 40);

        
        int numPrincipales = (int)(Math.random() * 3) + 15; 
        int numEnemigos = (int)(Math.random() * 3) + 15;  
        int numObstacu = (int)(Math.random() * 3) + 5;   
        ArrayList<Principal> principal = ControlTablero.crearPrincipalesAleatorios(tablero, numPrincipales);
        ArrayList<Enemigo> enemigos = ControlTablero.crearEnemigosAleatorios(tablero, numEnemigos);
        @SuppressWarnings("unused")
        ArrayList<Obstaculo> obstaculos = ControlTablero.crearObstaculosAleatorios(tablero, numObstacu);
        ControlTablero.perseguirsinParar(tablero, principal, enemigos);
    }
}
