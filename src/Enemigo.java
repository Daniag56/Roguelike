public class Enemigo extends Jugador {

    public Enemigo(int fila, int columna) {
        super(100, 25, fila, columna, ":p");

    }

    public boolean isVivo() { 
        return estaVivo; 

    } public void setVivo(boolean vivo) { 
        this.estaVivo = true; 
    }
   
    public void perseguirJugador(Principal jugPrin, Jugador[][] tablero) {
        int newFila = fila;
        int newColumna = columna;

        if (jugPrin.getFila() < fila) {
            newFila--;
        } else if (jugPrin.getFila() > fila) {
            newFila++;
        }

        if (jugPrin.getColumna() < columna) {
            newColumna--;
        } else if (jugPrin.getColumna() > columna) {
            newColumna++;
        }

        if (newFila < 0 || newFila >= tablero.length || newColumna < 0 || newColumna >= tablero[0].length) {
            return;
        }

        if (tablero[newFila][newColumna] == null) {
            tablero[fila][columna] = null;
            moverJugador(newFila, newColumna);
            tablero[newFila][newColumna] = this;
        }
    }

}
