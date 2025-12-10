/**
 * Sistema de notificaciones para el sistema UMSA Transporte
 */

const nodemailer = require('nodemailer');
const moment = require('moment');

class Notificaciones {
    
    /**
     * Configurar transporter de email
     */
    static configurarTransporter() {
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Enviar notificación por email
     */
    static async enviarEmail(destinatario, asunto, mensaje, adjuntos = []) {
        try {
            // Validar configuración de email
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('Configuración de email no disponible. Notificación simulada:', asunto);
                return { success: true, simulada: true, mensaje: 'Notificación simulada (email no configurado)' };
            }

            const transporter = this.configurarTransporter();

            const opcionesEmail = {
                from: `"Sistema UMSA Transporte" <${process.env.SMTP_USER}>`,
                to: destinatario,
                subject: asunto,
                html: this.plantillaEmailBase(asunto, mensaje),
                attachments: adjuntos
            };

            const resultado = await transporter.sendMail(opcionesEmail);
            
            console.log(`Email enviado a ${destinatario}: ${asunto}`);
            return { success: true, messageId: resultado.messageId };

        } catch (error) {
            console.error('Error enviando email:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Plantilla base para emails
     */
    static plantillaEmailBase(asunto, contenido) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            background: #1E3A8A; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
        }
        .content { 
            background: #f9f9f9; 
            padding: 20px; 
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            padding: 20px; 
            color: #666; 
            font-size: 12px;
        }
        .btn {
            display: inline-block;
            background: #1E3A8A;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
        .alert { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 10px; 
            border-radius: 4px; 
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏛️ UMSA Transporte</h1>
        <p>Sistema de la Unidad de Transporte Universitario</p>
    </div>
    <div class="content">
        <h2>${asunto}</h2>
        <div>${contenido}</div>
    </div>
    <div class="footer">
        <p>Universidad Mayor de San Andrés<br>
        Sistema de la Unidad de Transporte<br>
        ${moment().format('DD/MM/YYYY HH:mm')}</p>
        <p><small>Este es un mensaje automático, por favor no responda a este email.</small></p>
    </div>
</body>
</html>`;
    }

    /**
     * Notificar creación de reserva
     */
    static async notificarCreacionReserva(reserva) {
        const asunto = '📋 Nueva Solicitud de Reserva Creada';
        const mensaje = `
            <p>Se ha creado una nueva solicitud de reserva con los siguientes detalles:</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Vehículo:</strong> ${reserva.marca} ${reserva.modelo} (${reserva.placa})<br>
                <strong>Fecha:</strong> ${moment(reserva.fecha_reserva).format('DD/MM/YYYY')}<br>
                <strong>Horario:</strong> ${reserva.hora_inicio} - ${reserva.hora_fin}<br>
                <strong>Solicitante:</strong> ${reserva.solicitante_nombre}<br>
                <strong>Departamento:</strong> ${reserva.solicitante_departamento}<br>
                <strong>Motivo:</strong> ${reserva.motivo}
            </div>
            
            <p><strong>Estado:</strong> <span style="color: #e67e22;">PENDIENTE DE APROBACIÓN</span></p>
            
            <div class="alert">
                <strong>⚠️ Acción requerida:</strong> Esta reserva requiere aprobación. 
                Por favor revise el sistema para tomar una decisión.
            </div>
            
            <a href="${process.env.APP_URL}/reservas/${reserva.id}" class="btn">
                Ver Reserva en el Sistema
            </a>
        `;

        return await this.enviarEmail(reserva.solicitante_email, asunto, mensaje);
    }

    /**
     * Notificar aprobación de reserva
     */
    static async notificarAprobacionReserva(reserva) {
        const asunto = '✅ Reserva Aprobada';
        const mensaje = `
            <p>¡Buenas noticias! Su solicitud de reserva ha sido <strong>APROBADA</strong>.</p>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Vehículo:</strong> ${reserva.marca} ${reserva.modelo} (${reserva.placa})<br>
                <strong>Fecha:</strong> ${moment(reserva.fecha_reserva).format('DD/MM/YYYY')}<br>
                <strong>Horario:</strong> ${reserva.hora_inicio} - ${reserva.hora_fin}<br>
                <strong>Conductor:</strong> ${reserva.conductor_nombre || 'Por asignar'}<br>
                <strong>Origen:</strong> ${reserva.origen}<br>
                <strong>Destino:</strong> ${reserva.destino}
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>📋 Instrucciones importantes:</strong>
                <ul>
                    <li>Presentarse 15 minutos antes del horario programado</li>
                    <li>Portar identificación universitaria</li>
                    <li>Confirmar asistencia con el conductor</li>
                </ul>
            </div>
            
            <p style="color: #28a745;">
                <strong>¡Por favor esté puntual!</strong>
            </p>
            
            <a href="${process.env.APP_URL}/reservas/${reserva.id}" class="btn">
                Ver Detalles de la Reserva
            </a>
        `;

        return await this.enviarEmail(reserva.solicitante_email, asunto, mensaje);
    }

    /**
     * Notificar rechazo de reserva
     */
    static async notificarRechazoReserva(reserva, motivo) {
        const asunto = '❌ Reserva Rechazada';
        const mensaje = `
            <p>Lamentamos informarle que su solicitud de reserva ha sido <strong>RECHAZADA</strong>.</p>
            
            <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Vehículo:</strong> ${reserva.marca} ${reserva.modelo} (${reserva.placa})<br>
                <strong>Fecha:</strong> ${moment(reserva.fecha_reserva).format('DD/MM/YYYY')}<br>
                <strong>Horario:</strong> ${reserva.hora_inicio} - ${reserva.hora_fin}
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Motivo del rechazo:</strong><br>
                ${motivo || 'No se proporcionó un motivo específico.'}
            </div>
            
            <p>Puede crear una nueva solicitud con diferentes parámetros o contactar al administrador del sistema.</p>
            
            <a href="${process.env.APP_URL}/reservas/nueva" class="btn">
                Crear Nueva Solicitud
            </a>
        `;

        return await this.enviarEmail(reserva.solicitante_email, asunto, mensaje);
    }

    /**
     * Notificar stock bajo
     */
    static async notificarStockBajo(item, usuariosNotificar = []) {
        const asunto = '⚠️ Alerta: Stock Bajo de Inventario';
        const mensaje = `
            <p>Se ha generado una alerta por <strong>stock bajo</strong> en el siguiente ítem:</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Ítem:</strong> ${item.nombre}<br>
                <strong>Categoría:</strong> ${item.categoria_nombre}<br>
                <strong>Stock Actual:</strong> <span style="color: #e74c3c;">${item.stock_actual} ${item.unidad_medida}</span><br>
                <strong>Stock Mínimo:</strong> ${item.stock_minimo} ${item.unidad_medida}<br>
                <strong>Código QR:</strong> ${item.codigo_qr}<br>
                <strong>Ubicación:</strong> ${item.ubicacion || 'No especificada'}
            </div>
            
            <p>Se recomienda realizar el reabastecimiento lo antes posible.</p>
            
            <a href="${process.env.APP_URL}/inventario/${item.id}" class="btn">
                Ver Detalles del Ítem
            </a>
        `;

        // Enviar a todos los usuarios que deben recibir la notificación
        const resultados = [];
        for (const usuario of usuariosNotificar) {
            const resultado = await this.enviarEmail(usuario.email, asunto, mensaje);
            resultados.push({ usuario: usuario.email, resultado });
        }

        return resultados;
    }

    /**
     * Notificar vencimiento de documentación de conductor
     */
    static async notificarVencimientoDocumentacion(conductor, diasRestantes) {
        const asunto = '📄 Alerta: Documentación por Vencer';
        const mensaje = `
            <p>Se ha generado una alerta por <strong>vencimiento próximo</strong> de documentación:</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Conductor:</strong> ${conductor.nombres} ${conductor.apellidos}<br>
                <strong>Licencia:</strong> ${conductor.licencia_numero} (Categoría: ${conductor.licencia_categoria})<br>
                <strong>Vencimiento:</strong> ${moment(conductor.licencia_vencimiento).format('DD/MM/YYYY')}<br>
                <strong>Días restantes:</strong> <span style="color: ${diasRestantes <= 7 ? '#e74c3c' : '#f39c12'};">${diasRestantes} días</span>
            </div>
            
            <div class="alert">
                <strong>⚠️ Acción requerida:</strong> 
                ${diasRestantes <= 7 ? 
                  'La licencia vence PRÓXIMAMENTE. Renovación URGENTE requerida.' : 
                  'Planifique la renovación de la documentación.'}
            </div>
            
            <a href="${process.env.APP_URL}/conductores/${conductor.id}" class="btn">
                Ver Detalles del Conductor
            </a>
        `;

        return await this.enviarEmail(conductor.email, asunto, mensaje);
    }

    /**
     * Notificar finalización de reparación
     */
    static async notificarFinalizacionReparacion(reparacion) {
        const asunto = '🔧 Reparación Completada';
        const mensaje = `
            <p>Se ha <strong>COMPLETADO</strong> la reparación del vehículo:</p>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Vehículo:</strong> ${reparacion.marca} ${reparacion.modelo} (${reparacion.placa})<br>
                <strong>Reparación ID:</strong> #${reparacion.id}<br>
                <strong>Fecha recepción:</strong> ${moment(reparacion.fecha_recepcion).format('DD/MM/YYYY')}<br>
                <strong>Fecha entrega:</strong> ${moment(reparacion.fecha_real_entrega).format('DD/MM/YYYY')}<br>
                <strong>Técnico:</strong> ${reparacion.tecnico_nombre}<br>
                <strong>Costo total:</strong> ${Helpers.formatearMoneda(reparacion.costo_total)}
            </div>
            
            <p>El vehículo está ahora <strong>DISPONIBLE</strong> para su uso.</p>
            
            <a href="${process.env.APP_URL}/reparaciones/${reparacion.id}" class="btn">
                Ver Detalles de la Reparación
            </a>
        `;

        // Enviar a administradores y técnicos
        const administradores = await this.obtenerUsuariosPorRol([1, 2]); // Admin y Técnicos
        const resultados = [];

        for (const admin of administradores) {
            const resultado = await this.enviarEmail(admin.email, asunto, mensaje);
            resultados.push({ usuario: admin.email, resultado });
        }

        return resultados;
    }

    /**
     * Notificar recordatorio de reserva
     */
    static async notificarRecordatorioReserva(reserva) {
        const asunto = '🔔 Recordatorio: Reserva Programada para Mañana';
        const mensaje = `
            <p>Este es un recordatorio de su <strong>reserva programada para mañana</strong>:</p>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Vehículo:</strong> ${reserva.marca} ${reserva.modelo} (${reserva.placa})<br>
                <strong>Fecha:</strong> ${moment(reserva.fecha_reserva).format('DD/MM/YYYY')}<br>
                <strong>Horario:</strong> ${reserva.hora_inicio} - ${reserva.hora_fin}<br>
                <strong>Conductor:</strong> ${reserva.conductor_nombre || 'Por confirmar'}<br>
                <strong>Origen:</strong> ${reserva.origen}<br>
                <strong>Destino:</strong> ${reserva.destino}
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>📋 Recordatorios importantes:</strong>
                <ul>
                    <li>Presentarse 15 minutos antes en el punto de encuentro</li>
                    <li>Portar identificación universitaria</li>
                    <li>Confirmar su asistencia</li>
                </ul>
            </div>
            
            <a href="${process.env.APP_URL}/reservas/${reserva.id}" class="btn">
                Ver Detalles de la Reserva
            </a>
        `;

        return await this.enviarEmail(reserva.solicitante_email, asunto, mensaje);
    }

    /**
     * Obtener usuarios por rol (para notificaciones masivas)
     */
    static async obtenerUsuariosPorRol(roles) {
        // Esta función debería consultar la base de datos
        // Por ahora retornamos un array vacío como placeholder
        return [];
    }

    /**
     * Enviar notificación a múltiples destinatarios
     */
    static async enviarNotificacionMasiva(destinatarios, asunto, mensaje) {
        const resultados = [];

        for (const destinatario of destinatarios) {
            try {
                const resultado = await this.enviarEmail(destinatario.email, asunto, mensaje);
                resultados.push({
                    destinatario: destinatario.email,
                    success: resultado.success,
                    error: resultado.error
                });
            } catch (error) {
                resultados.push({
                    destinatario: destinatario.email,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            total: destinatarios.length,
            exitosos: resultados.filter(r => r.success).length,
            fallidos: resultados.filter(r => !r.success).length,
            resultados
        };
    }
}

// Exportar función principal de notificación
const enviarNotificacion = Notificaciones.enviarEmail;

module.exports = {
    Notificaciones,
    enviarNotificacion,
    Helpers: require('./helpers')
};