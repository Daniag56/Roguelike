/**
 * Funciones principales para controlar el juego desde la interfaz
 */

let juegoEnPausa = false;

function iniciarJuego() {
    Juego.iniciarJuego();
    document.getElementById('btn-iniciar').classList.add('hidden');
    document.getElementById('btn-pausar').classList.remove('hidden');
    document.getElementById('btn-reiniciar').classList.remove('hidden');
    document.getElementById('btn-pausar').disabled = false;
    document.getElementById('btn-reiniciar').disabled = false;
    document.getElementById('btn-pausar').textContent = 'Pausar';
    juegoEnPausa = false;

    // Mostrar elementos de juego solo cuando está en marcha
    const legend = document.querySelector('.legend');
    const gameInfo = document.querySelector('.game-info');
    const tableroContainer = document.getElementById('tablero-container');
    const gameBar = document.getElementById('game-bar');
    if (legend) legend.classList.remove('hidden');
    if (gameInfo) gameInfo.classList.remove('hidden');
    if (tableroContainer) tableroContainer.classList.remove('hidden');
    if (gameBar) gameBar.classList.remove('hidden');

    // Velocidad por defecto al iniciar
    setVelocidadNormal();
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
    document.getElementById('btn-pausar').classList.remove('hidden');
    document.getElementById('btn-reiniciar').classList.remove('hidden');
    document.getElementById('btn-iniciar').classList.add('hidden');
    juegoEnPausa = false;

    // Asegurar que la barra de juego y la info sigan visibles tras reiniciar
    const legend = document.querySelector('.legend');
    const gameInfo = document.querySelector('.game-info');
    const tableroContainer = document.getElementById('tablero-container');
    const gameBar = document.getElementById('game-bar');
    if (legend) legend.classList.remove('hidden');
    if (gameInfo) gameInfo.classList.remove('hidden');
    if (tableroContainer) tableroContainer.classList.remove('hidden');
    if (gameBar) gameBar.classList.remove('hidden');

    setVelocidadNormal();
}

// Controles de velocidad de juego
function seleccionarBotonVelocidad(id) {
    const ids = ['vel-lenta', 'vel-normal', 'vel-rapida'];
    ids.forEach(bid => {
        const el = document.getElementById(bid);
        if (el) {
            if (bid === id) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
}

function setVelocidadLenta() {
    Juego.setFactorVelocidad(0.5);
    seleccionarBotonVelocidad('vel-lenta');
}

function setVelocidadNormal() {
    Juego.setFactorVelocidad(1);
    seleccionarBotonVelocidad('vel-normal');
}

function setVelocidadRapida() {
    Juego.setFactorVelocidad(2);
    seleccionarBotonVelocidad('vel-rapida');
}

/**
 * Confirma pasar de ronda (llamado desde el modal).
 */
function confirmarPasarRonda() {
    Juego.confirmarPasarRonda();
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Roguelike Game cargado');
});
