import java.util.Arrays;

public class ControlTablero {
    /**
     * 
     * @param fila    tamaño de la fila
     * @param columna tamaño de la columna
     * @param tablero tablero con el tamaño seleccionado
     * @return matriz completa con filas y columnas
     */
    public static int[][] crearTablero(int fila, int columna, int[][] tablero) {
        return tablero = new int[fila][columna];
    }
    /**
     * 
     * @param tablero
     * @param jug1
     */
    public static void introducirJugador(Jugador[][] tablero, Jugador jug1) {
        tablero[jug1.getFila()][jug1.getColumna()] = jug1;
    }
    public static void mover(Jugador[][] tablero, Jugador jugPrin,int newFila, int newColumna){
        tablero[jugPrin.getFila()][jugPrin.getColumna()] = null;
        jugPrin.moverJugador(newFila, newColumna);
        tablero[newFila][newColumna] = jugPrin;
    }
    /**
     * 
     * @param tablero
     * @return tablero
     */
    public static Jugador[][] mostrarTablero(Jugador[][] tablero) {
        for (Jugador[] is : tablero) {
            System.out.println(Arrays.toString(is));
        }
        return tablero;
    }

    public static void sinParar(Jugador[][] tablero, Principal jugPrin,Enemigo[]enemigos) {
        while (jugPrin.getVida() < 1) {
            int newFila = (int) (Math.random() * tablero.length);
            int newColumna = (int) (Math.random() * tablero.length);
            mover(tablero, jugPrin, newFila, newColumna);

           for (Enemigo enemigo : enemigos) {
            enemigo.perseguirJugador(jugPrin, tablero);
           }

           mostrarTablero(tablero);

           try {
            Thread.sleep(500);
           } catch (Exception e) {
            
           }
        }
    }
}
