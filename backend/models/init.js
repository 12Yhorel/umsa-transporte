/**
 * Script de inicialización de modelos - UMSA Transporte
 * Se ejecuta al iniciar la aplicación para verificar y preparar la base de datos
 */

const { modelosUMSA } = require('./index');
const { verificarConexionBD } = require('../config/database');

class InicializadorModelos {
    constructor() {
        this.inicializado = false;
        this.errores = [];
    }

    /**
     * Inicializar todos los modelos y verificar la base de datos
     */
    async inicializar() {
        try {
            console.log('🚀 Inicializando modelos del sistema UMSA Transporte...');

            // 1. Verificar conexión a base de datos
            await this.verificarConexionBaseDatos();

            // 2. Inicializar datos básicos del sistema
            await this.inicializarDatosBasicos();

            // 3. Verificar estructura de modelos
            await this.verificarEstructuraModelos();

            // 4. Verificar permisos y accesos
            await this.verificarPermisosSistema();

            this.inicializado = true;
            
            console.log('✅ Modelos del sistema inicializados correctamente');
            
            return {
                success: true,
                mensaje: 'Sistema inicializado correctamente',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.errores.push(error.message);
            console.error('❌ Error inicializando modelos:', error);
            
            return {
                success: false,
                mensaje: 'Error inicializando sistema',
                errores: this.errores,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Verificar conexión a base de datos
     */
    async verificarConexionBaseDatos() {
        try {
            const conexionActiva = await verificarConexionBD();
            
            if (!conexionActiva) {
                throw new Error('No se pudo establecer conexión con la base de datos');
            }

            console.log('✅ Conexión a base de datos verificada');

        } catch (error) {
            console.error('❌ Error en conexión a base de datos:', error.message);
            throw error;
        }
    }

    /**
     * Inicializar datos básicos del sistema
     */
    async inicializarDatosBasicos() {
        try {
            await modelosUMSA.inicializarDatosSistema();
            console.log('✅ Datos básicos del sistema inicializados');

        } catch (error) {
            console.error('❌ Error inicializando datos básicos:', error.message);
            // No lanzar error para permitir que el sistema continúe
            this.errores.push(`Datos básicos: ${error.message}`);
        }
    }

    /**
     * Verificar estructura de todos los modelos
     */
    async verificarEstructuraModelos() {
        try {
            const resultados = await modelosUMSA.verificarConexionModelos();
            
            let todosConectados = true;
            for (const [modelo, resultado] of Object.entries(resultados)) {
                if (!resultado.conectado) {
                    console.warn(`⚠️  Modelo ${modelo}: ${resultado.error || 'Error de conexión'}`);
                    todosConectados = false;
                    this.errores.push(`Modelo ${modelo}: ${resultado.error}`);
                }
            }

            if (todosConectados) {
                console.log('✅ Todos los modelos verificados correctamente');
            } else {
                console.warn('⚠️  Algunos modelos presentan advertencias');
            }

        } catch (error) {
            console.error('❌ Error verificando estructura de modelos:', error.message);
            this.errores.push(`Verificación modelos: ${error.message}`);
        }
    }

    /**
     * Verificar permisos y accesos del sistema
     */
    async verificarPermisosSistema() {
        try {
            // Verificar que existen los roles básicos
            const roles = await modelosUMSA.Usuario.obtenerTodosRoles();
            const rolesRequeridos = ['ADMINISTRADOR', 'TECNICO', 'CONDUCTOR', 'SOLICITANTE'];
            
            const rolesFaltantes = rolesRequeridos.filter(rol => 
                !roles.find(r => r.nombre === rol)
            );

            if (rolesFaltantes.length > 0) {
                console.warn(`⚠️  Roles faltantes: ${rolesFaltantes.join(', ')}`);
                this.errores.push(`Roles faltantes: ${rolesFaltantes.join(', ')}`);
            } else {
                console.log('✅ Roles del sistema verificados');
            }

            // Verificar que existe al menos un usuario administrador
            const administradores = await modelosUMSA.Usuario.obtenerPorRol('ADMINISTRADOR');
            if (administradores.length === 0) {
                console.warn('⚠️  No hay usuarios administradores en el sistema');
                this.errores.push('No hay usuarios administradores');
            } else {
                console.log('✅ Usuarios administradores verificados');
            }

        } catch (error) {
            console.error('❌ Error verificando permisos del sistema:', error.message);
            this.errores.push(`Permisos sistema: ${error.message}`);
        }
    }

    /**
     * Obtener estado de inicialización
     */
    obtenerEstado() {
        return {
            inicializado: this.inicializado,
            errores: this.errores,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reinicializar el sistema
     */
    async reinicializar() {
        this.inicializado = false;
        this.errores = [];
        return await this.inicializar();
    }
}

// Crear y exportar instancia única
const inicializador = new InicializadorModelos();

module.exports = {
    InicializadorModelos,
    inicializador,
    inicializarModelos: () => inicializador.inicializar(),
    obtenerEstadoInicializacion: () => inicializador.obtenerEstado(),
    reinicializarModelos: () => inicializador.reinicializar()
};

