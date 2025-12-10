/**
 * ARCHIVO PRINCIPAL DE MODELOS - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Punto de entrada unificado para todos los modelos de la base de datos
 * Universidad Mayor de San Andrés
 */

const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const Conductor = require('./Conductor');
const Inventario = require('./Inventario');
const Reparacion = require('./Reparacion');
const Reserva = require('./Reserva');
const Dashboard = require('./Dashboard');
const Reporte = require('./Reporte');

/**
 * Clase principal que agrupa todos los modelos del sistema
 */
class ModelosUMSA {
    constructor() {
        this.Usuario = Usuario;
        this.Vehiculo = Vehiculo;
        this.Conductor = Conductor;
        this.Inventario = Inventario;
        this.Reparacion = Reparacion;
        this.Reserva = Reserva;
        this.Dashboard = Dashboard;
        this.Reporte = Reporte;
        
        this.modelos = {
            Usuario,
            Vehiculo,
            Conductor,
            Inventario,
            Reparacion,
            Reserva,
            Dashboard,
            Reporte
        };
    }

    /**
     * Obtener todos los modelos disponibles
     */
    obtenerTodos() {
        return this.modelos;
    }

    /**
     * Obtener un modelo específico por nombre
     */
    obtenerModelo(nombreModelo) {
        const modelo = this.modelos[nombreModelo];
        if (!modelo) {
            throw new Error(`Modelo '${nombreModelo}' no encontrado`);
        }
        return modelo;
    }

    /**
     * Verificar conexión de todos los modelos
     */
    async verificarConexionModelos() {
        const resultados = {};
        
        for (const [nombre, modelo] of Object.entries(this.modelos)) {
            try {
                if (typeof modelo.verificarConexion === 'function') {
                    resultados[nombre] = await modelo.verificarConexion();
                } else {
                    resultados[nombre] = { conectado: true, mensaje: 'Sin verificación específica' };
                }
            } catch (error) {
                resultados[nombre] = { 
                    conectado: false, 
                    error: error.message 
                };
            }
        }
        
        return resultados;
    }

