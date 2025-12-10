/**
 * Validadores personalizados para el sistema UMSA Transporte
 */

const Helpers = require('./helpers');

class Validators {
    
    /**
     * Validar datos de usuario
     */
    static validarUsuario(usuarioData) {
        const errores = [];

        // Validar email
        if (!usuarioData.email || !Helpers.validarEmail(usuarioData.email)) {
            errores.push('Email inválido');
        }

        // Validar nombres y apellidos
        if (!usuarioData.nombres || usuarioData.nombres.length < 2) {
            errores.push('Los nombres deben tener al menos 2 caracteres');
        }

        if (!usuarioData.apellidos || usuarioData.apellidos.length < 2) {
            errores.push('Los apellidos deben tener al menos 2 caracteres');
        }

        // Validar teléfono si se proporciona
        if (usuarioData.telefono && !Helpers.validarTelefono(usuarioData.telefono)) {
            errores.push('Teléfono inválido. Formato: 7XXXXXXXX o 6XXXXXXXX');
        }

        // Validar rol
        const rolesValidos = [1, 2, 3, 4]; // Admin, Técnico, Conductor, Solicitante
        if (!usuarioData.rol_id || !rolesValidos.includes(parseInt(usuarioData.rol_id))) {
            errores.push('Rol de usuario inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar datos de vehículo
     */
    static validarVehiculo(vehiculoData) {
        const errores = [];

        // Validar placa
        if (!vehiculoData.placa || !Helpers.validarPlaca(vehiculoData.placa)) {
            errores.push('Placa inválida. Formato: ABC-1234');
        }

        // Validar marca y modelo
        if (!vehiculoData.marca || vehiculoData.marca.length < 2) {
            errores.push('La marca es requerida');
        }

        if (!vehiculoData.modelo || vehiculoData.modelo.length < 1) {
            errores.push('El modelo es requerido');
        }

        // Validar capacidad
        if (!vehiculoData.capacidad || vehiculoData.capacidad < 1) {
            errores.push('La capacidad debe ser mayor a 0');
        }

        // Validar tipo de combustible
        const combustiblesValidos = ['GASOLINA', 'DIESEL', 'ELECTRICO', 'HIBRIDO'];
        if (!vehiculoData.tipo_combustible || !combustiblesValidos.includes(vehiculoData.tipo_combustible)) {
            errores.push('Tipo de combustible inválido');
        }

        // Validar año si se proporciona
        if (vehiculoData.año) {
            const añoActual = new Date().getFullYear();
            if (vehiculoData.año < 1990 || vehiculoData.año > añoActual + 1) {
                errores.push('Año del vehículo inválido');
            }
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar datos de reserva
     */
    static validarReserva(reservaData) {
        const errores = [];

        // Validar fechas y horarios
        if (!reservaData.fecha_reserva) {
            errores.push('Fecha de reserva requerida');
        } else if (!Helpers.esFechaReservaValida(reservaData.fecha_reserva)) {
            errores.push('La fecha de reserva debe ser futura y dentro del rango permitido');
        }

        if (!reservaData.hora_inicio || !Helpers.validarHorario(reservaData.hora_inicio)) {
            errores.push('Horario de inicio inválido');
        }

        if (!reservaData.hora_fin || !Helpers.validarHorario(reservaData.hora_fin)) {
            errores.push('Horario de fin inválido');
        }

        if (reservaData.hora_inicio && reservaData.hora_fin) {
            if (Helpers.compararHorarios(reservaData.hora_inicio, reservaData.hora_fin) >= 0) {
                errores.push('El horario de fin debe ser posterior al horario de inicio');
            }

            // Validar duración mínima (15 minutos)
            const duracion = Helpers.calcularDuracionMinutos(reservaData.hora_inicio, reservaData.hora_fin);
            if (duracion < 15) {
                errores.push('La duración mínima de reserva es 15 minutos');
            }

            // Validar duración máxima (12 horas)
            if (duracion > 12 * 60) {
                errores.push('La duración máxima de reserva es 12 horas');
            }
        }

        // Validar ubicaciones: origen opcional, destino requerido
        if (reservaData.origen && reservaData.origen.length < 5) {
            errores.push('El origen debe tener al menos 5 caracteres si se proporciona');
        }

        if (!reservaData.destino || reservaData.destino.length < 5) {
            errores.push('El destino es requerido y debe tener al menos 5 caracteres');
        }

        // Validar motivo
        if (!reservaData.motivo || reservaData.motivo.length < 10) {
            errores.push('El motivo es requerido y debe tener al menos 10 caracteres');
        }

        // Número de pasajeros: campo opcional en DB actual; validar solo si viene
        if (reservaData.numero_pasajeros !== undefined) {
            if (reservaData.numero_pasajeros < 1) {
                errores.push('El número de pasajeros debe ser mayor a 0');
            }
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar datos de reparación
     */
    static validarReparacion(reparacionData) {
        const errores = [];

        // Validar fechas
        if (!reparacionData.fecha_recepcion) {
            errores.push('Fecha de recepción requerida');
        }

        if (reparacionData.fecha_estimada_entrega) {
            const fechaRecepcion = moment(reparacionData.fecha_recepcion);
            const fechaEstimada = moment(reparacionData.fecha_estimada_entrega);
            
            if (fechaEstimada.isBefore(fechaRecepcion)) {
                errores.push('La fecha estimada de entrega no puede ser anterior a la fecha de recepción');
            }
        }

        // Validar descripción del problema
        if (!reparacionData.descripcion_problema || reparacionData.descripcion_problema.length < 10) {
            errores.push('La descripción del problema es requerida y debe tener al menos 10 caracteres');
        }

        // Validar IDs de relaciones
        if (!reparacionData.vehiculo_id) {
            errores.push('Vehículo requerido');
        }

        if (!reparacionData.tecnico_id) {
            errores.push('Técnico asignado requerido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar datos de conductor
     */
    static validarConductor(conductorData) {
        const errores = [];

        // Validar licencia
        if (!conductorData.licencia_numero) {
            errores.push('Número de licencia requerido');
        }

        if (!conductorData.licencia_categoria || !Helpers.validarCategoriaLicencia(conductorData.licencia_categoria)) {
            errores.push('Categoría de licencia inválida');
        }

        // Validar vencimiento de licencia
        if (!conductorData.licencia_vencimiento) {
            errores.push('Fecha de vencimiento de licencia requerida');
        } else {
            const vencimiento = moment(conductorData.licencia_vencimiento);
            if (vencimiento.isBefore(moment())) {
                errores.push('La licencia no puede estar vencida');
            }
        }

        // Validar teléfono
        if (conductorData.telefono && !Helpers.validarTelefono(conductorData.telefono)) {
            errores.push('Teléfono inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar datos de ítem de inventario
     */
    static validarItemInventario(itemData) {
        const errores = [];

        // Validar nombre
        if (!itemData.nombre || itemData.nombre.length < 2) {
            errores.push('El nombre del ítem es requerido y debe tener al menos 2 caracteres');
        }

        // Validar categoría
        if (!itemData.categoria_id) {
            errores.push('Categoría requerida');
        }

        // Validar stocks
        if (itemData.stock_actual !== undefined && itemData.stock_actual < 0) {
            errores.push('El stock actual no puede ser negativo');
        }

        if (itemData.stock_minimo !== undefined && itemData.stock_minimo < 0) {
            errores.push('El stock mínimo no puede ser negativo');
        }

        if (itemData.stock_maximo !== undefined && itemData.stock_maximo < 0) {
            errores.push('El stock máximo no puede ser negativo');
        }

        if (itemData.stock_minimo !== undefined && itemData.stock_maximo !== undefined) {
            if (itemData.stock_maximo < itemData.stock_minimo) {
                errores.push('El stock máximo no puede ser menor al stock mínimo');
            }
        }

        // Validar precio si se proporciona
        if (itemData.precio_unitario !== undefined && itemData.precio_unitario < 0) {
            errores.push('El precio unitario no puede ser negativo');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar movimiento de inventario
     */
    static validarMovimientoInventario(movimientoData) {
        const errores = [];

        // Validar cantidad
        if (!movimientoData.cantidad || movimientoData.cantidad <= 0) {
            errores.push('La cantidad debe ser mayor a 0');
        }

        // Validar motivo
        if (!movimientoData.motivo || movimientoData.motivo.length < 5) {
            errores.push('El motivo es requerido y debe tener al menos 5 caracteres');
        }

        // Validar tipo de movimiento
        const tiposValidos = ['ENTRADA', 'SALIDA', 'AJUSTE'];
        if (!movimientoData.tipo_movimiento || !tiposValidos.includes(movimientoData.tipo_movimiento)) {
            errores.push('Tipo de movimiento inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar datos de categoría de inventario
     */
    static validarCategoriaInventario(categoriaData) {
        const errores = [];

        // Validar nombre
        if (!categoriaData.nombre || categoriaData.nombre.length < 2) {
            errores.push('El nombre de la categoría es requerido y debe tener al menos 2 caracteres');
        }

        // Validar tipo
        const tiposValidos = ['LIMPIEZA', 'REPUESTO', 'HERRAMIENTA'];
        if (!categoriaData.tipo || !tiposValidos.includes(categoriaData.tipo)) {
            errores.push('Tipo de categoría inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar filtros de búsqueda
     */
    static validarFiltros(filtros, tiposPermitidos = {}) {
        const errores = [];

        for (const [campo, valor] of Object.entries(filtros)) {
            // Validar campos permitidos
            if (tiposPermitidos[campo] && !tiposPermitidos[campo].includes(typeof valor)) {
                errores.push(`Tipo inválido para el filtro ${campo}`);
            }

            // Validar longitud máxima para campos de texto
            if (typeof valor === 'string' && valor.length > 100) {
                errores.push(`El filtro ${campo} excede la longitud máxima permitida`);
            }
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Validar paginación
     */
    static validarPaginacion(pagina, limite) {
        const errores = [];

        const paginaNum = parseInt(pagina);
        const limiteNum = parseInt(limite);

        if (isNaN(paginaNum) || paginaNum < 1) {
            errores.push('La página debe ser un número mayor a 0');
        }

        if (isNaN(limiteNum) || limiteNum < 1 || limiteNum > 100) {
            errores.push('El límite debe ser un número entre 1 y 100');
        }

        return {
            valido: errores.length === 0,
            errores,
            pagina: paginaNum,
            limite: limiteNum
        };
    }

    /**
     * Sanitizar datos de entrada
     */
    static sanitizarEntrada(datos) {
        const sanitizados = {};

        for (const [clave, valor] of Object.entries(datos)) {
            if (typeof valor === 'string') {
                sanitizados[clave] = Helpers.sanitizarTexto(valor);
            } else {
                sanitizados[clave] = valor;
            }
        }

        return sanitizados;
    }
}

module.exports = Validators;