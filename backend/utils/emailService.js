/**
 * SERVICIO DE EMAIL - SISTEMA DE TRANSPORTE UMSA
 * Envío de correos electrónicos usando Nodemailer
 */

const nodemailer = require('nodemailer');

class EmailService {
    
    constructor() {
        // Configurar transportador de email
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false, // true para 465, false para otros puertos
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Verificar conexión con servidor de email
     */
    async verificarConexion() {
        try {
            await this.transporter.verify();
            console.log('✓ Servidor de email listo para enviar mensajes');
            return true;
        } catch (error) {
            console.error('✗ Error al conectar con servidor de email:', error.message);
            return false;
        }
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    async enviarEmailRecuperacion(email, nombre, token) {
        try {
            const urlRecuperacion = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;
            
            const mailOptions = {
                from: `"Sistema de Transporte UMSA" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Recuperación de Contraseña - Sistema de Transporte UMSA',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚌 Sistema de Transporte UMSA</h1>
                            </div>
                            <div class="content">
                                <h2>Recuperación de Contraseña</h2>
                                <p>Hola <strong>${nombre}</strong>,</p>
                                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Transporte UMSA.</p>
                                <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
                                <div style="text-align: center;">
                                    <a href="${urlRecuperacion}" class="button">Restablecer Contraseña</a>
                                </div>
                                <p>O copia y pega el siguiente enlace en tu navegador:</p>
                                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
                                    ${urlRecuperacion}
                                </p>
                                <div class="warning">
                                    <strong>⚠️ Importante:</strong>
                                    <ul>
                                        <li>Este enlace es válido solo por <strong>1 hora</strong></li>
                                        <li>Si no solicitaste este cambio, ignora este correo</li>
                                        <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="footer">
                                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                                <p>&copy; 2025 Universidad Mayor de San Andrés - Sistema de Transporte</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✓ Email de recuperación enviado:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('✗ Error al enviar email de recuperación:', error.message);
            throw error;
        }
    }

    /**
     * Enviar email de confirmación de cambio de contraseña
     */
    async enviarEmailConfirmacionCambio(email, nombre) {
        try {
            const mailOptions = {
                from: `"Sistema de Transporte UMSA" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Contraseña Actualizada - Sistema de Transporte UMSA',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                            .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 15px 0; }
                            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚌 Sistema de Transporte UMSA</h1>
                            </div>
                            <div class="content">
                                <h2>Contraseña Actualizada</h2>
                                <p>Hola <strong>${nombre}</strong>,</p>
                                <div class="success">
                                    <p>✓ Tu contraseña ha sido actualizada exitosamente.</p>
                                </div>
                                <p>Ahora puedes iniciar sesión con tu nueva contraseña en:</p>
                                <p><a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
                                <p>Si no realizaste este cambio, contacta inmediatamente con el administrador del sistema.</p>
                            </div>
                            <div class="footer">
                                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                                <p>&copy; 2025 Universidad Mayor de San Andrés - Sistema de Transporte</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✓ Email de confirmación enviado:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('✗ Error al enviar email de confirmación:', error.message);
            throw error;
        }
    }

    /**
     * Enviar email de bienvenida
     */
    async enviarEmailBienvenida(email, nombre) {
        try {
            const mailOptions = {
                from: `"Sistema de Transporte UMSA" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Bienvenido al Sistema de Transporte UMSA',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚌 Sistema de Transporte UMSA</h1>
                                <h2>¡Bienvenido!</h2>
                            </div>
                            <div class="content">
                                <p>Hola <strong>${nombre}</strong>,</p>
                                <p>Tu cuenta ha sido creada exitosamente en el Sistema de Transporte de la Universidad Mayor de San Andrés.</p>
                                <p>Ya puedes acceder al sistema para realizar solicitudes de transporte:</p>
                                <div style="text-align: center;">
                                    <a href="${process.env.FRONTEND_URL}" class="button">Acceder al Sistema</a>
                                </div>
                                <p>Si tienes alguna duda o necesitas ayuda, no dudes en contactar con el administrador del sistema.</p>
                            </div>
                            <div class="footer">
                                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                                <p>&copy; 2025 Universidad Mayor de San Andrés - Sistema de Transporte</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✓ Email de bienvenida enviado:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('✗ Error al enviar email de bienvenida:', error.message);
            // No lanzar error para no bloquear el registro
            return { success: false, error: error.message };
        }
    }
}

// Exportar instancia singleton
module.exports = new EmailService();