    /**
     * Obtener estadísticas generales del sistema
     */
    async obtenerEstadisticasSistema() {
        try {
            const [
                totalUsuarios,
                totalVehiculos,
                totalConductores,
                totalItemsInventario,
                totalReparaciones,
                totalReservas
            ] = await Promise.all([
                Usuario.obtenerTotal(),
                Vehiculo.obtenerTotal(),
                Conductor.obtenerTotal(),
                Inventario.obtenerTotalItems(),
                Reparacion.obtenerTotal(),
                Reserva.obtenerTotal()
            ]);

            return {
                usuarios: totalUsuarios,
                vehiculos: totalVehiculos,
                conductores: totalConductores,
                items_inventario: totalItemsInventario,
                reparaciones: totalReparaciones,
                reservas: totalReservas,
                actualizado: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error obteniendo estadísticas del sistema:', error);
            throw error;
        }
    }

    /**
     * Inicializar datos básicos del sistema
     */
    async inicializarDatosSistema() {
        try {
            console.log('🔄 Inicializando datos básicos del sistema UMSA...');

            // Verificar y crear roles básicos si no existen
            await this.inicializarRoles();
            
            // Verificar y crear usuario administrador si no existe
            await this.inicializarUsuarioAdmin();
            
            // Verificar y crear categorías de inventario básicas
            await this.inicializarCategoriasInventario();

            console.log('✅ Datos básicos del sistema inicializados correctamente');

        } catch (error) {
            console.error(' Error inicializando datos del sistema:', error);
            throw error;
        }
    }

    /**
     * Inicializar roles del sistema
     */
    async inicializarRoles() {
        try {
            const rolesBasicos = [
                { nombre: 'ADMINISTRADOR', descripcion: 'Acceso completo al sistema', nivel_acceso: 4 },
                { nombre: 'TECNICO', descripcion: 'Gestión de inventarios y reparaciones', nivel_acceso: 3 },
                { nombre: 'CONDUCTOR', descripcion: 'Operación de vehículos', nivel_acceso: 2 },
                { nombre: 'SOLICITANTE', descripcion: 'Solicitud de reservas', nivel_acceso: 1 }
            ];

            for (const rol of rolesBasicos) {
                await Usuario.crearRolSiNoExiste(rol);
            }

            console.log('✅ Roles del sistema verificados/creados');

        } catch (error) {
            console.error('modulo Error inicializando roles:', error);
            throw error;
        }
    }

    /**
     * Inicializar usuario administrador por defecto
     */
    async inicializarUsuarioAdmin() {
        try {
            const adminExiste = await Usuario.obtenerPorEmail('admin@umsa.edu.bo');
            
            if (!adminExiste) {
                await Usuario.crear({
                    email: 'admin@umsa.edu.bo',
                    password: 'Admin123', // Se encriptará automáticamente
                    nombres: 'Administrador',
                    apellidos: 'Sistema',
                    telefono: '+59112345678',
                    departamento: 'Tecnologías de Información',
                    rol_id: 1 // ADMINISTRADOR
                });
                
                console.log('✅ Usuario administrador creado: admin@umsa.edu.bo / Admin123');
            } else {
                console.log('✅ Usuario administrador ya existe');
            }

        } catch (error) {
            console.error('❌ Error inicializando usuario administrador:', error);
            throw error;
        }
    }

    /**
     * Inicializar categorías de inventario básicas
     */
    async inicializarCategoriasInventario() {
        try {
            const categoriasBasicas = [
                { nombre: 'Lubricantes', tipo: 'REPUESTO', descripcion: 'Aceites y lubricantes para motor' },
                { nombre: 'Filtros', tipo: 'REPUESTO', descripcion: 'Filtros de aire, aceite y combustible' },
                { nombre: 'Neumáticos', tipo: 'REPUESTO', descripcion: 'Llantas y cámaras de aire' },
                { nombre: 'Frenos', tipo: 'REPUESTO', descripcion: 'Pastillas, discos y líquido de frenos' },
                { nombre: 'Baterías', tipo: 'REPUESTO', descripcion: 'Baterías y acumuladores' },
                { nombre: 'Limpieza Externa', tipo: 'LIMPIEZA', descripcion: 'Productos para lavado exterior' },
                { nombre: 'Limpieza Interna', tipo: 'LIMPIEZA', descripcion: 'Productos para limpieza interior' },
                { nombre: 'Herramientas Manuales', tipo: 'HERRAMIENTA', descripcion: 'Herramientas de mano para taller' },
                { nombre: 'Herramientas Eléctricas', tipo: 'HERRAMIENTA', descripcion: 'Herramientas eléctricas para taller' },
                { nombre: 'Equipos de Seguridad', tipo: 'HERRAMIENTA', descripcion: 'Equipos de protección personal' }
            ];

            for (const categoria of categoriasBasicas) {
                await Inventario.crearCategoriaSiNoExiste(categoria);
            }

            console.log('✅ Categorías de inventario verificadas/creadas');

        } catch (error) {
            console.error('❌ Error inicializando categorías de inventario:', error);
            throw error;
        }
    }

    /**
     * Método para realizar backup de datos importantes
     */
    async realizarBackupDatos() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = {
                timestamp,
                sistema: 'UMSA Transporte',
                version: '1.0.0',
                datos: {
                    usuarios: await Usuario.obtenerTodos(),
                    vehiculos: await Vehiculo.obtenerTodos(),
                    conductores: await Conductor.obtenerTodos(),
                    categorias: await Inventario.obtenerTodasCategorias(),
                    items: await Inventario.obtenerTodosItems(),
                    reservas_recientes: await Reserva.obtenerRecientes(100),
                    reparaciones_activas: await Reparacion.obtenerReparacionesActivas()
                }
            };

            return backupData;

        } catch (error) {
            console.error('❌ Error realizando backup de datos:', error);
            throw error;
        }
    }

    /**
     * Método para limpiar datos temporales o antiguos
     */
    async limpiarDatosTemporales() {
        try {
            console.log('🧹 Limpiando datos temporales del sistema...');

            const resultados = {
                auditoria_eliminada: await this.limpiarRegistrosAuditoria(),
                reservas_antiguas: await this.archivarReservasCompletadas(),
                logs_temporales: await this.limpiarLogsTemporales()
            };

            console.log('✅ Limpieza de datos temporales completada:', resultados);
            return resultados;

        } catch (error) {
            console.error('❌ Error limpiando datos temporales:', error);
            throw error;
        }
    }

    /**
     * Limpiar registros antiguos de auditoría
     */
    async limpiarRegistrosAuditoria() {
        try {
            const treintaDiasAtras = new Date();
            treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

            const resultado = await Usuario.limpiarAuditoriaAntigua(treintaDiasAtras);
            return resultado;

        } catch (error) {
            console.error('Error limpiando registros de auditoría:', error);
            return 0;
        }
    }

    /**
     * Archivar reservas completadas antiguas
     */
    async archivarReservasCompletadas() {
        try {
            const seisMesesAtras = new Date();
            seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

            const resultado = await Reserva.archivarReservasAntiguas(seisMesesAtras);
            return resultado;

        } catch (error) {
            console.error('Error archivando reservas antiguas:', error);
            return 0;
        }
    }

    /**
     * Limpiar logs temporales
     */
    async limpiarLogsTemporales() {
        try {
            // Implementar según la estructura de logs del sistema
            return 0;
        } catch (error) {
            console.error('Error limpiando logs temporales:', error);
            return 0;
        }
    }

    /**
     * Sincronizar datos con sistemas externos UMSA
     */
    async sincronizarConSistemasUMSA() {
        try {
            console.log('🔄 Sincronizando con sistemas UMSA...');

            const resultados = {
                usuarios_sincronizados: await this.sincronizarUsuariosUMSA(),
                departamentos_actualizados: await this.sincronizarDepartamentosUMSA(),
                vehiculos_sincronizados: await this.sincronizarVehiculosUMSA()
            };

            console.log('✅ Sincronización con sistemas UMSA completada');
            return resultados;

        } catch (error) {
            console.error('❌ Error sincronizando con sistemas UMSA:', error);
            throw error;
        }
    }

    /**
     * Sincronizar usuarios con sistema UMSA
     */
    async sincronizarUsuariosUMSA() {
        // Implementar integración con SIGA u otros sistemas UMSA
        return 0;
    }

    /**
     * Sincronizar departamentos con sistema UMSA
     */
    async sincronizarDepartamentosUMSA() {
        // Implementar integración con sistemas UMSA
        return 0;
    }

    /**
     * Sincronizar vehículos con sistema UMSA
     */
    async sincronizarVehiculosUMSA() {
        // Implementar integración con sistemas UMSA
        return 0;
    }
}

// Crear instancia única (Singleton)
const modelosUMSA = new ModelosUMSA();

// Exportar tanto la clase como la instancia
module.exports = {
    ModelosUMSA,
    modelosUMSA,
    
    // Exportar modelos individualmente para importación directa
    Usuario: modelosUMSA.Usuario,
    Vehiculo: modelosUMSA.Vehiculo,
    Conductor: modelosUMSA.Conductor,
    Inventario: modelosUMSA.Inventario,
    Reparacion: modelosUMSA.Reparacion,
    Reserva: modelosUMSA.Reserva,
    Dashboard: modelosUMSA.Dashboard,
    Reporte: modelosUMSA.Reporte,

    // Métodos de utilidad
    obtenerEstadisticasSistema: () => modelosUMSA.obtenerEstadisticasSistema(),
    inicializarDatosSistema: () => modelosUMSA.inicializarDatosSistema(),
    realizarBackupDatos: () => modelosUMSA.realizarBackupDatos(),
    limpiarDatosTemporales: () => modelosUMSA.limpiarDatosTemporales(),
    sincronizarConSistemasUMSA: () => modelosUMSA.sincronizarConSistemasUMSA(),
    verificarConexionModelos: () => modelosUMSA.verificarConexionModelos()
};