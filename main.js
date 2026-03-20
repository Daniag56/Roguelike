/**
 * Funciones principales para controlar el juego desde la interfaz
 */

let juegoEnPausa = false;

// --- Música ---
let _musicInit = false;
let _musicMode = 'menu'; // 'menu' | 'game'
let _audioMenu = null;
let _audioGame = null;

function _initMusic() {
    if (_musicInit) return;
    _musicInit = true;

    // OJO: nombres de archivo con espacios.
    _audioMenu = new Audio('Music/Music menu.mp3');
    _audioGame = new Audio('Music/Music juego.mp3');

    _audioMenu.loop = true;
    _audioGame.loop = true;

    // Volumen moderado por defecto.
    _audioMenu.volume = 0.6;
    _audioGame.volume = 0.6;
}

function _tryPlay(audio) {
    try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
        // Autoplay policies pueden bloquear: ignoramos.
    }
}

function playMenuMusic() {
    _initMusic();
    _musicMode = 'menu';
    if (_audioGame) {
        _audioGame.pause();
    }
    if (_audioMenu) {
        _tryPlay(_audioMenu);
    }
}

function playGameMusic() {
    _initMusic();
    _musicMode = 'game';
    if (_audioMenu) {
        _audioMenu.pause();
    }
    if (_audioGame) {
        _tryPlay(_audioGame);
    }
}

function pauseMusic() {
    try {
        if (_audioMenu) _audioMenu.pause();
        if (_audioGame) _audioGame.pause();
    } catch (e) {
        // Ignorar
    }
}

function resumeMusic() {
    if (_musicMode === 'menu') playMenuMusic();
    else playGameMusic();
}

function iniciarJuego() {
    document.body.classList.add('game-running');
    juegoEnPausa = false;

    // UI del juego (mostrar antes para que veas errores también)
    const menu = document.getElementById('main-menu');
    if (menu) menu.classList.add('hidden');
    const gameInfo = document.querySelector('.game-info');
    const tableroContainer = document.getElementById('tablero-container');
    const controlsBottom = document.getElementById('controls-bottom');
    if (gameInfo) gameInfo.classList.remove('hidden');
    if (tableroContainer) tableroContainer.classList.remove('hidden');
    if (controlsBottom) controlsBottom.classList.remove('hidden');

    const estado = document.getElementById('estado-juego');

    try {
        if (typeof Juego === 'undefined' || !Juego || typeof Juego.iniciarJuego !== 'function') {
            if (estado) estado.textContent = 'Error: `Juego` no está cargado.';
            console.error('Juego no cargado o iniciarJuego no es función');
            return;
        }

        // Diagnóstico rápido de script exportados (sin depender de consola).
        if (typeof window === 'undefined' || typeof window.Renderer === 'undefined') {
            if (estado) {
                const diag = window?.__RENDERER_DEFINED__;
                const ran = window?.__RENDERER_SCRIPT_RAN__;
                const onload = window?.__RENDERER_ONLOAD__;
                const onerror = window?.__RENDERER_ONERROR__;
                estado.textContent = `Error: \`window.Renderer\` no está definido. Renderer ran: ${ran} | marcador renderer: ${diag} | onload=${onload} | onerror=${onerror}`;
            }
            console.error('window.Renderer no definido');
            return;
        }

        if (estado) estado.textContent = 'Iniciando...';
        playGameMusic();
        Juego.iniciarJuego();
    } catch (e) {
        console.error(e);
        if (estado) estado.textContent = `Error al iniciar: ${e?.message || e}`;
        return;
    }

    const btnTogglePausa = document.getElementById('btn-toggle-pausa');
    if (btnTogglePausa) {
        btnTogglePausa.disabled = false;
        btnTogglePausa.textContent = 'PAUSAR';
    }

    // Velocidad por defecto al iniciar
    setVelocidadX1();
}

