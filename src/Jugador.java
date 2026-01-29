public class Jugador {
    int vida;
    String repJug;
    int vidaRegenerada;
    int potenciaAtaque;
    int fila;
    int columna;
    protected boolean estaVivo = true;

    public Jugador(int vida, int potenciaAtaque, int fila, int columna, String repJug) {
        this.vida = vida;
        this.potenciaAtaque = potenciaAtaque;
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

    public int getVidaRegenerada() {
        return vidaRegenerada;
    }

    public void setVidaRegenerada(int vidaRegenerada) {
        this.vidaRegenerada = vidaRegenerada;
    }

    public int getVida() {
        return vida;
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

    public void setVida(int vida) {
        this.vida = vida;
    }

    public int getPotenciaAtaque() {
        return potenciaAtaque;
    }

    public void setPotenciaAtaque(int potenciaAtaque) {
        this.potenciaAtaque = potenciaAtaque;
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
