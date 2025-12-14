const mysql = require('mysql2/promise');
require('dotenv').config();

const configuracionBD = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_transporte_umsa',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX) || 50,  // Aumentado para manejar más concurrencia
  queueLimit: 0,  // Sin límite de cola para evitar rechazos
  maxIdle: parseInt(process.env.DB_POOL_MIN) || 10,  // Más conexiones idle
  idleTimeout: 60000,  // 60 segundos antes de cerrar conexión idle
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
  connectTimeout: 20000,  // Aumentado a 20 segundos
  acquireTimeout: 20000,  // Timeout para adquirir conexión
  timeout: 60000,  // Timeout de query a 60 segundos
  multipleStatements: false,  // Seguridad
  namedPlaceholders: true,  // Soporte para placeholders nombrados
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
      // Obtener conexión del pool con timeout
      conexion = await pool.getConnection();
      
      // Ejecutar consulta con timeout
      const [rows, fields] = await conexion.execute(sql, parametros);
      
      const duracion = Date.now() - inicio;
      
      // Log solo consultas muy lentas
      if (duracion > 2000) {
        console.warn(`⚠️ Consulta lenta (${duracion}ms): ${sql.substring(0, 80)}...`);
      }
      
      // Liberar conexión inmediatamente
      conexion.release();
      return [rows, fields];
      
    } catch (error) {
      // Liberar conexión si existe
      if (conexion) {
        try {
          conexion.release();
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
      
      // Esperar antes de reintentar (backoff exponencial)
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

const obtenerConexion = async () => {
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

setInterval(async () => {
  try {
    const poolState = pool.pool;
    const conexionesLibres = poolState._freeConnections?.length || 0;
    if (conexionesLibres > 5) {
      console.log(`Limpieza de conexiones: ${conexionesLibres} disponibles`);
    }
  } catch (error) {}
}, 300000);

module.exports = { 
  pool, 
  probarConexion, 
  ejecutarConsulta, 
  obtenerConexion, 
  conectarBD,
  verificarConexionBD,
  cerrarPool
};
