const ModeloUsuario = require('../models/Usuario');
const PDFGenerator = require('../utils/pdfGenerator');

class UsuarioController {
    
    /**
     * Obtener todos los usuarios
     */
    static async obtenerTodos(req, res) {
        const inicio = Date.now();
        console.log(`[Usuarios] Iniciando petición: ${req.method} ${req.originalUrl}`);
        
        try {
            const { pagina = 1, limite = 10, rol_id, activo, departamento, busqueda } = req.query;

            const filtros = {};
            if (rol_id) filtros.rol_id = rol_id;
            if (activo !== undefined) filtros.activo = activo === 'true';
            if (departamento) filtros.departamento = departamento;
            if (busqueda) filtros.busqueda = busqueda;

            console.log(`[Usuarios] Llamando modelo con filtros:`, filtros);
            const resultado = await ModeloUsuario.obtenerTodos(pagina, limite, filtros);

            const duracion = Date.now() - inicio;
            console.log(`[Usuarios] Respuesta enviada en ${duracion}ms`);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            const duracion = Date.now() - inicio;
            console.error(`[ERROR] [Usuarios] Error después de ${duracion}ms:`, error.message);
            
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }

    /**
     * Obtener usuario por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            const usuario = await ModeloUsuario.obtenerPorId(id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario
            });

        } catch (error) {
            console.error('Error en UsuarioController.obtenerPorId:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear nuevo usuario
     */
    static async crear(req, res) {
        try {
            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear usuarios'
                });
            }

