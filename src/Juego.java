import java.util.ArrayList;

public class Juego {

    public static void iniciarJuego() {

        ArrayList<ArrayList<Jugador>> tablero = ControlTablero.crearTablero(20, 20);

        
        int numPrincipales = (int)(Math.random() * 3) + 5; 
        int numEnemigos = (int)(Math.random() * 3) + 5;  
        
        ArrayList<Principal> principal = ControlTablero.crearPrincipalesAleatorios(tablero, numPrincipales);
        ArrayList<Enemigo> enemigos = ControlTablero.crearEnemigosAleatorios(tablero, numEnemigos);
        
        ControlTablero.generarObstaculos(tablero, 5);
        ControlTablero.perseguirsinParar(tablero, principal, enemigos);
    }
}
