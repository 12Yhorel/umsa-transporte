/**
 * SERVIDOR PRINCIPAL - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Backend completo para la gestión de flota vehicular, inventarios y reservas
 * Universidad Mayor de San Andrés
 * Versión: 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Configuración de variables de entorno
dotenv.config();

// Importación de rutas
const rutasAuth = require('./routes/auth');
const rutasUsuarios = require('./routes/usuarios');
const rutasVehiculos = require('./routes/vehiculos');
const rutasConductores = require('./routes/conductores');
const rutasInventario = require('./routes/inventario');
const rutasReparaciones = require('./routes/reparaciones');
const rutasReservas = require('./routes/reservas');
const rutasDashboard = require('./routes/dashboard');
// const rutasReportes = require('./routes/reportes');

// Importación de middleware personalizado - CORREGIDO
// Si no tienes estos archivos, comenta estas líneas temporalmente
// const { manejadorErrores } = require('./middleware/errores');
// const { limitadorPeticiones } = require('./middleware/rateLimiter');

// Importación de conexión a base de datos - CORREGIDO
const { conectarBD, verificarConexionBD } = require('./config/database');

// Middleware de cancelación de peticiones concurrentes
const { cancelarPeticionesAnteriores } = require('./middleware/request-cancellation');

class ServidorUMSA {
    constructor() {
        this.app = express();
        this.puerto = process.env.PUERTO || 3001;
        this.host = process.env.HOST || '0.0.0.0';
        
        // Conectar a base de datos
        this.conectarBaseDatos();
        
        // Inicializar middlewares
        this.inicializarMiddlewares();
        
        // Inicializar rutas
        this.inicializarRutas();
        
        // Inicializar manejo de errores
        // this.inicializarManejoErrores(); // Comentar si no tienes el middleware
    }

    async conectarBaseDatos() {
        try {
            await conectarBD();
            console.log('✅ Conexión a base de datos establecida');
            
            // Verificar conexión periódicamente
            setInterval(async () => {
                await verificarConexionBD();
            }, 300000); // Cada 5 minutos
            
        } catch (error) {
            console.error('❌ Error crítico conectando a base de datos:', error.message);
            process.exit(1);
        }
    }

    inicializarMiddlewares() {
        // Seguridad con Helmet
        this.app.use(helmet());

        // Compresión GZIP
        this.app.use(compression());

        // Logger de requests
        if (process.env.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined', {
                skip: (req, res) => res.statusCode < 400
            }));
        }

        // Limitación de tasa de requests - TEMPORALMENTE COMENTADO
        // this.app.use(limitadorPeticiones);

        // Middleware para cancelar peticiones duplicadas/concurrentes - DESACTIVADO TEMPORALMENTE
        // Este middleware puede estar causando problemas de conexiones colgadas
        // this.app.use(cancelarPeticionesAnteriores());

        // CORS configurado para la aplicación UMSA
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:4200',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: true,
            maxAge: 86400 // 24 horas
        }));

        // Parseo de JSON y URL encoded
        this.app.use(express.json({
            limit: '10mb'
        }));

        this.app.use(express.urlencoded({
            extended: true,
            limit: '10mb'
        }));

        // Middleware de información del servidor
        this.app.use((req, res, next) => {
            res.setHeader('X-Powered-By', 'UMSA Transporte API');
            res.setHeader('X-API-Version', '1.0.0');
            // Evitar caché en endpoints de API para prevenir respuestas 304 en datos dinámicos
            if (req.path && req.path.startsWith('/api/')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('Surrogate-Control', 'no-store');
            }
            next();
        });

        // Timeout global optimizado para peticiones API - AUMENTADOS
        this.app.use((req, res, next) => {
            if (req.path && req.path.startsWith('/api/')) {
                // Timeout mucho más largo para evitar cortes prematuros
                const timeout = req.path.includes('/dashboard') || 
                               req.path.includes('/reportes') ? 120000 : 60000; // 2min y 1min
                
                req.setTimeout(timeout, () => {
                    console.warn(`⏱️ Timeout (${timeout}ms): ${req.method} ${req.originalUrl}`);
                    if (!res.headersSent) {
                        res.status(408).json({ 
                            error: 'Request timeout',
                            message: 'La operación tomó demasiado tiempo. Inténtalo nuevamente.'
                        });
                    }
                });
                res.setTimeout(timeout);
            }
            next();
        });

        // Servir archivos estáticos (para QR codes, reportes, etc.)
        this.app.use('/api/public', express.static('public', {
            maxAge: '1d'
        }));
    }

    inicializarRutas() {
        // Ruta de salud y información del sistema
        this.app.get('/api/salud', this.rutaSalud);
        
        // Ruta de información del sistema
        this.app.get('/api/info', this.rutaInfoSistema);

        // Ruta de monitoreo del pool de conexiones
        this.app.get('/api/pool-status', this.rutaPoolStatus);

        // Rutas de la API
        this.app.use('/api/auth', rutasAuth);
        this.app.use('/api/usuarios', rutasUsuarios);
        this.app.use('/api/vehiculos', rutasVehiculos);
        this.app.use('/api/conductores', rutasConductores);
        this.app.use('/api/inventario', rutasInventario);
        this.app.use('/api/reparaciones', rutasReparaciones);
        this.app.use('/api/reservas', rutasReservas);
        this.app.use('/api/dashboard', rutasDashboard);
        
        // Comentar si no tienes estas rutas aún
        // this.app.use('/api/reportes', rutasReportes);

        // Ruta para documentación API
        this.app.get('/api/docs', this.rutaDocumentacion);

        // Middleware para rutas no encontradas
        this.app.use('*', this.rutaNoEncontrada);
    }

    inicializarManejoErrores() {
        // this.app.use(manejadorErrores); // Comentar si no tienes el middleware
    }

    // Ruta de salud del sistema
    rutaSalud = (req, res) => {
        const salud = {
            estado: 'saludable',
            timestamp: new Date().toISOString(),
            entorno: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            uptime: process.uptime(),
            memoria: process.memoryUsage(),
            base_datos: 'conectada' // Se verifica en el middleware de BD
        };

        res.json({
            error: false,
            mensaje: '🚀 Sistema de la Unidad de Transporte - UMSA - Backend funcionando correctamente',
            datos: salud
        });
    }

    // Ruta de información del sistema
    rutaInfoSistema = (req, res) => {
        const infoSistema = {
            nombre: 'Sistema de la Unidad de Transporte - UMSA',
            version: '1.0.0',
            descripcion: 'Backend para gestión integral de flota vehicular, inventarios y reservas',
            desarrollado_por: 'Equipo de Desarrollo UMSA',
            contacto: 'transporte.umsa@umsa.bo',
            repositorio: 'https://github.com/umsa-transporte/backend',
            caracteristicas: [
                'Gestión de usuarios y autenticación JWT',
                'Control de flota vehicular',
                'Sistema de inventarios multi-categoría',
                'Gestión de reparaciones y mantenimiento',
                'Sistema de reservas y asignaciones',
                'Dashboard con métricas en tiempo real',
                'Generación de reportes y códigos QR',
                'API RESTful documentada'
            ],
            tecnologias: [
                'Node.js',
                'Express.js',
                'MySQL',
                'JWT',
                'bcryptjs',
                'QR Generation'
            ]
        };

        res.json({
            error: false,
            datos: infoSistema
        });
    }

    // Ruta de monitoreo del pool de conexiones
    rutaPoolStatus = (req, res) => {
        const { pool } = require('./config/database');
        const poolState = pool.pool;
        
        const totalConexiones = poolState._allConnections?.length || 0;
        const conexionesLibres = poolState._freeConnections?.length || 0;
        const conexionesUsadas = totalConexiones - conexionesLibres;
        
        const status = {
            total: totalConexiones,
            libres: conexionesLibres,
            usadas: conexionesUsadas,
            limite: 100,
            porcentajeUso: ((conexionesUsadas / 100) * 100).toFixed(2) + '%',
            estado: conexionesUsadas < 80 ? 'SALUDABLE' : conexionesUsadas < 90 ? 'ADVERTENCIA' : 'CRITICO',
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: status
        });
    }

    // Ruta de documentación
    rutaDocumentacion = (req, res) => {
        const documentacion = {
            mensaje: 'Documentación de la API UMSA Transporte',
            version: '1.0.0',
            endpoints: {
                auth: {
                    base: '/api/auth',
                    endpoints: {
                        'POST /registrar': 'Registrar nuevo usuario',
                        'POST /login': 'Iniciar sesión',
                        'GET /perfil': 'Obtener perfil de usuario',
                        'PUT /perfil': 'Actualizar perfil de usuario'
                    }
                },
                vehiculos: {
                    base: '/api/vehiculos',
                    endpoints: {
                        'GET /': 'Obtener todos los vehículos',
                        'GET /disponibles': 'Obtener vehículos disponibles',
                        'GET /estadisticas': 'Obtener estadísticas de flota',
                        'POST /': 'Crear nuevo vehículo (Admin/Técnico)',
                        'GET /:id': 'Obtener vehículo por ID',
                        'PUT /:id': 'Actualizar vehículo (Admin/Técnico)'
                    }
                },
                reservas: {
                    base: '/api/reservas',
                    endpoints: {
                        'GET /': 'Obtener todas las reservas',
                        'POST /': 'Crear nueva reserva',
                        'GET /:id': 'Obtener reserva por ID',
                        'PUT /:id/estado': 'Actualizar estado de reserva'
                    }
                }
            },
            autenticacion: 'Usar header: Authorization: Bearer <token>',
            ejemplos: {
                crear_reserva: {
                    method: 'POST',
                    url: '/api/reservas',
                    headers: {
                        'Authorization': 'Bearer tu_token_jwt',
                        'Content-Type': 'application/json'
                    },
                    body: {
                        "vehiculo_id": 1,
                        "fecha_reserva": "2024-01-15",
                        "hora_inicio": "08:00:00",
                        "hora_fin": "12:00:00",
                        "origen": "Campus Universitario",
                        "destino": "Aeropuerto Internacional",
                        "motivo": "Traslado de delegación académica"
                    }
                }
            }
        };

        res.json({
            error: false,
            datos: documentacion
        });
    }

    // Ruta para manejar endpoints no encontrados
    rutaNoEncontrada = (req, res) => {
        res.status(404).json({
            error: true,
            mensaje: `Ruta no encontrada: ${req.originalUrl}`,
            sugerencia: 'Consulte la documentación en /api/docs',
            metodo: req.method,
            timestamp: new Date().toISOString()
        });
    }

    // Método para iniciar el servidor
    iniciar() {
        this.servidor = this.app.listen(this.puerto, this.host, () => {
            console.log(`
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓                                                                              ▓
▓  🚀 SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA - BACKEND                     ▓
▓                                                                              ▓
▓  ✅ Servidor ejecutándose correctamente                                      ▓
▓  🔗 URL: http://${this.host}:${this.puerto}                                  ▓
▓  📊 Entorno: ${process.env.NODE_ENV || 'development'}                        ▓
▓  🗄️  Base de datos: ${process.env.DB_NAME || 'gestion_transporte_umsa'}      ▓
▓  ⏰ Iniciado: ${new Date().toLocaleString()}                                 ▓
▓                                                                              ▓
▓  📍 Endpoints disponibles:                                                   ▓
▓     • http://${this.host}:${this.puerto}/api/salud                           ▓
▓     • http://${this.host}:${this.puerto}/api/info                            ▓
▓     • http://${this.host}:${this.puerto}/api/docs                            ▓
▓                                                                              ▓
▓  🛡️  Middlewares activos: Helmet, CORS, Compression, Rate Limiting          ▓
▓                                                                              ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
            `);
        });

        // Manejo graceful de shutdown
        this.configurarShutdownGraceful();
    }

    configurarShutdownGraceful() {
        const señales = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        
        señales.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\n📦 Recibida señal ${signal}. Cerrando servidor gracefulmente...`);
                
                this.servidor.close(async (err) => {
                    if (err) {
                        console.error('❌ Error cerrando servidor:', err);
                    }
                    
                    // Cerrar pool de conexiones de base de datos
                    try {
                        const { cerrarPool } = require('./config/database');
                        await cerrarPool();
                    } catch (error) {
                        console.error('❌ Error cerrando pool:', error.message);
                    }
                    
                    console.log('✅ Servidor cerrado correctamente. Hasta pronto! 👋');
                    process.exit(err ? 1 : 0);
                });

                // Force close después de 10 segundos
                setTimeout(() => {
                    console.log('⚠️  Forzando cierre del servidor...');
                    process.exit(1);
                }, 10000);
            });
        });

        // Manejo de excepciones no capturadas
        process.on('uncaughtException', (error) => {
            console.error('💥 Excepción no capturada:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Promise rechazada no manejada:', reason);
            process.exit(1);
        });
    }

    // Método para detener el servidor (útil para testing)
    detener() {
        if (this.servidor) {
            this.servidor.close();
        }
    }
}

// Crear e iniciar servidor
const servidorUMSA = new ServidorUMSA();

// Iniciar servidor solo si no estamos en entorno de testing
if (process.env.NODE_ENV !== 'test') {
    servidorUMSA.iniciar();
}

module.exports = { servidorUMSA, ServidorUMSA };