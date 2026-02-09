public class Obstaculo extends Jugador {

    public Obstaculo(int fila, int columna) {
        super(0, 0, fila, columna, "X"); 
        this.estaVivo = false; 
    }

    @Override
    public void moverJugador(int f, int c) {
        
    }
}

