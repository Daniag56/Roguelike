import java.util.ArrayList;

public class Enemigo extends Jugador {

    public Enemigo(int fila, int columna) {
        super(fila, columna, "\u001B[96m :p \u001B[0m");
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

        if (jugPrin.getFila() < fila)
            newFila--;
        else if (jugPrin.getFila() > fila)
            newFila++;

        if (jugPrin.getColumna() < columna)
            newColumna--;
        else if (jugPrin.getColumna() > columna)
            newColumna++;

        if (newFila < 0 || newFila >= tablero.size() ||
                newColumna < 0 || newColumna >= tablero.get(0).size()) {
            return;
        }

        if (tablero.get(newFila).get(newColumna) == null) {

            tablero.get(fila).set(columna, null);

            moverJugador(newFila, newColumna);

            tablero.get(newFila).set(newColumna, this);
        }
    }
}
