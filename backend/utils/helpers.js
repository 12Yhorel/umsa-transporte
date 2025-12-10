/**
 * Utilidades generales para el sistema UMSA Transporte
 */

const bcrypt = require('bcryptjs');
const moment = require('moment');

class Helpers {
    
    /**
     * Generar contraseña hash
     */
    static async hashPassword(password) {
        try {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            throw new Error('Error al generar hash de contraseña');
        }
    }

    /**
     * Validar formato de email
     */
    static validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar formato de placa boliviana
     */
    static validarPlaca(placa) {
        const placaRegex = /^[A-Z]{2,3}-\d{4}$/;
        return placaRegex.test(placa);
    }

    /**
     * Validar formato de teléfono boliviano
     */
    static validarTelefono(telefono) {
        const telefonoRegex = /^[67]\d{7}$/;
        return telefonoRegex.test(telefono);
    }

    /**
     * Formatear fecha para la base de datos
     */
    static formatearFechaDB(fecha) {
        return moment(fecha).format('YYYY-MM-DD');
    }

    /**
     * Formatear fecha para mostrar al usuario
     */
    static formatearFechaUsuario(fecha) {
        return moment(fecha).format('DD/MM/YYYY');
    }

    /**
     * Formatear fecha y hora para mostrar al usuario
     */
    static formatearFechaHoraUsuario(fecha) {
        return moment(fecha).format('DD/MM/YYYY HH:mm');
    }

    /**
     * Calcular diferencia en días entre dos fechas
     */
    static diferenciaDias(fecha1, fecha2) {
        const date1 = moment(fecha1);
        const date2 = moment(fecha2);
        return date2.diff(date1, 'days');
    }

    /**
     * Validar si una fecha es futura
     */
    static esFechaFutura(fecha) {
        return moment(fecha).isAfter(moment());
    }

    /**
     * Validar si una fecha está en el rango permitido para reservas
     */
    static esFechaReservaValida(fecha) {
        const fechaReserva = moment(fecha);
        const hoy = moment();
        const maxDiasAnticipacion = parseInt(process.env.MAX_DIAS_ANTICIPACION_RESERVA) || 30;
        
        return fechaReserva.isAfter(hoy) && 
               fechaReserva.diff(hoy, 'days') <= maxDiasAnticipacion;
    }

