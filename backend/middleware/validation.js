/**
 * MIDDLEWARE DE VALIDACIÓN - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Validación de datos de entrada usando express-validator
 * Universidad Mayor de San Andrés
 */

const { body, param, query, validationResult } = require('express-validator');
const { obtenerConexion } = require('../config/database');

class MiddlewareValidacion {
    
    /**
     * Manejar resultados de validación
     */
    manejarResultadosValidacion = (req, res, next) => {
        const errores = validationResult(req);
        
        if (!errores.isEmpty()) {
            return res.status(400).json({
                error: true,
                mensaje: 'Errores de validación en los datos de entrada',
                codigo: 'ERROR_VALIDACION',
                errores: errores.array().map(error => ({
                    campo: error.path,
                    mensaje: error.msg,
                    valor: error.value
                }))
            });
        }
        
        next();
    }

    /**
     * Validaciones para Autenticación
     */
    validarRegistro = [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Debe proporcionar un email válido')
            .custom(this.verificarEmailUnico),
        
        body('password')
            .isLength({ min: parseInt(process.env.MIN_PASSWORD_LENGTH) || 6 })
            .withMessage('La contraseña debe tener al menos 6 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
        
        body('nombres')
            .trim()
            .notEmpty()
            .withMessage('Los nombres son requeridos')
            .isLength({ min: 2, max: 100 })
            .withMessage('Los nombres deben tener entre 2 y 100 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('Los nombres solo pueden contener letras y espacios'),
        
        body('apellidos')
            .trim()
            .notEmpty()
            .withMessage('Los apellidos son requeridos')
            .isLength({ min: 2, max: 100 })
            .withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('Los apellidos solo pueden contener letras y espacios'),
        
        body('telefono')
            .optional()
            .trim()
            .matches(/^[0-9+\-\s()]{7,15}$/)
            .withMessage('El teléfono debe ser un número válido'),
        
        body('departamento')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('El departamento no puede exceder 100 caracteres'),
        
        body('rol_id')
            .isInt({ min: 1 })
            .withMessage('El rol debe ser un ID válido')
            .custom(this.verificarRolExistente),
        
        this.manejarResultadosValidacion
    ];

    validarLogin = [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Debe proporcionar un email válido'),
        
        body('password')
            .notEmpty()
            .withMessage('La contraseña es requerida'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Usuarios
     */
    validarActualizacionUsuario = [
        body('nombres')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Los nombres deben tener entre 2 y 100 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('Los nombres solo pueden contener letras y espacios'),
        
        body('apellidos')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('Los apellidos solo pueden contener letras y espacios'),
        
        body('telefono')
            .optional()
            .trim()
            .matches(/^[0-9+\-\s()]{7,15}$/)
            .withMessage('El teléfono debe ser un número válido'),
        
        body('departamento')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('El departamento no puede exceder 100 caracteres'),
        
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('El estado activo debe ser verdadero o falso'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Vehículos
     */
    validarVehiculo = [
        body('placa')
            .trim()
            .notEmpty()
            .withMessage('La placa es requerida')
            .isLength({ min: 6, max: 10 })
            .withMessage('La placa debe tener entre 6 y 10 caracteres')
            .matches(/^[A-Z0-9-]+$/)
            .withMessage('La placa solo puede contener letras mayúsculas, números y guiones')
            .custom(this.verificarPlacaUnica),
        
        body('marca')
            .trim()
            .notEmpty()
            .withMessage('La marca es requerida')
            .isLength({ min: 2, max: 50 })
            .withMessage('La marca debe tener entre 2 y 50 caracteres'),
        
        body('modelo')
            .trim()
            .notEmpty()
            .withMessage('El modelo es requerido')
            .isLength({ min: 1, max: 50 })
            .withMessage('El modelo debe tener entre 1 y 50 caracteres'),
        
        body('año')
            .optional()
            .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
            .withMessage(`El año debe estar entre 1990 y ${new Date().getFullYear() + 1}`),
        
        body('color')
            .optional()
            .trim()
            .isLength({ max: 30 })
            .withMessage('El color no puede exceder 30 caracteres'),
        
        body('capacidad')
            .isInt({ min: 1, max: 100 })
            .withMessage('La capacidad debe ser un número entre 1 y 100'),
        
        body('tipo_combustible')
            .isIn(['GASOLINA', 'DIESEL', 'ELECTRICO', 'HIBRIDO'])
            .withMessage('El tipo de combustible debe ser GASOLINA, DIESEL, ELECTRICO o HIBRIDO'),
        
        body('estado')
            .optional()
            .isIn(['DISPONIBLE', 'EN_REPARACION', 'EN_USO', 'INACTIVO'])
            .withMessage('El estado debe ser DISPONIBLE, EN_REPARACION, EN_USO o INACTIVO'),
        
        body('kilometraje_actual')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El kilometraje debe ser un número positivo'),
        
        this.manejarResultadosValidacion
    ];

    validarActualizacionVehiculo = [
        body('placa')
            .optional()
            .trim()
            .isLength({ min: 6, max: 10 })
            .withMessage('La placa debe tener entre 6 y 10 caracteres')
            .matches(/^[A-Z0-9-]+$/)
            .withMessage('La placa solo puede contener letras mayúsculas, números y guiones')
            .custom(this.verificarPlacaUnica),
        
        body('marca')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('La marca debe tener entre 2 y 50 caracteres'),
        
        body('modelo')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('El modelo debe tener entre 1 y 50 caracteres'),
        
        body('año')
            .optional()
            .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
            .withMessage(`El año debe estar entre 1990 y ${new Date().getFullYear() + 1}`),
        
        body('color')
            .optional()
            .trim()
            .isLength({ max: 30 })
            .withMessage('El color no puede exceder 30 caracteres'),
        
        body('capacidad')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('La capacidad debe ser un número entre 1 y 100'),
        
        body('tipo_combustible')
            .optional()
            .isIn(['GASOLINA', 'DIESEL', 'ELECTRICO', 'HIBRIDO'])
            .withMessage('El tipo de combustible debe ser GASOLINA, DIESEL, ELECTRICO o HIBRIDO'),
        
        body('estado')
            .optional()
            .isIn(['DISPONIBLE', 'EN_REPARACION', 'EN_USO', 'INACTIVO'])
            .withMessage('El estado debe ser DISPONIBLE, EN_REPARACION, EN_USO o INACTIVO'),
        
        body('kilometraje_actual')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El kilometraje debe ser un número positivo'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Conductores
     */
    validarConductor = [
        body('usuario_id')
            .isInt({ min: 1 })
            .withMessage('El ID de usuario debe ser un número válido')
            .custom(this.verificarUsuarioExistente),
        
        body('licencia_numero')
            .trim()
            .notEmpty()
            .withMessage('El número de licencia es requerido')
            .isLength({ min: 5, max: 20 })
            .withMessage('El número de licencia debe tener entre 5 y 20 caracteres')
            .custom(this.verificarLicenciaUnica),
        
        body('licencia_categoria')
            .trim()
            .notEmpty()
            .withMessage('La categoría de licencia es requerida')
            .isIn(['A', 'B', 'C', 'D', 'E'])
            .withMessage('La categoría de licencia debe ser A, B, C, D o E'),
        
        body('licencia_vencimiento')
            .isDate()
            .withMessage('La fecha de vencimiento debe ser una fecha válida')
            .custom((fecha) => {
                const fechaVencimiento = new Date(fecha);
                const hoy = new Date();
                return fechaVencimiento > hoy;
            })
            .withMessage('La fecha de vencimiento debe ser futura'),
        
        body('telefono')
            .optional()
            .trim()
            .matches(/^[0-9+\-\s()]{7,15}$/)
            .withMessage('El teléfono debe ser un número válido'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Inventario
     */
    validarItemInventario = [
        body('nombre')
            .trim()
            .notEmpty()
            .withMessage('El nombre del ítem es requerido')
            .isLength({ min: 2, max: 150 })
            .withMessage('El nombre debe tener entre 2 y 150 caracteres'),
        
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('La descripción no puede exceder 500 caracteres'),
        
        body('categoria_id')
            .isInt({ min: 1 })
            .withMessage('La categoría debe ser un ID válido')
            .custom(this.verificarCategoriaExistente),
        
        body('stock_actual')
            .optional()
            .isInt({ min: 0 })
            .withMessage('El stock actual debe ser un número entero positivo'),
        
        body('stock_minimo')
            .optional()
            .isInt({ min: 0 })
            .withMessage('El stock mínimo debe ser un número entero positivo'),
        
        body('stock_maximo')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El stock máximo debe ser un número entero mayor a 0'),
        
        body('unidad_medida')
            .optional()
            .trim()
            .isIn(['UNIDAD', 'LITRO', 'KILO', 'METRO', 'CAJA', 'PAQUETE'])
            .withMessage('La unidad de medida debe ser UNIDAD, LITRO, KILO, METRO, CAJA o PAQUETE'),
        
        body('precio_unitario')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El precio unitario debe ser un número positivo'),
        
        body('ubicacion')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('La ubicación no puede exceder 100 caracteres'),
        
        this.manejarResultadosValidacion
    ];

    validarMovimientoInventario = [
        body('item_id')
            .isInt({ min: 1 })
            .withMessage('El ID del ítem es requerido')
            .custom(this.verificarItemInventarioExistente),
        
        body('tipo_movimiento')
            .isIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
            .withMessage('El tipo de movimiento debe ser ENTRADA, SALIDA o AJUSTE'),
        
        body('cantidad')
            .isInt({ min: 1 })
            .withMessage('La cantidad debe ser un número entero mayor a 0'),
        
        body('motivo')
            .trim()
            .notEmpty()
            .withMessage('El motivo del movimiento es requerido')
            .isLength({ max: 500 })
            .withMessage('El motivo no puede exceder 500 caracteres'),
        
        body('referencia_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('La referencia debe ser un ID válido'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Reparaciones
     */
    validarReparacion = [
        body('vehiculo_id')
            .isInt({ min: 1 })
            .withMessage('El ID del vehículo es requerido')
            .custom(this.verificarVehiculoExistente),
        
        body('tecnico_id')
            .isInt({ min: 1 })
            .withMessage('El ID del técnico es requerido')
            .custom(this.verificarTecnicoExistente),
        
        body('fecha_recepcion')
            .isDate()
            .withMessage('La fecha de recepción debe ser una fecha válida'),
        
        body('fecha_estimada_entrega')
            .optional()
            .isDate()
            .withMessage('La fecha estimada de entrega debe ser una fecha válida')
            .custom((fechaEstimada, { req }) => {
                if (!req.body.fecha_recepcion) return true;
                const recepcion = new Date(req.body.fecha_recepcion);
                const estimada = new Date(fechaEstimada);
                return estimada > recepcion;
            })
            .withMessage('La fecha estimada de entrega debe ser posterior a la fecha de recepción'),
        
        body('descripcion_problema')
            .trim()
            .notEmpty()
            .withMessage('La descripción del problema es requerida')
            .isLength({ min: 10, max: 1000 })
            .withMessage('La descripción del problema debe tener entre 10 y 1000 caracteres'),
        
        body('diagnostico')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('El diagnóstico no puede exceder 1000 caracteres'),
        
        body('estado')
            .optional()
            .isIn(['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'])
            .withMessage('El estado debe ser RECIBIDO, DIAGNOSTICO, EN_REPARACION, TERMINADO o ENTREGADO'),
        
        body('costo_total')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El costo total debe ser un número positivo'),
        
        this.manejarResultadosValidacion
    ];

    validarConsumoRepuesto = [
        body('reparacion_id')
            .isInt({ min: 1 })
            .withMessage('El ID de la reparación es requerido')
            .custom(this.verificarReparacionExistente),
        
        body('item_id')
            .isInt({ min: 1 })
            .withMessage('El ID del repuesto es requerido')
            .custom(this.verificarItemInventarioExistente),
        
        body('cantidad')
            .isInt({ min: 1 })
            .withMessage('La cantidad debe ser un número entero mayor a 0'),
        
        body('costo_unitario')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El costo unitario debe ser un número positivo'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Reservas
     */
    validarReserva = [
        body('vehiculo_id')
            .isInt({ min: 1 })
            .withMessage('El ID del vehículo es requerido')
            .custom(this.verificarVehiculoExistente),
        
        body('conductor_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El ID del conductor debe ser válido')
            .custom(this.verificarConductorExistente),
        
        body('fecha_reserva')
            .isDate()
            .withMessage('La fecha de reserva debe ser una fecha válida')
            .custom((fecha) => {
                const fechaReserva = new Date(fecha);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                return fechaReserva >= hoy;
            })
            .withMessage('La fecha de reserva no puede ser en el pasado'),
        
        body('hora_inicio')
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
            .withMessage('La hora de inicio debe tener formato HH:MM:SS'),
        
        body('hora_fin')
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
            .withMessage('La hora de fin debe tener formato HH:MM:SS')
            .custom((horaFin, { req }) => {
                if (!req.body.hora_inicio) return true;
                return horaFin > req.body.hora_inicio;
            })
            .withMessage('La hora de fin debe ser posterior a la hora de inicio'),
        
        body('origen')
            .trim()
            .notEmpty()
            .withMessage('El origen es requerido')
            .isLength({ max: 200 })
            .withMessage('El origen no puede exceder 200 caracteres'),
        
        body('destino')
            .trim()
            .notEmpty()
            .withMessage('El destino es requerido')
            .isLength({ max: 200 })
            .withMessage('El destino no puede exceder 200 caracteres'),
        
        body('motivo')
            .trim()
            .notEmpty()
            .withMessage('El motivo de la reserva es requerido')
            .isLength({ min: 10, max: 500 })
            .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
        
        this.manejarResultadosValidacion
    ];

    validarActualizacionReserva = [
        body('estado')
            .isIn(['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'])
            .withMessage('El estado debe ser PENDIENTE, APROBADA, RECHAZADA, CANCELADA o COMPLETADA'),
        
        body('observaciones')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Las observaciones no pueden exceder 500 caracteres'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Parámetros de URL
     */
    validarParametroId = [
        param('id')
            .isInt({ min: 1 })
            .withMessage('El ID debe ser un número entero positivo'),
        
        this.manejarResultadosValidacion
    ];

    validarParametroEmail = [
        param('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Debe proporcionar un email válido'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones para Queries
     */
    validarQueryPaginacion = [
        query('pagina')
            .optional()
            .isInt({ min: 1 })
            .withMessage('La página debe ser un número entero positivo'),
        
        query('limite')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),
        
        this.manejarResultadosValidacion
    ];

    validarQueryFechas = [
        query('fecha_inicio')
            .optional()
            .isDate()
            .withMessage('La fecha de inicio debe ser una fecha válida'),
        
        query('fecha_fin')
            .optional()
            .isDate()
            .withMessage('La fecha de fin debe ser una fecha válida')
            .custom((fechaFin, { req }) => {
                if (!req.query.fecha_inicio) return true;
                const inicio = new Date(req.query.fecha_inicio);
                const fin = new Date(fechaFin);
                return fin >= inicio;
            })
            .withMessage('La fecha de fin debe ser posterior o igual a la fecha de inicio'),
        
        this.manejarResultadosValidacion
    ];

    /**
     * Validaciones Personalizadas (Custom Validators)
     */

    // Verificar si el email es único
    verificarEmailUnico = async (email) => {
        try {
            const conexion = await obtenerConexion();
            const [usuarios] = await conexion.execute(
                'SELECT id FROM usuarios WHERE email = ?',
                [email]
            );
            
            if (usuarios.length > 0) {
                throw new Error('El email ya está registrado');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando email único');
        }
    };

    // Verificar si el rol existe
    verificarRolExistente = async (rolId) => {
        try {
            const conexion = await obtenerConexion();
            const [roles] = await conexion.execute(
                'SELECT id FROM roles WHERE id = ?',
                [rolId]
            );
            
            if (roles.length === 0) {
                throw new Error('El rol especificado no existe');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando rol');
        }
    };

    // Verificar si la placa es única
    verificarPlacaUnica = async (placa, { req }) => {
        try {
            const conexion = await obtenerConexion();
            let consulta = 'SELECT id FROM vehiculos WHERE placa = ?';
            const parametros = [placa];
            
            // Excluir el vehículo actual en actualizaciones
            if (req.params && req.params.id) {
                consulta += ' AND id != ?';
                parametros.push(req.params.id);
            }
            
            const [vehiculos] = await conexion.execute(consulta, parametros);
            
            if (vehiculos.length > 0) {
                throw new Error('La placa ya está registrada');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando placa única');
        }
    };

    // Verificar si el usuario existe
    verificarUsuarioExistente = async (usuarioId) => {
        try {
            const conexion = await obtenerConexion();
            const [usuarios] = await conexion.execute(
                'SELECT id FROM usuarios WHERE id = ? AND activo = TRUE',
                [usuarioId]
            );
            
            if (usuarios.length === 0) {
                throw new Error('El usuario especificado no existe');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando usuario');
        }
    };

    // Verificar si la licencia es única
    verificarLicenciaUnica = async (licenciaNumero, { req }) => {
        try {
            const conexion = await obtenerConexion();
            let consulta = 'SELECT id FROM conductores WHERE licencia_numero = ?';
            const parametros = [licenciaNumero];
            
            // Excluir el conductor actual en actualizaciones
            if (req.params && req.params.id) {
                consulta += ' AND id != ?';
                parametros.push(req.params.id);
            }
            
            const [conductores] = await conexion.execute(consulta, parametros);
            
            if (conductores.length > 0) {
                throw new Error('El número de licencia ya está registrado');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando licencia única');
        }
    };

    // Verificar si la categoría existe
    verificarCategoriaExistente = async (categoriaId) => {
        try {
            const conexion = await obtenerConexion();
            const [categorias] = await conexion.execute(
                'SELECT id FROM categorias_inventario WHERE id = ?',
                [categoriaId]
            );
            
            if (categorias.length === 0) {
                throw new Error('La categoría especificada no existe');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando categoría');
        }
    };

    // Verificar si el ítem de inventario existe
    verificarItemInventarioExistente = async (itemId) => {
        try {
            const conexion = await obtenerConexion();
            const [items] = await conexion.execute(
                'SELECT id FROM items_inventario WHERE id = ? AND activo = TRUE',
                [itemId]
            );
            
            if (items.length === 0) {
                throw new Error('El ítem de inventario especificado no existe');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando ítem de inventario');
        }
    };

    // Verificar si el vehículo existe
    verificarVehiculoExistente = async (vehiculoId) => {
        try {
            const conexion = await obtenerConexion();
            const [vehiculos] = await conexion.execute(
                'SELECT id FROM vehiculos WHERE id = ?',
                [vehiculoId]
            );
            
            if (vehiculos.length === 0) {
                throw new Error('El vehículo especificado no existe');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando vehículo');
        }
    };

    // Verificar si el técnico existe y tiene rol adecuado
    verificarTecnicoExistente = async (tecnicoId) => {
        try {
            const conexion = await obtenerConexion();
            const [tecnicos] = await conexion.execute(
                `SELECT u.id FROM usuarios u 
                 INNER JOIN roles r ON u.rol_id = r.id 
                 WHERE u.id = ? AND u.activo = TRUE AND r.nombre IN ('ADMINISTRADOR', 'TECNICO')`,
                [tecnicoId]
            );
            
            if (tecnicos.length === 0) {
                throw new Error('El técnico especificado no existe o no tiene permisos adecuados');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando técnico');
        }
    };

    // Verificar si la reparación existe
    verificarReparacionExistente = async (reparacionId) => {
        try {
            const conexion = await obtenerConexion();
            const [reparaciones] = await conexion.execute(
                'SELECT id FROM reparaciones WHERE id = ?',
                [reparacionId]
            );
            
            if (reparaciones.length === 0) {
                throw new Error('La reparación especificada no existe');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando reparación');
        }
    };

    // Verificar si el conductor existe
    verificarConductorExistente = async (conductorId) => {
        try {
            const conexion = await obtenerConexion();
            const [conductores] = await conexion.execute(
                'SELECT id FROM conductores WHERE id = ? AND habilitado = TRUE',
                [conductorId]
            );
            
            if (conductores.length === 0) {
                throw new Error('El conductor especificado no existe o no está habilitado');
            }
            
            return true;
        } catch (error) {
            throw new Error('Error verificando conductor');
        }
    };
}

// Crear instancia y exportar
const middlewareValidacion = new MiddlewareValidacion();

module.exports = middlewareValidacion;