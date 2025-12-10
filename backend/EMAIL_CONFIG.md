# ==================================================
# CONFIGURACIÓN DE EMAIL - SISTEMA TRANSPORTE UMSA
# ==================================================

# INSTRUCCIONES PARA GMAIL:
# 1. Habilitar "Verificación en 2 pasos" en tu cuenta de Gmail
# 2. Ir a: https://myaccount.google.com/apppasswords
# 3. Generar una "Contraseña de aplicación" para "Correo"
# 4. Usar esa contraseña de 16 caracteres aquí

# Para Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion-16-caracteres

# Para otros proveedores:
# Outlook/Hotmail:
#   EMAIL_HOST=smtp-mail.outlook.com
#   EMAIL_PORT=587

# Yahoo:
#   EMAIL_HOST=smtp.mail.yahoo.com
#   EMAIL_PORT=587

# UMSA (si tienen servidor SMTP propio):
#   EMAIL_HOST=smtp.umsa.bo
#   EMAIL_PORT=587
#   EMAIL_USER=sistema.transporte@umsa.bo
#   EMAIL_PASSWORD=tu-contraseña

# ==================================================
# PASOS PARA CONFIGURAR:
# ==================================================

# 1. Copia este archivo y renómbralo (o edita directamente el .env)
# 2. Reemplaza EMAIL_USER con tu email real
# 3. Reemplaza EMAIL_PASSWORD con tu contraseña de aplicación
# 4. Reinicia el servidor backend

# ==================================================
# EJEMPLO CON GMAIL:
# ==================================================

# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=transporte.umsa@gmail.com
# EMAIL_PASSWORD=abcd efgh ijkl mnop  (sin espacios)

# ==================================================
# TESTING SIN EMAIL REAL:
# ==================================================

# Si no tienes un servidor SMTP, el sistema funcionará
# pero mostrará el token en la consola del backend
# para pruebas de desarrollo.
