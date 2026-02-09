public class Jugador {
    String repJug;
    int fila;
    int columna;
    protected boolean estaVivo = true;

    public Jugador(int fila, int columna, String repJug) {
        this.fila = fila;
        this.columna = columna;
        this.repJug = repJug;
        this.estaVivo = true;
    }

    public String getRepJug() {
        return repJug;
    }

    public void setRepJug(String repJug) {
        this.repJug = repJug;
    }

    public int getFila() {
        return fila;
    }

    public void setFila(int fila) {
        this.fila = fila;
    }

    public int getColumna() {
        return columna;
    }

    public void setColumna(int columna) {
        this.columna = columna;
    }

    public void moverJugador(int newFila, int newColumna) {
        this.fila = newFila;
        this.columna = newColumna;
    }

    public boolean isEstaVivo() {
        return estaVivo;
    }

    public void setEstaVivo(boolean estaVivo) {
        this.estaVivo = estaVivo;
    }

}
