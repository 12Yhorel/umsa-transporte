/**
 * Middleware para cancelar peticiones duplicadas/concurrentes
 * Cuando llega una nueva petición al mismo endpoint, cancela la anterior
 */

// Mapa para almacenar peticiones activas por clave única (usuario + endpoint)
const peticionesActivas = new Map();

/**
 * Genera una clave única basada en el usuario y el endpoint
 */
function generarClave(req) {
    // Extraer usuario del token si existe
    const usuario = req.user?.id || req.headers['x-client-id'] || req.ip || 'anonimo';
    
    // Normalizar la URL sin parámetros de paginación para algunos endpoints
    const url = req.originalUrl || req.url;
    const baseUrl = url.split('?')[0];
    const query = url.split('?')[1] || '';
    
    // Para endpoints de listado, ignorar paginación en la clave
    // así cualquier cambio de filtro cancela la petición anterior
    let claveUrl = baseUrl;
    
    if (query) {
        const params = new URLSearchParams(query);
        // Mantener solo filtros importantes, no pagina/limite
        const filtros = [];
        for (const [key, value] of params.entries()) {
            if (!['pagina', 'limite', 'timestamp', '_'].includes(key)) {
                filtros.push(`${key}=${value}`);
            }
        }
        if (filtros.length > 0) {
            claveUrl += '?' + filtros.sort().join('&');
        }
    }
    
    return `${usuario}:${req.method}:${claveUrl}`;
}

/**
 * Middleware que cancela peticiones anteriores del mismo tipo
 */
function cancelarPeticionesAnteriores() {
    return (req, res, next) => {
        // Solo aplicar a rutas API específicas (GET principalmente)
        if (!req.path.startsWith('/api/') || req.method !== 'GET') {
            return next();
        }

        // Generar clave única para esta petición
        const clave = generarClave(req);
        
        // Si existe una petición anterior con la misma clave, cancelarla INMEDIATAMENTE
        const peticionAnterior = peticionesActivas.get(clave);
        if (peticionAnterior) {
            console.log(`[CANCEL] Cancelando petición anterior: ${clave}`);
            
            try {
                // Cerrar la conexión inmediatamente
                if (peticionAnterior.res && !peticionAnterior.res.headersSent) {
                    peticionAnterior.res.status(499).end();
                }
                
                // Destruir el socket si existe
                if (peticionAnterior.req.socket && !peticionAnterior.req.socket.destroyed) {
                    peticionAnterior.req.socket.destroy();
                }
            } catch (err) {
                // Ignorar errores de cancelación
            }
        }

        // Guardar referencia a esta petición con req y res
        const registroPeticion = { req, res, timestamp: Date.now() };
        peticionesActivas.set(clave, registroPeticion);

        // Limpiar cuando termine esta petición
        const limpiar = () => {
            const actual = peticionesActivas.get(clave);
            // Solo eliminar si sigue siendo esta petición
            if (actual === registroPeticion) {
                peticionesActivas.delete(clave);
            }
        };

        // Eventos de finalización
        res.on('finish', limpiar);
        res.on('close', limpiar);
        res.on('error', limpiar);

        next();
    };
}

/**
 * Limpia peticiones huérfanas periódicamente
 */
function limpiarPeticionesHuerfanas() {
    setInterval(() => {
        const ahora = Date.now();
        for (const [clave, registro] of peticionesActivas.entries()) {
            // Si la petición tiene más de 10 segundos, eliminarla
            if (ahora - registro.timestamp > 10000) {
                console.log(`[CLEANUP] Limpiando petición huérfana: ${clave}`);
                try {
                    if (registro.res && !registro.res.headersSent) {
                        registro.res.status(408).end(); // Request Timeout
                    }
                } catch (err) {
                    // Ignorar errores
                }
                peticionesActivas.delete(clave);
            }
        }
    }, 5000); // Cada 5 segundos
}

// Iniciar limpieza automática
limpiarPeticionesHuerfanas();

module.exports = {
    cancelarPeticionesAnteriores,
    generarClave
};
