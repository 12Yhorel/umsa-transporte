const mysql = require('mysql2/promise');
require('dotenv').config();

const configuracionBD = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_transporte_umsa',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 100,  // Aumentado significativamente
  queueLimit: 0,  // Sin límite de cola
  maxIdle: 20,  // Más conexiones idle disponibles
  idleTimeout: 30000,  // 30 segundos antes de cerrar conexión idle
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
  connectTimeout: 10000,  // 10 segundos para conectar
  multipleStatements: false,  // Seguridad
  // Soporte para PlanetScale y otras bases de datos en la nube con SSL
  ...(process.env.DB_SSL === 'true' && {
    ssl: {
      rejectUnauthorized: true
    }
  })
};

const pool = mysql.createPool(configuracionBD);

// Probar si la conexión funciona
const probarConexion = async () => {
  try {
    const conexion = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    conexion.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Ejecutar consultas SQL con mejor manejo de concurrencia
const ejecutarConsulta = async (sql, parametros = []) => {
  const inicio = Date.now();
  let conexion;
  let intentos = 0;
  const maxIntentos = 3;
  
  while (intentos < maxIntentos) {
    try {
      // Obtener conexión del pool
      conexion = await pool.getConnection();
      
      // Ejecutar consulta
      const [rows, fields] = await conexion.execute(sql, parametros);
      
      const duracion = Date.now() - inicio;
      
      // Log solo consultas muy lentas
      if (duracion > 3000) {
        console.warn(`⚠️ Consulta lenta (${duracion}ms): ${sql.substring(0, 80)}...`);
      }
      
      // CRÍTICO: Liberar conexión inmediatamente en try
      conexion.release();
      conexion = null;
      return [rows, fields];
      
    } catch (error) {
      // CRÍTICO: Liberar conexión en el catch
      if (conexion) {
        try {
          conexion.release();
          conexion = null;
        } catch (releaseError) {
          console.error('Error liberando conexión:', releaseError.message);
        }
      }
      
      intentos++;
      
      // Si es el último intento o error no recuperable, lanzar error
      if (intentos >= maxIntentos || !esErrorRecuperable(error)) {
        const duracion = Date.now() - inicio;
        console.error(`❌ Error ejecutando consulta (${duracion}ms, intentos: ${intentos}):`, error.message);
        throw error;
      }
      
      // Esperar antes de reintentar (backoff exponencial: 100ms, 200ms, 400ms)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, intentos) * 100));
    }
  }
};

// Verificar si un error es recuperable
const esErrorRecuperable = (error) => {
  const codigosRecuperables = [
    'ECONNRESET',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
  ];
  return codigosRecuperables.includes(error.code) || 
         error.message.includes('Too many connections') ||
         error.message.includes('deadlock');
};

// Devuelve una conexión "envuelta" que libera automáticamente la conexión
// después de ejecutar `execute` o `query`. Esto evita fugas cuando el
// código obtiene una conexión y olvida liberarla.
const obtenerConexion = async () => {
  const conn = await pool.getConnection();
  let released = false;
  const release = () => {
    if (!released) {
      try {
        conn.release();
      } catch (e) {
        // ignorar
      }
      released = true;
    }
  };

  return {
    execute: async (sql, params = []) => {
      try {
        return await conn.execute(sql, params);
      } finally {
        release();
      }
    },
    query: async (sql, params = []) => {
      try {
        return await conn.query(sql, params);
      } finally {
        release();
      }
    },
    // Si necesitas la conexión raw para transacciones u operaciones avanzadas,
    // usa `obtenerConexionRaw()` en su lugar.
    raw: conn,
    _release: release
  };
};

// Obtener la conexión raw si se necesitan transacciones o múltiples operaciones
// en la misma conexión. En ese caso el desarrollador debe llamar a
// `conexion.release()` manualmente.
const obtenerConexionRaw = async () => {
  return await pool.getConnection();
};

const conectarBD = async () => {
  return await probarConexion();
};

const verificarConexionBD = async () => {
  try {
    const conexion = await pool.getConnection();
    await conexion.execute('SELECT 1');
    conexion.release();
    console.log('✅ Base de datos verificada y disponible');
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión a BD:', error.message);
    return false;
  }
};

const cerrarPool = async () => {
  try {
    await pool.end();
    console.log('✅ Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error cerrando pool:', error.message);
  }
};

// Monitoreo del estado del pool cada 30 segundos
setInterval(async () => {
  try {
    const poolState = pool.pool;
    const conexionesActivas = poolState._allConnections?.length || 0;
    const conexionesLibres = poolState._freeConnections?.length || 0;
    const conexionesUsadas = conexionesActivas - conexionesLibres;
    
    console.log(`📊 Pool Status: ${conexionesUsadas}/${conexionesActivas} en uso, ${conexionesLibres} libres`);
    
    // Alerta si hay muy pocas conexiones libres
    if (conexionesLibres === 0 && conexionesActivas > 0) {
      console.warn(`⚠️ ALERTA: No hay conexiones libres disponibles (${conexionesActivas} en uso)`);
    }
  } catch (error) {
    console.error('Error monitoreando pool:', error.message);
  }
}, 30000); // Cada 30 segundos

// Limpiar conexiones inactivas
setInterval(async () => {
  try {
    const conexion = await pool.getConnection();
    await conexion.ping();
    conexion.release();
  } catch (error) {
    console.error('Error en keep-alive:', error.message);
  }
}, 60000); // Cada 60 segundos

module.exports = { 
  pool, 
  probarConexion, 
  ejecutarConsulta, 
  obtenerConexion, 
  obtenerConexionRaw,
  conectarBD,
  verificarConexionBD,
  cerrarPool
};