    /**
     * Generar código único
     */
    static generarCodigoUnico(prefijo = 'UMSA', longitud = 8) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, longitud);
        return `${prefijo}-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Sanitizar entrada de texto
     */
    static sanitizarTexto(texto) {
        if (typeof texto !== 'string') return texto;
        
        return texto
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim();
    }

    /**
     * Validar y formatear número
     */
    static formatearNumero(numero, decimales = 2) {
        const num = parseFloat(numero);
        if (isNaN(num)) return 0;
        
        return Number(num.toFixed(decimales));
    }

    /**
     * Calcular edad a partir de fecha de nacimiento
     */
    static calcularEdad(fechaNacimiento) {
        return moment().diff(moment(fechaNacimiento), 'years');
    }

    /**
     * Obtener rango de fechas para reportes
     */
    static obtenerRangoFechas(periodo = 'mes') {
        const hoy = moment();
        let fechaInicio, fechaFin;

        switch (periodo) {
            case 'hoy':
                fechaInicio = hoy.startOf('day');
                fechaFin = hoy.endOf('day');
                break;
            case 'semana':
                fechaInicio = hoy.startOf('week');
                fechaFin = hoy.endOf('week');
                break;
            case 'mes':
                fechaInicio = hoy.startOf('month');
                fechaFin = hoy.endOf('month');
                break;
            case 'trimestre':
                fechaInicio = hoy.startOf('quarter');
                fechaFin = hoy.endOf('quarter');
                break;
            case 'año':
                fechaInicio = hoy.startOf('year');
                fechaFin = hoy.endOf('year');
                break;
            default:
                fechaInicio = hoy.startOf('month');
                fechaFin = hoy.endOf('month');
        }

        return {
            fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
            fecha_fin: fechaFin.format('YYYY-MM-DD')
        };
    }

    /**
     * Validar horario (formato HH:mm)
     */
    static validarHorario(horario) {
        const horarioRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return horarioRegex.test(horario);
    }

    /**
     * Comparar dos horarios
     */
    static compararHorarios(horario1, horario2) {
        const [h1, m1] = horario1.split(':').map(Number);
        const [h2, m2] = horario2.split(':').map(Number);
        
        const total1 = h1 * 60 + m1;
        const total2 = h2 * 60 + m2;
        
        return total1 - total2;
    }

    /**
     * Calcular duración entre dos horarios en minutos
     */
    static calcularDuracionMinutos(horarioInicio, horarioFin) {
        const [h1, m1] = horarioInicio.split(':').map(Number);
        const [h2, m2] = horarioFin.split(':').map(Number);
        
        const inicio = h1 * 60 + m1;
        const fin = h2 * 60 + m2;
        
        return fin - inicio;
    }

    /**
     * Generar nombre de archivo único
     */
    static generarNombreArchivo(extension, prefijo = 'umsa') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefijo}_${timestamp}_${random}.${extension}`;
    }

    /**
     * Validar archivo por tipo y tamaño
     */
    static validarArchivo(archivo, tiposPermitidos = [], tamañoMaximoMB = 5) {
        const errores = [];

        // Validar tipo
        if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(archivo.mimetype)) {
            errores.push(`Tipo de archivo no permitido. Tipos permitidos: ${tiposPermitidos.join(', ')}`);
        }

        // Validar tamaño (convertir MB a bytes)
        const tamañoMaximoBytes = tamañoMaximoMB * 1024 * 1024;
        if (archivo.size > tamañoMaximoBytes) {
            errores.push(`El archivo excede el tamaño máximo de ${tamañoMaximoMB}MB`);
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Formatear bytes a formato legible
     */
    static formatearBytes(bytes, decimales = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimales < 0 ? 0 : decimales;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Generar código de verificación
     */
    static generarCodigoVerificacion(longitud = 6) {
        const digitos = '0123456789';
        let codigo = '';
        
        for (let i = 0; i < longitud; i++) {
            codigo += digitos.charAt(Math.floor(Math.random() * digitos.length));
        }
        
        return codigo;
    }

    /**
     * Calcular porcentaje
     */
    static calcularPorcentaje(parcial, total) {
        if (total === 0) return 0;
        return ((parcial / total) * 100);
    }

    /**
     * Formatear moneda boliviana
     */
    static formatearMoneda(monto) {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(monto);
    }

    /**
     * Validar número de licencia boliviana
     */
    static validarLicenciaBoliviana(licencia) {
        const licenciaRegex = /^[A-Z]{2}-\d{6}$/;
        return licenciaRegex.test(licencia);
    }

    /**
     * Obtener categoría de licencia válida
     */
    static obtenerCategoriasLicencia() {
        return ['A', 'B', 'C', 'D', 'E', 'F'];
    }

    /**
     * Validar categoría de licencia
     */
    static validarCategoriaLicencia(categoria) {
        const categorias = this.obtenerCategoriasLicencia();
        return categorias.includes(categoria.toUpperCase());
    }

    /**
     * Calcular días hábiles entre dos fechas
     */
    static calcularDiasHabiles(fechaInicio, fechaFin) {
        let diasHabiles = 0;
        const fechaActual = moment(fechaInicio);
        const fechaFinal = moment(fechaFin);

        while (fechaActual.isSameOrBefore(fechaFinal)) {
            // No contar sábados (6) ni domingos (0)
            if (fechaActual.day() !== 0 && fechaActual.day() !== 6) {
                diasHabiles++;
            }
            fechaActual.add(1, 'days');
        }

        return diasHabiles;
    }

    /**
     * Generar slug para URLs amigables
     */
    static generarSlug(texto) {
        return texto
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    /**
     * Validar CI boliviano
     */
    static validarCI(ci) {
        // Eliminar cualquier caracter que no sea número
        const ciLimpio = ci.toString().replace(/\D/g, '');
        
        // Validar longitud
        if (ciLimpio.length < 5 || ciLimpio.length > 10) {
            return false;
        }

        // Validar que solo contenga números
        return /^\d+$/.test(ciLimpio);
    }

    /**
     * Obtener mes en español
     */
    static obtenerMesEspanol(mes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[mes - 1] || '';
    }

    /**
     * Obtener día de la semana en español
     */
    static obtenerDiaSemanaEspanol(dia) {
        const dias = [
            'Domingo', 'Lunes', 'Martes', 'Miércoles', 
            'Jueves', 'Viernes', 'Sábado'
        ];
        return dias[dia] || '';
    }
}

module.exports = Helpers;