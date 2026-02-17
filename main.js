/**
 * Funciones principales para controlar el juego desde la interfaz
 */

let juegoEnPausa = false;

function iniciarJuego() {
    Juego.iniciarJuego();
    document.getElementById('btn-iniciar').disabled = true;
    document.getElementById('btn-pausar').disabled = false;
    document.getElementById('btn-reiniciar').disabled = false;
    juegoEnPausa = false;
}

function pausarJuego() {
    if (juegoEnPausa) {
        Juego.reanudarJuego();
        document.getElementById('btn-pausar').textContent = 'Pausar';
        juegoEnPausa = false;
    } else {
        Juego.pausarJuego();
        document.getElementById('btn-pausar').textContent = 'Reanudar';
        juegoEnPausa = true;
    }
}

function reiniciarJuego() {
    Juego.reiniciarJuego();
    document.getElementById('btn-pausar').textContent = 'Pausar';
    juegoEnPausa = false;
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Roguelike Game cargado');
});
