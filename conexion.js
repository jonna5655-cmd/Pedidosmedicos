import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- FUNCIÓN DE REGISTRO ---
export async function registrarUsuario(tipo, datos) {
    let path = "";
    let id = "";

    if (tipo === 'profesional') {
        // Formato: usuarios/profesionales/Nombre_DNI
        id = `${datos.nombre.replace(/\s/g, '_')}_${datos.dni}`;
        path = `usuarios/profesionales/${id}`;
    } else {
        // Formato: usuarios/camilleros/Email_limpio
        id = datos.email.replace(/[.#$[\]]/g, "_");
        path = `usuarios/camilleros/${id}`;
    }

    try {
        await set(ref(db, path), datos);
        alert("Registro guardado en Firebase exitosamente.");
        return true;
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error al guardar en la base de datos.");
        return false;
    }
}

// --- FUNCIÓN DE LOGIN ---
export async function validarLogin(rol, email, pass) {
    // Casos especiales fijos
    if (rol === 'imagenes' && pass === "Imagenes26") return { success: true, redirect: 'imagenes.html' };
    if (rol === 'jefatura' && pass === "Historial26") return { success: true, redirect: 'historial.html' };

    const folder = rol === 'profesional' ? 'profesionales' : 'camilleros';
    
    try {
        const snapshot = await get(child(ref(db), `usuarios/${folder}`));
        if (snapshot.exists()) {
            const usuarios = snapshot.val();
            for (let id in usuarios) {
                if (usuarios[id].email === email && usuarios[id].password === pass) {
                    localStorage.setItem('usuario-actual', JSON.stringify(usuarios[id]));
                    const destino = rol === 'profesional' ? 'medico.html' : 'camilleros.html';
                    return { success: true, redirect: destino };
                }
            }
        }
        alert("Credenciales incorrectas.");
        return { success: false };
    } catch (error) {
        alert("Error de conexión con la base de datos.");
        return { success: false };
    }
}
