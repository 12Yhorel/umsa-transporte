const { ejecutarConsulta } = require('../config/database');

class DashboardController {
    // Obtener todas las estadísticas del sistema
    static async obtenerEstadisticas(req, res) {
        try {
            // Estadísticas de vehículos
            const [vehiculos] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN estado = 'EN_USO' THEN 1 ELSE 0 END) as enUso,
                    SUM(CASE WHEN estado = 'EN_REPARACION' THEN 1 ELSE 0 END) as mantenimiento
                FROM vehiculos
            `);

            // Estadísticas de reservas
            const [reservas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado IN ('APROBADO', 'EN_USO') THEN 1 ELSE 0 END) as activas,
                    SUM(CASE WHEN estado = 'COMPLETADO' THEN 1 ELSE 0 END) as completadas
                FROM reservas
            `);

            // Estadísticas de reparaciones
            const [reparaciones] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado IN ('RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION') THEN 1 ELSE 0 END) as enProceso,
                    SUM(CASE WHEN estado IN ('TERMINADO', 'ENTREGADO') THEN 1 ELSE 0 END) as completadas
                FROM reparaciones
            `);

            // Estadísticas de inventario
            const [inventario] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as bajoStock
                FROM items_inventario
                WHERE activo = TRUE
            `);

            // Estadísticas de conductores
            const [conductores] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN habilitado = TRUE THEN 1 ELSE 0 END) as activos
                FROM conductores
            `);

            res.json({
                success: true,
                data: {
                    vehiculos: {
                        total: parseInt(vehiculos[0].total) || 0,
                        disponibles: parseInt(vehiculos[0].disponibles) || 0,
                        enUso: parseInt(vehiculos[0].enUso) || 0,
                        mantenimiento: parseInt(vehiculos[0].mantenimiento) || 0
                    },
                    reservas: {
                        total: parseInt(reservas[0].total) || 0,
                        pendientes: parseInt(reservas[0].pendientes) || 0,
                        activas: parseInt(reservas[0].activas) || 0,
                        completadas: parseInt(reservas[0].completadas) || 0
                    },
                    reparaciones: {
                        total: parseInt(reparaciones[0].total) || 0,
                        enProceso: parseInt(reparaciones[0].enProceso) || 0,
                        completadas: parseInt(reparaciones[0].completadas) || 0
                    },
                    inventario: {
                        total: parseInt(inventario[0].total) || 0,
                        bajoStock: parseInt(inventario[0].bajoStock) || 0
                    },
                    conductores: {
                        total: parseInt(conductores[0].total) || 0,
                        activos: parseInt(conductores[0].activos) || 0
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener estadísticas del dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
}

module.exports = DashboardController;
