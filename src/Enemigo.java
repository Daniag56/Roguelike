import java.util.ArrayList;

public class Enemigo extends Jugador {

    public Enemigo(int fila, int columna) {
        super(100, 25, fila, columna, ":p");
    }

    public boolean isVivo() {
        return estaVivo;
    }

    public void setVivo(boolean vivo) {
        this.estaVivo = vivo;
    }

    /**
     * Perseguir al jugador usando ArrayList
     */
    public void perseguirJugador(Principal jugPrin, ArrayList<ArrayList<Jugador>> tablero) {

        int newFila = fila;
        int newColumna = columna;

        // Movimiento hacia el jugador
        if (jugPrin.getFila() < fila) newFila--;
        else if (jugPrin.getFila() > fila) newFila++;

        if (jugPrin.getColumna() < columna) newColumna--;
        else if (jugPrin.getColumna() > columna) newColumna++;

        // Comprobar límites del tablero
        if (newFila < 0 || newFila >= tablero.size() ||
            newColumna < 0 || newColumna >= tablero.get(0).size()) {
            return;
        }

        // Comprobar si la casilla está libre
        if (tablero.get(newFila).get(newColumna) == null) {

            // Vaciar la casilla anterior
            tablero.get(fila).set(columna, null);

            // Mover al enemigo
            moverJugador(newFila, newColumna);

            // Colocar en la nueva casilla
            tablero.get(newFila).set(newColumna, this);
        }
    }
}

