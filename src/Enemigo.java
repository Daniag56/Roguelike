public class Enemigo extends Jugador {

    public Enemigo(int vida, int potenciaAtaque, int fila, int columna) {
        super(vida, potenciaAtaque, fila, columna);

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