function salirPrograma() {
    // En navegadores, `window.close()` solo funciona en casos concretos.
    // Igual lo intentamos, pero garantizamos un "salir" funcional volviendo al menú.
    try {
        window.close();
    } catch (e) {
        // Ignorar
    }

    // Detener render/lógica para que no siga consumiendo recursos.
    try {
        if (typeof Juego !== 'undefined') {
            Juego.enPausa = true;
            if (Juego._rafId != null) cancelAnimationFrame(Juego._rafId);
            if (Juego._renderRafId != null) cancelAnimationFrame(Juego._renderRafId);
        }
    } catch (e) {
        // Ignorar
    }

    // Volvemos a menú: música de menú.
    playMenuMusic();

    // Volver a la pantalla de menú
    const menu = document.getElementById('main-menu');
    if (menu) menu.classList.remove('hidden');

    document.body.classList.remove('game-running');
    const gameInfo = document.querySelector('.game-info');
    const tableroContainer = document.getElementById('tablero-container');
    const controlsBottom = document.getElementById('controls-bottom');
    if (gameInfo) gameInfo.classList.add('hidden');
    if (tableroContainer) tableroContainer.classList.add('hidden');
    if (controlsBottom) controlsBottom.classList.add('hidden');

    const btnTogglePausa = document.getElementById('btn-toggle-pausa');
    if (btnTogglePausa) btnTogglePausa.textContent = 'PAUSAR';

    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function pausarJuego() {
    if (juegoEnPausa) return;
    Juego.pausarJuego();
    juegoEnPausa = true;
    setPausaUI(true);
    pauseMusic();
}

function togglePausa() {
    if (juegoEnPausa) reanudarJuego();
    else pausarJuego();
}

function setPausaUI(isPausa) {
    const btnTogglePausa = document.getElementById('btn-toggle-pausa');
    if (!btnTogglePausa) return;
    btnTogglePausa.textContent = isPausa ? 'REANUDAR' : 'PAUSAR';
}

function reanudarJuego() {
    if (!juegoEnPausa) return;
    Juego.reanudarJuego();
    juegoEnPausa = false;
    setPausaUI(false);
    resumeMusic();
}

function reiniciarJuego() {
    document.body.classList.add('game-running');
    const menu = document.getElementById('main-menu');
    if (menu) menu.classList.add('hidden');

    Juego.reiniciarJuego();
    juegoEnPausa = false;

    const gameInfo = document.querySelector('.game-info');
    const tableroContainer = document.getElementById('tablero-container');
    const controlsBottom = document.getElementById('controls-bottom');
    if (gameInfo) gameInfo.classList.remove('hidden');
    if (tableroContainer) tableroContainer.classList.remove('hidden');
    if (controlsBottom) controlsBottom.classList.remove('hidden');

    const btnTogglePausa = document.getElementById('btn-toggle-pausa');
    if (btnTogglePausa) {
        btnTogglePausa.disabled = false;
        btnTogglePausa.textContent = 'PAUSAR';
    }

    setVelocidadX1();
    // Reinicio => música de juego.
    playGameMusic();
}

function seleccionarVelocidadPanel(id) {
    const ids = ['btn-vel-x1', 'btn-vel-x2', 'btn-vel-x3'];
    ids.forEach((bid) => {
        const el = document.getElementById(bid);
        if (!el) return;
        if (bid === id) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function setVelocidadX1() {
    Juego.setFactorVelocidad(1);
    seleccionarVelocidadPanel('btn-vel-x1');
}

function setVelocidadX2() {
    Juego.setFactorVelocidad(2);
    seleccionarVelocidadPanel('btn-vel-x2');
}

function setVelocidadX3() {
    Juego.setFactorVelocidad(3);
    seleccionarVelocidadPanel('btn-vel-x3');
}

/**
 * Confirma pasar de ronda (llamado desde el modal).
 */
function confirmarPasarRonda() {
    Juego.confirmarPasarRonda();
    // El modal reanuda el juego; actualizamos la UI.
    juegoEnPausa = false;
    setPausaUI(false);
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Roguelike Game cargado');
    // En el menú: música de menú. Autoplay puede bloquear hasta el primer click.
    playMenuMusic();
});
