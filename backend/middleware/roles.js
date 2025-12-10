/**
 * Configuración de roles y permisos - UMSA Transporte
 */

const rolesYPermisos = {
    ADMINISTRADOR: {
        nivel: 4,
        descripcion: 'Acceso completo al sistema',
        permisos: [
            'gestion_usuarios',
            'gestion_vehiculos', 
            'gestion_conductores',
            'gestion_inventario',
            'gestion_reparaciones',
            'gestion_reservas',
            'generar_reportes',
            'configuracion_sistema'
        ]
    },
    TECNICO: {
        nivel: 3,
        descripcion: 'Gestión de inventarios y reparaciones',
        permisos: [
            'gestion_vehiculos',
            'gestion_inventario', 
            'gestion_reparaciones',
            'gestion_reservas',
            'generar_reportes'
        ]
    },
    CONDUCTOR: {
        nivel: 2,
        descripcion: 'Operación de vehículos',
        permisos: [
            'ver_vehiculos',
            'ver_reservas_propias',
            'actualizar_estado_vehiculo'
        ]
    },
    SOLICITANTE: {
        nivel: 1,
        descripcion: 'Solicitud de reservas',
        permisos: [
            'solicitar_reservas',
            'ver_reservas_propias',
            'cancelar_reservas_propias'
        ]
    }
};

// Funciones de utilidad para permisos
const tienePermiso = (usuario, permiso) => {
    if (!usuario || !usuario.rol) return false;
    
    const rolConfig = rolesYPermisos[usuario.rol];
    return rolConfig && rolConfig.permisos.includes(permiso);
};

const puedeGestionarUsuarios = (usuario) => tienePermiso(usuario, 'gestion_usuarios');
const puedeGestionarVehiculos = (usuario) => tienePermiso(usuario, 'gestion_vehiculos');
const puedeGestionarInventario = (usuario) => tienePermiso(usuario, 'gestion_inventario');
const puedeGestionarReparaciones = (usuario) => tienePermiso(usuario, 'gestion_reparaciones');
const puedeGestionarReservas = (usuario) => tienePermiso(usuario, 'gestion_reservas');

module.exports = {
    rolesYPermisos,
    tienePermiso,
    puedeGestionarUsuarios,
    puedeGestionarVehiculos,
    puedeGestionarInventario,
    puedeGestionarReparaciones,
    puedeGestionarReservas
};