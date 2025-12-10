/**
 * Helpers adicionales para validación - UMSA Transporte
 */

const { body } = require('express-validator');

// Validaciones reutilizables
const validacionesComunes = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido'),
    
    password: body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    nombres: body('nombres')
        .trim()
        .notEmpty()
        .withMessage('Los nombres son requeridos')
        .isLength({ min: 2, max: 100 })
        .withMessage('Los nombres deben tener entre 2 y 100 caracteres'),
    
    telefono: body('telefono')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]{7,15}$/)
        .withMessage('El teléfono debe ser un número válido'),
    
    fecha: (campo) => body(campo)
        .isDate()
        .withMessage(`El campo ${campo} debe ser una fecha válida`),
    
    numeroPositivo: (campo) => body(campo)
        .isFloat({ min: 0 })
        .withMessage(`El campo ${campo} debe ser un número positivo`),
    
    enteroPositivo: (campo) => body(campo)
        .isInt({ min: 1 })
        .withMessage(`El campo ${campo} debe ser un número entero positivo`)
};

// Sanitizadores
const sanitizadores = {
    trim: (valor) => typeof valor === 'string' ? valor.trim() : valor,
    
    toUpperCase: (valor) => typeof valor === 'string' ? valor.toUpperCase() : valor,
    
    toLowerCase: (valor) => typeof valor === 'string' ? valor.toLowerCase() : valor,
    
    escapeHTML: (valor) => {
        if (typeof valor !== 'string') return valor;
        return valor
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
};

// Validaciones específicas para UMSA
const validacionesUMSA = {
    placaUMSA: body('placa')
        .matches(/^UMSA-[A-Z0-9]{3,4}$/)
        .withMessage('La placa debe tener formato UMSA-XXX o UMSA-XXXX'),
    
    codigoDepartamento: body('departamento')
        .isIn(['LA PAZ', 'COCHABAMBA', 'SANTA CRUZ', 'ORURO', 'POTOSI', 'TARIJA', 'CHUQUISACA', 'BENI', 'PANDO'])
        .withMessage('El departamento debe ser uno de los departamentos de Bolivia'),
    
    horarioLaboral: (campoHora) => body(campoHora)
        .matches(/^(0[6-9]|1[0-9]|2[0-1]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('La hora debe estar entre 06:00:00 y 21:00:00')
};

module.exports = {
    validacionesComunes,
    sanitizadores,
    validacionesUMSA
};