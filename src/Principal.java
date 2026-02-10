public class Principal extends Jugador {

    public Principal(int fila, int columna) {
        super(fila, columna, "\u001B[95m █ \u001B[0m");
    }

    public boolean isVivo() {
        return estaVivo;

    }

    public void setVivo(boolean vivo) {
        this.estaVivo = true;
    }

}
