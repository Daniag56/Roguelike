public class Principal extends Jugador{

    public Principal(int fila, int columna) {
        super(5000000, 50, fila, columna, "A");
    }

    public boolean isVivo() { 
        return estaVivo; 

    } public void setVivo(boolean vivo) { 
        this.estaVivo = true; 
    }
   

}
