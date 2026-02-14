// Configuración de Firebase proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyDT4a5y51fPb6Lj-0lzGaAheMSAEX6YqpU",
  authDomain: "webmedica-5732f.firebaseapp.com",
  databaseURL: "https://webmedica-5732f-default-rtdb.firebaseio.com",
  projectId: "webmedica-5732f",
  storageBucket: "webmedica-5732f.firebasestorage.app",
  messagingSenderId: "514093360939",
  appId: "1:514093360939:web:7af0618dcd2a74a226876e",
  measurementId: "G-4GRCG2PC3P"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const storage = firebase.storage();

/**
 * 1. GESTIÓN DE USUARIOS (Login.html)
 * Estructura: usuarios/[profesionales|camilleros|imagenes|jefatura]/[Nombre-DNI]
 */
async function registrarUsuario(rol, datos) {
    // Creamos una clave legible: "Nombre Apellido - 12345678"
    const userKey = `${datos.nombre}-${datos.dni}`.replace(/\./g, ''); 
    
    // Si hay fotos o firmas, se suben a Storage
    if (datos.foto) {
        const fotoRef = storage.ref(`usuarios/${rol}/${userKey}/perfil.jpg`);
        await fotoRef.putString(datos.foto, 'data_url');
        datos.fotoUrl = await fotoRef.getDownloadURL();
    }
    if (datos.firma) {
        const firmaRef = storage.ref(`usuarios/${rol}/${userKey}/firma.png`);
        await firmaRef.putString(datos.firma, 'data_url');
        datos.firmaUrl = await firmaRef.getDownloadURL();
    }

    // Guardar en la subcarpeta correspondiente del rol
    return db.ref(`usuarios/${rol}/${userKey}`).set({
        ...datos,
        fechaRegistro: new Date().toLocaleString()
    });
}

/**
 * 2. GESTIÓN DE PEDIDOS (Medico.html -> Camilleros.html)
 * Estructura: pedidos/[Paciente-DNI]
 */
function crearPedido(pedido) {
    const pedidoKey = `${pedido.paciente}-${pedido.dni}`;
    // Se guarda en carpeta 'pedidos' para que camilleros los vean
    return db.ref(`pedidos/${pedidoKey}`).set({
        ...pedido,
        estado: 'pendiente',
        timestamp: Date.now()
    });
}

/**
 * 3. MOVIMIENTO A IMÁGENES (Camilleros.html -> Imagenes.html)
 * Cuando el camillero pone "En Curso"
 */
function enviarAImagenes(pedido) {
    const pedidoKey = `${pedido.paciente}-${pedido.dni}`;
    // Actualiza estado en pedidos y crea registro en carpeta imagenes
    db.ref(`pedidos/${pedidoKey}`).update({ estado: 'en-curso', camillero: pedido.camillero });
    return db.ref(`imagenes/${pedidoKey}`).set(pedido);
}

/**
 * 4. FINALIZACIÓN E HISTORIAL (Camilleros.html -> Historial.html)
 * Estructura: jefatura/historial/[Paciente-DNI]
 */
function finalizarPedido(pedido) {
    const pedidoKey = `${pedido.paciente}-${pedido.dni}`;
    
    // 1. Lo enviamos al historial de jefatura
    db.ref(`jefatura/historial/${pedidoKey}`).set({
        ...pedido,
        estado: 'finalizado',
        fechaFinalizado: new Date().toLocaleString()
    });

    // 2. Limpiamos las carpetas de tránsito (pedidos activos e imágenes)
    db.ref(`pedidos/${pedidoKey}`).remove();
    db.ref(`imagenes/${pedidoKey}`).remove();
}

/**
 * 5. ESCUCHADORES EN TIEMPO REAL (Para todas las páginas)
 */
function escucharPedidos(callback) {
    db.ref('pedidos').on('value', snapshot => {
        const data = snapshot.val();
        callback(data ? Object.values(data) : []);
    });
}

function escucharImagenes(callback) {
    db.ref('imagenes').on('value', snapshot => {
        const data = snapshot.val();
        callback(data ? Object.values(data) : []);
    });
}

function consultarHistorial(callback) {
    db.ref('jefatura/historial').on('value', snapshot => {
        const data = snapshot.val();
        callback(data ? Object.values(data) : []);
    });
}
