const mysql = require('mysql2/promise');
require('dotenv').config();

const configuracionBD = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_transporte_umsa',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  maxIdle: 5,
  idleTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  connectTimeout: 10000
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

// Ejecutar consultas SQL
const ejecutarConsulta = async (sql, parametros = []) => {
  const inicio = Date.now();
  let conexion;
  
  try {
    const poolState = pool.pool;
    const conexionesLibres = poolState._freeConnections?.length || 0;
    const conexionesUsadas = poolState._allConnections?.length - conexionesLibres || 0;
    
    if (conexionesLibres === 0) {
      console.warn(`Pool sin conexiones libres. En uso: ${conexionesUsadas}/20`);
    }
    
    conexion = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout obteniendo conexión')), 5000)
      )
    ]);
    
    const [rows, fields] = await Promise.race([
      conexion.execute(sql, parametros),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ejecutando consulta')), 10000)
      )
    ]);
    
    const duracion = Date.now() - inicio;
    
    if (duracion > 1000) {
      console.warn(`Consulta lenta (${duracion}ms): ${sql.substring(0, 100)}...`);
    }
    
    conexion.release();
    return [rows, fields];
    
  } catch (error) {
    if (conexion) conexion.release();
    
    const duracion = Date.now() - inicio;
    console.error(`Error ejecutando consulta (${duracion}ms):`, error.message);
    console.error(`SQL: ${sql.substring(0, 150)}...`);
    throw error;
  }
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
