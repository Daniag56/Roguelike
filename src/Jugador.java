public class Jugador {
    int vida;
    int vidaRegenerada;
    int potenciaAtaque;
    int fila;
    int columna;
    
    public Jugador(int vida, int potenciaAtaque,int fila, int columna) {
        this.vida = vida;
        this.potenciaAtaque = potenciaAtaque;
        this.fila = fila;
        this.columna = columna;
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

    public void moverJugador(int newFila, int newColumna){
        this.fila = newFila;
        this.columna = newColumna;
    }
    @Override
    public String toString() {
        return "Jugador vida=" + vida + ", vidaRegenerada=" + vidaRegenerada
                + ", potenciaAtaque=" + potenciaAtaque + "]";
    }

    
}