            const usuarioData = req.body;
            const nuevoUsuario = await ModeloUsuario.crear(usuarioData);

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });

        } catch (error) {
            console.error('Error en UsuarioController.crear:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar usuario
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datosActualizacion = req.body;

            // Verificar permisos (solo administradores o el propio usuario)
            if (req.usuario.rol_id !== 1 && req.usuario.id !== parseInt(id)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar este usuario'
                });
            }

            // Si no es admin, remover campos restringidos
            if (req.usuario.rol_id !== 1) {
                delete datosActualizacion.rol_id;
                delete datosActualizacion.activo;
            }

            const usuarioActualizado = await ModeloUsuario.actualizar(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: usuarioActualizado
            });

        } catch (error) {
            console.error('Error en UsuarioController.actualizar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Desactivar usuario
     */
    static async desactivar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para desactivar usuarios'
                });
            }

            // No permitir desactivarse a sí mismo
            if (req.usuario.id === parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'No puede desactivar su propio usuario'
                });
            }

            await ModeloUsuario.desactivar(id);

            res.json({
                success: true,
                message: 'Usuario desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en UsuarioController.desactivar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Activar usuario
     */
    static async activar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para activar usuarios'
                });
            }

            await ModeloUsuario.actualizar(id, { activo: true });

            res.json({
                success: true,
                message: 'Usuario activado exitosamente'
            });

        } catch (error) {
            console.error('Error en UsuarioController.activar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Eliminar usuario (borrado físico)
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            
            console.log('=== ELIMINAR USUARIO ===');
            console.log('ID a eliminar:', id);
            console.log('Usuario autenticado:', req.usuario);

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1 && req.usuario.rol !== 'ADMINISTRADOR') {
                console.log('Permiso denegado - Usuario no es admin');
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar usuarios'
                });
            }

            // No permitir eliminarse a sí mismo
            if (req.usuario.id === parseInt(id)) {
                console.log('Error - Intentando eliminarse a sí mismo');
                return res.status(400).json({
                    success: false,
                    message: 'No puede eliminar su propio usuario'
                });
            }

            console.log('Llamando a ModeloUsuario.eliminar...');
            await ModeloUsuario.eliminar(id);
            console.log('Usuario eliminado exitosamente');

            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error en UsuarioController.eliminar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener estadísticas de usuarios
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ModeloUsuario.obtenerEstadisticas();

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error en UsuarioController.obtenerEstadisticas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener todos los roles del sistema
     */
    static async obtenerRoles(req, res) {
        try {
            const roles = await ModeloUsuario.obtenerTodosRoles();

            res.json({
                success: true,
                data: roles
            });

        } catch (error) {
            console.error('Error en UsuarioController.obtenerRoles:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Generar reporte PDF de usuarios
     */
    static async generarReportePDF(req, res) {
        try {
            const { rol_id, activo, departamento } = req.query;

            const filtros = {};
            if (rol_id) filtros.rol_id = rol_id;
            if (activo !== undefined) filtros.activo = activo === 'true';
            if (departamento) filtros.departamento = departamento;

            const resultado = await ModeloUsuario.obtenerTodos(1, 1000, filtros);
            const usuarios = resultado.usuarios || [];

            // Métricas avanzadas
            const activos = usuarios.filter(u => u.activo === true || u.activo === 1).length;
            const inactivos = usuarios.filter(u => u.activo === false || u.activo === 0).length;
            
            // Análisis por rol
            const rolCounts = {};
            usuarios.forEach(u => {
                const rol = u.rol_nombre || 'Sin Rol';
                rolCounts[rol] = (rolCounts[rol] || 0) + 1;
            });

            // Análisis por departamento
            const deptoCounts = {};
            usuarios.forEach(u => {
                const depto = u.departamento || 'Sin Asignar';
                deptoCounts[depto] = (deptoCounts[depto] || 0) + 1;
            });

            // Top departamentos
            const topDepartamentos = Object.entries(deptoCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const doc = PDFGenerator.createDocument();

            // Configurar pie de página automático
            PDFGenerator.setupAutoFooter(doc);

            const subtitle = rol_id || activo !== undefined || departamento
                ? `Reporte Filtrado - ${new Date().toLocaleDateString('es-BO')}`
                : `Reporte General - ${new Date().toLocaleDateString('es-BO')}`;
            PDFGenerator.addHeader(doc, 'REPORTE DE USUARIOS DEL SISTEMA', subtitle);

            // Estadísticas en cajas
            const stats = [
                { label: 'Total Usuarios', value: usuarios.length.toString() },
                { label: 'Activos', value: activos.toString() },
                { label: 'Inactivos', value: inactivos.toString() },
                { label: 'Administradores', value: (rolCounts['Administrador'] || 0).toString() },
                { label: 'Tecnicos', value: (rolCounts['Tecnico'] || 0).toString() },
                { label: 'Usuarios', value: (rolCounts['Usuario'] || 0).toString() },
                { label: 'Departamentos', value: Object.keys(deptoCounts).length.toString() },
                { label: 'Tasa Activos', value: `${((activos / usuarios.length) * 100 || 0).toFixed(1)}%` }
            ];
            PDFGenerator.addStatsSection(doc, stats);

            // Gráfico por rol
            const chartDataRol = Object.entries(rolCounts).map(([rol, count]) => ({
                label: rol,
                value: count
            }));
            if (chartDataRol.length > 0) {
                PDFGenerator.addBarChart(doc, 'DISTRIBUCION POR ROL', chartDataRol);
            }

            // Departamentos con más usuarios
            if (topDepartamentos.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#1a5490')
                   .text('DEPARTAMENTOS CON MAS USUARIOS', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                topDepartamentos.forEach(([depto, count], index) => {
                    const porcentaje = ((count / usuarios.length) * 100).toFixed(1);
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text(`${index + 1}. ${depto}: ${count} usuarios (${porcentaje}%)`, 70)
                       .moveDown(0.3);
                });
                doc.moveDown();
            }

            // Análisis de estado
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('ANALISIS DE ESTADO', 50, doc.y)
               .fillColor('black')
               .moveDown(0.5);

            doc.fontSize(10)
               .font('Helvetica')
               .text(`• Usuarios activos: ${activos} (${((activos / usuarios.length) * 100 || 0).toFixed(1)}%)`, 70)
               .moveDown(0.3)
               .text(`• Usuarios inactivos: ${inactivos} (${((inactivos / usuarios.length) * 100 || 0).toFixed(1)}%)`, 70)
               .moveDown(0.3)
               .text(`• Total de roles diferentes: ${Object.keys(rolCounts).length}`, 70)
               .moveDown(1);

            // Tabla detallada
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DETALLE DE USUARIOS', 50, 50)
               .fillColor('black')
               .moveDown(1);

            const headers = ['Nombre', 'Email', 'Rol', 'Depto', 'Estado', 'Tel'];
            const rows = usuarios.slice(0, 50).map(u => [
                `${u.nombres} ${u.apellidos}`.substring(0, 18),
                (u.email || 'N/A').substring(0, 28),
                (u.rol_nombre || 'N/A').substring(0, 15),
                (u.departamento || 'N/A').substring(0, 15),
                u.activo ? 'Activo' : 'Inactivo',
                (u.telefono || '-').substring(0, 10)
            ]);

            if (rows.length > 0) {
                // Anchos personalizados: Nombre(85), Email(130), Rol(75), Depto(80), Estado(50), Tel(50)
                PDFGenerator.addTable(doc, headers, rows, { 
                    columnWidths: [85, 130, 75, 80, 50, 50],
                    rowHeight: 22 
                });
            }

            const filename = `usuarios_${new Date().getTime()}.pdf`;
            PDFGenerator.sendAsResponse(doc, res, filename);

        } catch (error) {
            console.error('Error en UsuarioController.generarReportePDF:', error.message);
            res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
        }
    }
}

module.exports = UsuarioController;