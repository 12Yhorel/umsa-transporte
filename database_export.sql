-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: gestion_transporte_umsa
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `asignaciones`
--

DROP TABLE IF EXISTS `asignaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conductor_id` int NOT NULL,
  `vehiculo_id` int NOT NULL,
  `fecha_asignacion` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  `asignado_por` int NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conductor_id` (`conductor_id`),
  KEY `vehiculo_id` (`vehiculo_id`),
  KEY `asignado_por` (`asignado_por`),
  CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`conductor_id`) REFERENCES `conductores` (`id`),
  CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`),
  CONSTRAINT `asignaciones_ibfk_3` FOREIGN KEY (`asignado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones`
--

LOCK TABLES `asignaciones` WRITE;
/*!40000 ALTER TABLE `asignaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `asignaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria_sistema`
--

DROP TABLE IF EXISTS `auditoria_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria_sistema` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` int DEFAULT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_sistema_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_sistema`
--

LOCK TABLES `auditoria_sistema` WRITE;
/*!40000 ALTER TABLE `auditoria_sistema` DISABLE KEYS */;
INSERT INTO `auditoria_sistema` VALUES (1,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-17T01:32:57.336Z\"}',NULL,'2025-11-17 01:32:57'),(2,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-17T02:42:55.649Z\"}',NULL,'2025-11-17 02:42:55'),(3,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-17 02:53:54'),(4,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-17 02:53:59'),(5,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-17 02:54:23'),(6,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-17 02:55:18'),(7,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-18T19:42:04.887Z\"}',NULL,'2025-11-18 19:42:04'),(8,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-18 19:42:18'),(9,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-18 19:44:18'),(10,1,'GET /api/usuarios?page=1&limit=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-18 19:44:20'),(11,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:27:26.313Z\"}',NULL,'2025-11-25 23:27:26'),(12,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:27:41'),(13,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:38:38.741Z\"}',NULL,'2025-11-25 23:38:38'),(14,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:38:43'),(15,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:46:13.003Z\"}',NULL,'2025-11-25 23:46:13'),(16,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:46:13'),(17,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:46:13'),(18,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:47:53.894Z\"}',NULL,'2025-11-25 23:47:53'),(19,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:47:53'),(20,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:47:54'),(21,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:48:02.410Z\"}',NULL,'2025-11-25 23:48:02'),(22,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:48:13.458Z\"}',NULL,'2025-11-25 23:48:13'),(23,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:48:13'),(24,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:48:13'),(25,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-25T23:53:57.797Z\"}',NULL,'2025-11-25 23:53:57'),(26,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-25 23:54:00'),(27,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-26T00:02:12.945Z\"}',NULL,'2025-11-26 00:02:12'),(28,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:02:13'),(29,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:02:26'),(30,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:02:26'),(31,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:02:28'),(32,1,'GET /api/usuarios?pagina=1&limite=50','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:02:28'),(33,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:07:14'),(34,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:07:14'),(35,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-26T00:07:17.954Z\"}',NULL,'2025-11-26 00:07:17'),(36,1,'POST /api/usuarios','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:07:18'),(38,1,'GET /api/usuarios?pagina=1&limite=5','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:07:18'),(39,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:12:47'),(40,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:12:47'),(41,1,'PUT /api/usuarios/1/desactivar','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:12:51'),(42,1,'DELETE /api/usuarios/3','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:13:45'),(44,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:13:53'),(45,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:13:53'),(46,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:14:13'),(47,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:14:13'),(48,1,'PUT /api/usuarios/1/desactivar','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:14:16'),(49,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:14:24'),(50,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:14:24'),(51,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:15:17'),(52,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:15:17'),(53,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:15:35'),(54,1,'POST /api/usuarios','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:15:42'),(55,8,'CREACION_USUARIO','usuarios',8,NULL,'{\"email\": \"yhorelyharedalvareza@gmail.com\", \"rol_id\": \"2\", \"nombres\": \"Nancy\", \"apellidos\": \"Alvarez\"}',NULL,'2025-11-26 00:15:42'),(56,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:16:30'),(57,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:16:30'),(58,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:16:40'),(59,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:16:44'),(60,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:16:45'),(61,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:13'),(62,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:13'),(63,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:14'),(64,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:14'),(65,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:22'),(66,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:48'),(67,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:19:48'),(68,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:20:06'),(69,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:20:06'),(70,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:20:09'),(71,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:20:48'),(72,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:20:48'),(73,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:06'),(74,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:11'),(75,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:15'),(76,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:28'),(77,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:33'),(78,1,'GET /api/usuarios/roles','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:34'),(79,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:37'),(80,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:21:37'),(81,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:22:14'),(82,1,'GET /api/usuarios?pagina=1&limite=10','acceso_sistema',NULL,NULL,NULL,'127.0.0.1','2025-11-26 00:22:17'),(83,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-26T00:41:35.744Z\"}',NULL,'2025-11-26 00:41:35'),(84,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-26T00:41:51.110Z\"}',NULL,'2025-11-26 00:41:51'),(85,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-26T00:42:00.422Z\"}',NULL,'2025-11-26 00:42:00'),(86,NULL,'CREACION_ITEM_INVENTARIO','items_inventario',5,NULL,'{\"nombre\": \"dfvgbhn\", \"categoria_id\": 3, \"stock_actual\": 3}',NULL,'2025-11-26 01:26:28'),(87,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-28T05:02:42.406Z\"}',NULL,'2025-11-28 05:02:42'),(89,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-28T13:06:49.601Z\"}',NULL,'2025-11-28 13:06:49'),(90,2,'LOGIN_EXITOSO','usuarios',2,NULL,'{\"ultimo_login\": \"2025-11-28T13:10:10.595Z\"}',NULL,'2025-11-28 13:10:10'),(91,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-11-28T13:28:50.846Z\"}',NULL,'2025-11-28 13:28:50'),(92,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T14:37:41.853Z\"}',NULL,'2025-12-03 14:37:41'),(93,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T15:12:41.118Z\"}',NULL,'2025-12-03 15:12:41'),(94,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T15:14:22.145Z\"}',NULL,'2025-12-03 15:14:22'),(95,NULL,'ACTUALIZACION_VEHICULO','vehiculos',3,'{\"id\": 3, \"anio\": 2020, \"color\": \"Gris\", \"marca\": \"Nissan\", \"placa\": \"UMSA-003\", \"estado\": \"EN_REPARACION\", \"modelo\": \"Urvan\", \"capacidad\": 12, \"creado_en\": \"2025-11-15T23:11:18.000Z\", \"tipo_combustible\": \"GASOLINA\", \"kilometraje_actual\": \"0.00\"}','{\"año\": 2020, \"color\": \"Gris\", \"marca\": \"Nissan\", \"placa\": \"UMSA-003\", \"estado\": \"EN_USO\", \"modelo\": \"Urvan\", \"capacidad\": 12, \"tipo_combustible\": \"GASOLINA\", \"kilometraje_actual\": \"0.00\"}',NULL,'2025-12-03 15:30:40'),(98,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T16:01:24.936Z\"}',NULL,'2025-12-03 16:01:24'),(101,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T17:16:55.000Z\"}',NULL,'2025-12-03 17:16:55'),(102,1,'CREACION_RESERVA','reservas',1,NULL,'{\"estado\": \"PENDIENTE\", \"vehiculo_id\": 1, \"fecha_reserva\": \"2025-12-12\", \"solicitante_id\": 1}',NULL,'2025-12-03 17:25:28'),(105,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T17:28:03.233Z\"}',NULL,'2025-12-03 17:28:03'),(106,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T18:11:39.475Z\"}',NULL,'2025-12-03 18:11:39'),(107,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T18:13:55.289Z\"}',NULL,'2025-12-03 18:13:55'),(108,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T18:14:07.429Z\"}',NULL,'2025-12-03 18:14:07'),(109,1,'CREACION_RESERVA','reservas',3,NULL,'{\"estado\": \"PENDIENTE\", \"vehiculo_id\": 1, \"fecha_reserva\": \"2025-12-20\", \"solicitante_id\": 1}',NULL,'2025-12-03 18:14:07'),(110,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T18:16:04.976Z\"}',NULL,'2025-12-03 18:16:04'),(111,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T18:16:22.985Z\"}',NULL,'2025-12-03 18:16:22'),(112,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-03T18:17:25.166Z\"}',NULL,'2025-12-03 18:17:25'),(113,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-04T13:37:00.652Z\"}',NULL,'2025-12-04 13:37:00'),(114,1,'CREACION_REPARACION','reparaciones',1,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 1, \"vehiculo_id\": 2}',NULL,'2025-12-04 13:48:26'),(115,1,'CREACION_REPARACION','reparaciones',2,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 4, \"vehiculo_id\": 1}',NULL,'2025-12-04 13:57:08'),(116,1,'CREACION_REPARACION','reparaciones',3,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 4, \"vehiculo_id\": 1}',NULL,'2025-12-04 14:00:43'),(117,1,'CREACION_REPARACION','reparaciones',4,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 2, \"vehiculo_id\": 3}',NULL,'2025-12-04 14:01:58'),(118,1,'CREACION_REPARACION','reparaciones',5,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 1, \"vehiculo_id\": 2}',NULL,'2025-12-04 14:04:10'),(119,1,'CREACION_REPARACION','reparaciones',6,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 1, \"vehiculo_id\": 3}',NULL,'2025-12-04 14:12:06'),(120,1,'CREACION_REPARACION','reparaciones',7,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 1, \"vehiculo_id\": 2}',NULL,'2025-12-04 14:14:07'),(121,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-04T21:42:16.653Z\"}',NULL,'2025-12-04 21:42:16'),(122,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-04T21:43:09.497Z\"}',NULL,'2025-12-04 21:43:09'),(123,1,'CREACION_REPARACION','reparaciones',8,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 1, \"vehiculo_id\": 4}',NULL,'2025-12-04 21:49:38'),(126,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',2,'{\"id\": 2, \"activo\": 1, \"nombre\": \"Filtro de Aire\", \"codigo_qr\": null, \"creado_en\": \"2025-11-16T00:14:51.000Z\", \"ubicacion\": \"Estante B2\", \"descripcion\": \"Filtro de aire para motor grande\", \"categoria_id\": 2, \"estado_stock\": \"OPTIMO\", \"stock_actual\": 12, \"stock_maximo\": 100, \"stock_minimo\": 3, \"stock_optimo\": true, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"REPUESTO\", \"precio_unitario\": \"45.00\", \"categoria_nombre\": \"Filtros\", \"necesita_reposicion\": false}','{\"nombre\": \"Filtro de Aire\", \"ubicacion\": \"Estante B2\", \"descripcion\": \"Filtro de aire para motor grande\", \"categoria_id\": 2, \"stock_maximo\": 100, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"45.00\"}',NULL,'2025-12-04 22:03:29'),(138,9,'DESACTIVACION_USUARIO','usuarios',9,'{\"id\": 9, \"email\": \"yhorel@umsa.edu.bo\", \"activo\": 1, \"rol_id\": 4, \"nombres\": \"Yhared\", \"telefono\": null, \"apellidos\": \"Alvarez\", \"creado_en\": \"2025-12-03T15:36:55.000Z\", \"rol_nombre\": \"SOLICITANTE\", \"departamento\": null, \"nivel_acceso\": 1, \"rol_descripcion\": \"Solicitud de reservas\"}','{\"activo\": false}',NULL,'2025-12-05 01:17:28'),(139,9,'ACTUALIZACION_USUARIO','usuarios',9,'{\"id\": 9, \"email\": \"yhorel@umsa.edu.bo\", \"activo\": 0, \"rol_id\": 4, \"nombres\": \"Yhared\", \"telefono\": null, \"apellidos\": \"Alvarez\", \"creado_en\": \"2025-12-03T15:36:55.000Z\", \"rol_nombre\": \"SOLICITANTE\", \"departamento\": null, \"nivel_acceso\": 1, \"rol_descripcion\": \"Solicitud de reservas\"}','{\"activo\": true}',NULL,'2025-12-05 01:30:52'),(141,NULL,'CREACION_VEHICULO','vehiculos',10,NULL,'{\"marca\": \"toyota\", \"placa\": \"abb-910\", \"modelo\": \"land crusser\", \"capacidad\": 7}',NULL,'2025-12-05 01:49:17'),(142,NULL,'ACTUALIZACION_VEHICULO','vehiculos',3,'{\"id\": 3, \"anio\": 2020, \"color\": \"Gris\", \"marca\": \"Nissan\", \"placa\": \"UMSA-003\", \"estado\": \"EN_REPARACION\", \"modelo\": \"Urvan\", \"capacidad\": 12, \"creado_en\": \"2025-11-15T23:11:18.000Z\", \"tipo_combustible\": \"GASOLINA\", \"kilometraje_actual\": \"0.00\"}','{\"año\": 2020, \"color\": \"Gris\", \"marca\": \"Nissan\", \"placa\": \"UMSA-003\", \"estado\": \"DISPONIBLE\", \"modelo\": \"Urvan\", \"capacidad\": 12, \"tipo_combustible\": \"GASOLINA\", \"kilometraje_actual\": \"0.00\"}',NULL,'2025-12-05 01:49:46'),(146,11,'CREACION_USUARIO','usuarios',11,NULL,'{\"email\": \"conductor2@umsa.edu.bo\", \"rol_id\": \"3\", \"nombres\": \"Jose Luis \", \"apellidos\": \"Perales \"}',NULL,'2025-12-05 02:17:12'),(149,NULL,'ACTUALIZACION_CONDUCTOR','conductores',1,'{\"id\": 1, \"email\": \"conductor1@umsa.edu.bo\", \"nombres\": \"Roberto\", \"telefono\": \"67083920\", \"apellidos\": \"Gutierrez\", \"creado_en\": \"2025-12-03T16:02:00.000Z\", \"habilitado\": 1, \"usuario_id\": 5, \"departamento\": \"Transporte\", \"licencia_numero\": \"123456\", \"telefono_usuario\": null, \"licencia_categoria\": \"B\", \"licencia_vencimiento\": \"2026-03-06T04:00:00.000Z\", \"licencia_proxima_vencer\": false, \"dias_vencimiento_licencia\": 92}','{\"telefono\": \"67083920\", \"habilitado\": 1, \"licencia_numero\": \"123456\", \"licencia_categoria\": \"B\", \"licencia_vencimiento\": \"2026-01-28\"}',NULL,'2025-12-05 02:18:05'),(150,NULL,'CREACION_CONDUCTOR','conductores',3,NULL,'{\"usuario_id\": \"11\", \"licencia_numero\": \"12345632\", \"licencia_categoria\": \"B\"}',NULL,'2025-12-05 02:18:33'),(151,1,'CREACION_RESERVA','reservas',4,NULL,'{\"estado\": \"PENDIENTE\", \"vehiculo_id\": \"5\", \"fecha_reserva\": \"2025-12-09\", \"solicitante_id\": 1}',NULL,'2025-12-05 02:56:25'),(152,1,'ACTUALIZACION_RESERVA','reservas',4,'{\"id\": 4, \"color\": \"Verde\", \"marca\": \"Test\", \"placa\": \"TEST-999\", \"estado\": \"PENDIENTE\", \"modelo\": \"Model\", \"motivo\": \"TRaslado de autoridades de la universidad \", \"origen\": \"MOnoblock CEntral\", \"destino\": \"Cota cota \", \"hora_fin\": \"17:00:00\", \"capacidad\": 10, \"fecha_fin\": \"2025-12-09T17:00\", \"hora_inicio\": \"08:00:00\", \"vehiculo_id\": 5, \"aprobado_por\": null, \"conductor_id\": 3, \"esta_proxima\": false, \"fecha_inicio\": \"2025-12-09T08:00\", \"fecha_reserva\": \"2025-12-09T04:00:00.000Z\", \"observaciones\": \"observaiones\", \"dias_restantes\": 5, \"duracion_horas\": 9, \"puede_cancelar\": true, \"solicitante_id\": 1, \"conductor_email\": \"conductor2@umsa.edu.bo\", \"fecha_solicitud\": \"2025-12-05T02:56:25.000Z\", \"puede_modificar\": true, \"aprobador_nombre\": null, \"conductor_nombre\": \"11 - Jose Luis  Perales \", \"fecha_aprobacion\": null, \"solicitante_email\": \"admin@umsa.edu.bo\", \"solicitante_nombre\": \"Admin Sistema\", \"requiere_aprobacion\": true, \"historial_aprobacion\": [{\"fecha\": \"2025-12-05T02:56:25.000Z\", \"accion\": \"CREACION_RESERVA\", \"datos_nuevos\": {\"estado\": \"PENDIENTE\", \"vehiculo_id\": \"5\", \"fecha_reserva\": \"2025-12-09\", \"solicitante_id\": 1}, \"usuario_nombre\": \"Admin Sistema\", \"datos_anteriores\": null}], \"solicitante_departamento\": \"TI\"}','{\"marca\": \"Test\", \"placa\": \"TEST-999\", \"estado\": \"PENDIENTE\", \"modelo\": \"Model\", \"motivo\": \"TRaslado de autoridades de la universidad \", \"origen\": \"MOnoblock CEntral\", \"destino\": \"Cota cota \", \"hora_fin\": \"17:00:00\", \"fecha_fin\": \"2025-12-09T17:00\", \"hora_inicio\": \"08:00:00\", \"vehiculo_id\": \"6\", \"conductor_id\": 3, \"esta_proxima\": false, \"fecha_inicio\": \"2025-12-09T08:00\", \"fecha_reserva\": \"2025-12-18\", \"observaciones\": \"observaiones\", \"dias_restantes\": 5, \"puede_cancelar\": true, \"solicitante_id\": 1, \"puede_modificar\": true, \"conductor_nombre\": \"Jose Luis  Perales \", \"solicitante_nombre\": \"Admin Sistema\", \"solicitante_departamento\": \"TI\"}',NULL,'2025-12-05 03:02:13'),(155,1,'CREACION_RESERVA','reservas',6,NULL,'{\"estado\": \"PENDIENTE\", \"vehiculo_id\": \"6\", \"fecha_reserva\": \"2025-12-25\", \"solicitante_id\": 1}',NULL,'2025-12-05 03:12:31'),(156,1,'ACTUALIZACION_RESERVA','reservas',3,'{\"id\": 3, \"color\": \"Blanco\", \"marca\": \"Toyota\", \"placa\": \"UMSA-001\", \"estado\": \"PENDIENTE\", \"modelo\": \"Hiace\", \"motivo\": \"Prueba automática\", \"origen\": \"\", \"destino\": \"Oficina\", \"hora_fin\": \"12:00:00\", \"capacidad\": 15, \"fecha_fin\": \"2025-12-20T12:00\", \"hora_inicio\": \"09:00:00\", \"vehiculo_id\": 1, \"aprobado_por\": null, \"conductor_id\": 1, \"esta_proxima\": false, \"fecha_inicio\": \"2025-12-20T09:00\", \"fecha_reserva\": \"2025-12-20T04:00:00.000Z\", \"nombre_unidad\": \"Sin especificar\", \"observaciones\": \"Creada por test\", \"dias_restantes\": 16, \"duracion_horas\": 3, \"puede_cancelar\": true, \"solicitante_id\": 1, \"conductor_email\": \"conductor1@umsa.edu.bo\", \"fecha_solicitud\": \"2025-12-03T18:14:07.000Z\", \"puede_modificar\": true, \"aprobador_nombre\": null, \"conductor_nombre\": \"5 - Roberto Gutierrez\", \"fecha_aprobacion\": null, \"solicitante_email\": \"admin@umsa.edu.bo\", \"solicitante_nombre\": \"Admin Sistema\", \"requiere_aprobacion\": true, \"historial_aprobacion\": [{\"fecha\": \"2025-12-03T18:14:07.000Z\", \"accion\": \"CREACION_RESERVA\", \"datos_nuevos\": {\"estado\": \"PENDIENTE\", \"vehiculo_id\": 1, \"fecha_reserva\": \"2025-12-20\", \"solicitante_id\": 1}, \"usuario_nombre\": \"Admin Sistema\", \"datos_anteriores\": null}], \"solicitante_departamento\": \"TI\"}','{\"marca\": \"Toyota\", \"placa\": \"UMSA-001\", \"estado\": \"PENDIENTE\", \"modelo\": \"Hiace\", \"motivo\": \"Prueba automática\", \"origen\": \"MOnoblock CEntral\", \"destino\": \"Oficina\", \"hora_fin\": \"12:00:00\", \"fecha_fin\": \"2025-12-20T12:00\", \"hora_inicio\": \"09:00:00\", \"vehiculo_id\": \"3\", \"conductor_id\": 1, \"esta_proxima\": false, \"fecha_inicio\": \"2025-12-20T09:00\", \"fecha_reserva\": \"2025-12-06\", \"nombre_unidad\": \"Sin especificar\", \"observaciones\": \"Creada por test\", \"dias_restantes\": 16, \"puede_cancelar\": true, \"solicitante_id\": 1, \"puede_modificar\": true, \"conductor_nombre\": \"Roberto Gutierrez\", \"conductor_nombres\": \"Roberto\", \"solicitante_nombre\": \"Admin Sistema\", \"conductor_apellidos\": \"Gutierrez\", \"solicitante_departamento\": \"TI\"}',NULL,'2025-12-05 03:18:56'),(157,1,'ACTUALIZACION_RESERVA','reservas',3,'{\"id\": 3, \"color\": \"Gris\", \"marca\": \"Nissan\", \"placa\": \"UMSA-003\", \"estado\": \"PENDIENTE\", \"modelo\": \"Urvan\", \"motivo\": \"Prueba automática\", \"origen\": \"MOnoblock CEntral\", \"destino\": \"Oficina\", \"hora_fin\": \"12:00:00\", \"capacidad\": 12, \"fecha_fin\": \"2025-12-06T12:00\", \"hora_inicio\": \"09:00:00\", \"vehiculo_id\": 3, \"aprobado_por\": null, \"conductor_id\": 1, \"esta_proxima\": true, \"fecha_inicio\": \"2025-12-06T09:00\", \"fecha_reserva\": \"2025-12-06T04:00:00.000Z\", \"nombre_unidad\": \"Sin especificar\", \"observaciones\": \"Creada por test\", \"dias_restantes\": 2, \"duracion_horas\": 3, \"puede_cancelar\": true, \"solicitante_id\": 1, \"conductor_email\": \"conductor1@umsa.edu.bo\", \"fecha_solicitud\": \"2025-12-03T18:14:07.000Z\", \"puede_modificar\": true, \"aprobador_nombre\": null, \"conductor_nombre\": \"5 - Roberto Gutierrez\", \"fecha_aprobacion\": null, \"solicitante_email\": \"admin@umsa.edu.bo\", \"solicitante_nombre\": \"Admin Sistema\", \"requiere_aprobacion\": true, \"historial_aprobacion\": [{\"fecha\": \"2025-12-05T03:18:56.000Z\", \"accion\": \"ACTUALIZACION_RESERVA\", \"datos_nuevos\": {\"marca\": \"Toyota\", \"placa\": \"UMSA-001\", \"estado\": \"PENDIENTE\", \"modelo\": \"Hiace\", \"motivo\": \"Prueba automática\", \"origen\": \"MOnoblock CEntral\", \"destino\": \"Oficina\", \"hora_fin\": \"12:00:00\", \"fecha_fin\": \"2025-12-20T12:00\", \"hora_inicio\": \"09:00:00\", \"vehiculo_id\": \"3\", \"conductor_id\": 1, \"esta_proxima\": false, \"fecha_inicio\": \"2025-12-20T09:00\", \"fecha_reserva\": \"2025-12-06\", \"nombre_unidad\": \"Sin especificar\", \"observaciones\": \"Creada por test\", \"dias_restantes\": 16, \"puede_cancelar\": true, \"solicitante_id\": 1, \"puede_modificar\": true, \"conductor_nombre\": \"Roberto Gutierrez\", \"conductor_nombres\": \"Roberto\", \"solicitante_nombre\": \"Admin Sistema\", \"conductor_apellidos\": \"Gutierrez\", \"solicitante_departamento\": \"TI\"}, \"usuario_nombre\": \"Admin Sistema\", \"datos_anteriores\": {\"id\": 3, \"color\": \"Blanco\", \"marca\": \"Toyota\", \"placa\": \"UMSA-001\", \"estado\": \"PENDIENTE\", \"modelo\": \"Hiace\", \"motivo\": \"Prueba automática\", \"origen\": \"\", \"destino\": \"Oficina\", \"hora_fin\": \"12:00:00\", \"capacidad\": 15, \"fecha_fin\": \"2025-12-20T12:00\", \"hora_inicio\": \"09:00:00\", \"vehiculo_id\": 1, \"aprobado_por\": null, \"conductor_id\": 1, \"esta_proxima\": false, \"fecha_inicio\": \"2025-12-20T09:00\", \"fecha_reserva\": \"2025-12-20T04:00:00.000Z\", \"nombre_unidad\": \"Sin especificar\", \"observaciones\": \"Creada por test\", \"dias_restantes\": 16, \"duracion_horas\": 3, \"puede_cancelar\": true, \"solicitante_id\": 1, \"conductor_email\": \"conductor1@umsa.edu.bo\", \"fecha_solicitud\": \"2025-12-03T18:14:07.000Z\", \"puede_modificar\": true, \"aprobador_nombre\": null, \"conductor_nombre\": \"5 - Roberto Gutierrez\", \"fecha_aprobacion\": null, \"solicitante_email\": \"admin@umsa.edu.bo\", \"solicitante_nombre\": \"Admin Sistema\", \"requiere_aprobacion\": true, \"historial_aprobacion\": [{\"fecha\": \"2025-12-03T18:14:07.000Z\", \"accion\": \"CREACION_RESERVA\", \"datos_nuevos\": {\"estado\": \"PENDIENTE\", \"vehiculo_id\": 1, \"fecha_reserva\": \"2025-12-20\", \"solicitante_id\": 1}, \"usuario_nombre\": \"Admin Sistema\", \"datos_anteriores\": null}], \"solicitante_departamento\": \"TI\"}}, {\"fecha\": \"2025-12-03T18:14:07.000Z\", \"accion\": \"CREACION_RESERVA\", \"datos_nuevos\": {\"estado\": \"PENDIENTE\", \"vehiculo_id\": 1, \"fecha_reserva\": \"2025-12-20\", \"solicitante_id\": 1}, \"usuario_nombre\": \"Admin Sistema\", \"datos_anteriores\": null}], \"solicitante_departamento\": \"TI\"}','{\"marca\": \"Nissan\", \"placa\": \"UMSA-003\", \"estado\": \"APROBADA\", \"modelo\": \"Urvan\", \"motivo\": \"Prueba automática\", \"origen\": \"MOnoblock CEntral\", \"destino\": \"Oficina\", \"hora_fin\": \"12:00:00\", \"fecha_fin\": \"2025-12-06T12:00\", \"hora_inicio\": \"09:00:00\", \"vehiculo_id\": \"7\", \"conductor_id\": \"3\", \"esta_proxima\": true, \"fecha_inicio\": \"2025-12-06T09:00\", \"fecha_reserva\": \"2025-12-06\", \"nombre_unidad\": \"Facultad de ciencias puras y naturales \", \"observaciones\": \"Creada por test\", \"dias_restantes\": 2, \"puede_cancelar\": true, \"solicitante_id\": 1, \"puede_modificar\": true, \"conductor_nombre\": \"Roberto Gutierrez\", \"conductor_nombres\": \"Roberto\", \"solicitante_nombre\": \"Admin Sistema\", \"conductor_apellidos\": \"Gutierrez\", \"solicitante_departamento\": \"TI\"}',NULL,'2025-12-05 03:19:50'),(158,1,'CAMBIO_ESTADO_RESERVA','reservas',3,'{\"estado\": \"APROBADA\"}','{\"estado\": \"COMPLETADA\"}',NULL,'2025-12-05 03:20:01'),(159,1,'CAMBIO_ESTADO_RESERVA','reservas',1,'{\"estado\": \"PENDIENTE\"}','{\"estado\": \"APROBADA\"}',NULL,'2025-12-05 03:20:07'),(160,1,'CAMBIO_ESTADO_RESERVA','reservas',1,'{\"estado\": \"APROBADA\"}','{\"estado\": \"COMPLETADA\"}',NULL,'2025-12-05 03:20:12'),(161,1,'CAMBIO_ESTADO_RESERVA','reservas',2,'{\"estado\": \"PENDIENTE\"}','{\"estado\": \"APROBADA\"}',NULL,'2025-12-05 03:20:27'),(162,NULL,'CREACION_ITEM_INVENTARIO','items_inventario',6,NULL,'{\"nombre\": \"prueba\", \"categoria_id\": 5, \"stock_actual\": 10}',NULL,'2025-12-05 14:34:04'),(163,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',6,'{\"id\": 6, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-MGP3VKX2C\", \"creado_en\": \"2025-12-05T14:34:04.000Z\", \"ubicacion\": \"Estante A3\", \"descripcion\": \"uno dos y tres \", \"categoria_id\": 5, \"estado_stock\": \"MEDIO\", \"stock_actual\": 10, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": true, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": \"1000.00\", \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": false}','{\"nombre\": \"prueba\", \"ubicacion\": \"Estante A3\", \"descripcion\": \"uno dos y tres \", \"categoria_id\": 5, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"1000.00\"}',NULL,'2025-12-05 14:34:34'),(164,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',6,'{\"id\": 6, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-MGP3VKX2C\", \"creado_en\": \"2025-12-05T14:34:04.000Z\", \"ubicacion\": \"Estante A3\", \"descripcion\": \"uno dos y tres \", \"categoria_id\": 5, \"estado_stock\": \"MEDIO\", \"stock_actual\": 10, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": true, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": \"1000.00\", \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": false}','{\"nombre\": \"prueba\", \"ubicacion\": \"Estante A3\", \"descripcion\": \"uno dos y tres \", \"categoria_id\": 5, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"1000.00\"}',NULL,'2025-12-05 14:34:45'),(165,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"dfvgbhn\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"LIMPIEZA\", \"precio_unitario\": null, \"categoria_nombre\": \"Limpieza Externa\", \"necesita_reposicion\": true}','{\"nombre\": \"dfvgbhn\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:36:48'),(166,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"dfvgbhn\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"LIMPIEZA\", \"precio_unitario\": null, \"categoria_nombre\": \"Limpieza Externa\", \"necesita_reposicion\": true}','{\"nombre\": \"dfvgbhn\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:37:13'),(167,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"dfvgbhn\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"LIMPIEZA\", \"precio_unitario\": null, \"categoria_nombre\": \"Limpieza Externa\", \"necesita_reposicion\": true}','{\"nombre\": \"dfvgbhn\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:39:23'),(168,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"dfvgbhn\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"LIMPIEZA\", \"precio_unitario\": null, \"categoria_nombre\": \"Limpieza Externa\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:39:31'),(169,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 3, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"LIMPIEZA\", \"precio_unitario\": null, \"categoria_nombre\": \"Limpieza Externa\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 5, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:39:39'),(170,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"efdgbnhgwefrg\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": null, \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_maximo\": 100, \"stock_minimo\": 5, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:39:54'),(171,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 5, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": null, \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_maximo\": 100, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:40:07'),(172,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 100, \"stock_minimo\": 3, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": null, \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_maximo\": 50, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": null}',NULL,'2025-12-05 14:40:13'),(173,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 50, \"stock_minimo\": 3, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": null, \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_maximo\": 50, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": 150}',NULL,'2025-12-05 14:40:20'),(174,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 50, \"stock_minimo\": 3, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": \"150.00\", \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_maximo\": 50, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"150.00\"}',NULL,'2025-12-05 14:40:31'),(175,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 50, \"stock_minimo\": 3, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": \"150.00\", \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_maximo\": 50, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"150.00\"}',NULL,'2025-12-05 14:40:45'),(176,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"BAJO\", \"stock_actual\": 3, \"stock_maximo\": 50, \"stock_minimo\": 3, \"stock_optimo\": false, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": \"150.00\", \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": true}','{\"nombre\": \"prueba\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_actual\": 5, \"stock_maximo\": 50, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"150.00\"}',NULL,'2025-12-05 14:41:57'),(177,NULL,'ACTUALIZACION_ITEM_INVENTARIO','items_inventario',5,'{\"id\": 5, \"activo\": 1, \"nombre\": \"prueba\", \"codigo_qr\": \"UMSA-ERTY0F0C2\", \"creado_en\": \"2025-11-26T01:26:28.000Z\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"estado_stock\": \"MEDIO\", \"stock_actual\": 5, \"stock_maximo\": 50, \"stock_minimo\": 3, \"stock_optimo\": true, \"unidad_medida\": \"UNIDAD\", \"categoria_tipo\": \"HERRAMIENTA\", \"precio_unitario\": \"150.00\", \"categoria_nombre\": \"Herramientas\", \"necesita_reposicion\": false}','{\"nombre\": \"prueba\", \"ubicacion\": \"Estante 23\", \"descripcion\": \"descripcion123\", \"categoria_id\": 5, \"stock_actual\": 6, \"stock_maximo\": 50, \"stock_minimo\": 3, \"unidad_medida\": \"UNIDAD\", \"precio_unitario\": \"150.00\"}',NULL,'2025-12-05 14:42:13'),(178,NULL,'ALERTA_STOCK_BAJO','items_inventario',5,'{\"stock_anterior\": 6}','{\"stock_actual\": 2}',NULL,'2025-12-05 14:43:33'),(179,1,'CREACION_REPARACION','reparaciones',9,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 2, \"vehiculo_id\": 5}',NULL,'2025-12-05 15:09:39'),(180,1,'ACTUALIZACION_REPARACION','reparaciones',9,'{\"id\": 9, \"color\": \"Verde\", \"costo\": \"120.00\", \"marca\": \"Test\", \"placa\": \"TEST-999\", \"estado\": \"RECIBIDO\", \"modelo\": \"Model\", \"mecanico\": \"Juan Técnico\", \"progreso\": 10, \"creado_en\": \"2025-12-05T15:09:39.000Z\", \"fecha_fin\": \"2025-12-12T04:00:00.000Z\", \"tecnico_id\": 2, \"costo_total\": 120, \"descripcion\": \"qwertyui\", \"diagnostico\": \"asdfghjk\", \"vehiculo_id\": 5, \"fecha_inicio\": \"2025-12-05T04:00:00.000Z\", \"tecnico_email\": \"tecnico@umsa.edu.bo\", \"tecnico_nombre\": \"Juan Técnico\", \"costo_repuestos\": null, \"fecha_recepcion\": \"2025-12-05T04:00:00.000Z\", \"total_repuestos\": 0, \"dias_en_reparacion\": 1, \"fecha_real_entrega\": null, \"kilometraje_actual\": \"0.00\", \"descripcion_problema\": \"qwertyui\", \"repuestos_utilizados\": [], \"fecha_estimada_entrega\": \"2025-12-12T04:00:00.000Z\"}','{\"estado\": \"RECIBIDO\", \"creado_en\": \"2025-12-05T15:09:39.000Z\", \"tecnico_id\": 2, \"costo_total\": 121, \"diagnostico\": \"asdfghjk\", \"vehiculo_id\": 5, \"fecha_recepcion\": \"2025-12-05\", \"fecha_real_entrega\": null, \"descripcion_problema\": \"qwertyui\", \"fecha_estimada_entrega\": \"2025-12-19\"}',NULL,'2025-12-05 15:16:42'),(181,1,'ACTUALIZACION_REPARACION','reparaciones',9,'{\"id\": 9, \"color\": \"Verde\", \"costo\": \"121.00\", \"marca\": \"Test\", \"placa\": \"TEST-999\", \"estado\": \"RECIBIDO\", \"modelo\": \"Model\", \"mecanico\": \"Juan Técnico\", \"progreso\": 10, \"creado_en\": \"2025-12-05T15:09:39.000Z\", \"fecha_fin\": \"2025-12-19T04:00:00.000Z\", \"tecnico_id\": 2, \"costo_total\": 121, \"descripcion\": \"qwertyui\", \"diagnostico\": \"asdfghjk\", \"vehiculo_id\": 5, \"fecha_inicio\": \"2025-12-05T04:00:00.000Z\", \"tecnico_email\": \"tecnico@umsa.edu.bo\", \"tecnico_nombre\": \"Juan Técnico\", \"costo_repuestos\": null, \"fecha_recepcion\": \"2025-12-05T04:00:00.000Z\", \"total_repuestos\": 0, \"dias_en_reparacion\": 1, \"fecha_real_entrega\": null, \"kilometraje_actual\": \"0.00\", \"descripcion_problema\": \"qwertyui\", \"repuestos_utilizados\": [], \"fecha_estimada_entrega\": \"2025-12-19T04:00:00.000Z\"}','{\"estado\": \"RECIBIDO\", \"creado_en\": \"2025-12-05T15:09:39.000Z\", \"tecnico_id\": 2, \"costo_total\": 121, \"diagnostico\": \"asdfghjk\", \"vehiculo_id\": 5, \"fecha_recepcion\": \"2025-12-05\", \"fecha_real_entrega\": null, \"descripcion_problema\": \"prueba1\", \"fecha_estimada_entrega\": \"2025-12-18\"}',NULL,'2025-12-05 15:17:06'),(182,1,'ELIMINACION_REPARACION','reparaciones',3,'{\"id\": 3, \"color\": \"Blanco\", \"costo\": \"0.00\", \"marca\": \"Toyota\", \"placa\": \"UMSA-001\", \"estado\": \"RECIBIDO\", \"modelo\": \"Hiace\", \"mecanico\": \"Carlos Mendez\", \"progreso\": 10, \"creado_en\": \"2025-12-04T14:00:43.000Z\", \"fecha_fin\": \"2025-12-12T04:00:00.000Z\", \"tecnico_id\": 4, \"costo_total\": 0, \"descripcion\": \"QWERTYUIO\", \"diagnostico\": \"MJNHBGVFCDSX\", \"vehiculo_id\": 1, \"fecha_inicio\": \"2025-12-04T04:00:00.000Z\", \"tecnico_email\": \"tecnico1@umsa.edu.bo\", \"tecnico_nombre\": \"Carlos Mendez\", \"costo_repuestos\": null, \"fecha_recepcion\": \"2025-12-04T04:00:00.000Z\", \"total_repuestos\": 0, \"dias_en_reparacion\": 2, \"fecha_real_entrega\": null, \"kilometraje_actual\": \"0.00\", \"descripcion_problema\": \"QWERTYUIO\", \"repuestos_utilizados\": [], \"fecha_estimada_entrega\": \"2025-12-12T04:00:00.000Z\"}',NULL,NULL,'2025-12-05 15:19:07'),(183,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',7,'{\"estado_anterior\": \"RECIBIDO\"}','{\"estado_nuevo\": \"DIAGNOSTICO\"}',NULL,'2025-12-05 15:30:35'),(184,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',7,'{\"estado_anterior\": \"DIAGNOSTICO\"}','{\"estado_nuevo\": \"EN_REPARACION\"}',NULL,'2025-12-05 15:30:41'),(185,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',7,'{\"estado_anterior\": \"EN_REPARACION\"}','{\"estado_nuevo\": \"TERMINADO\"}',NULL,'2025-12-05 15:30:45'),(186,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',7,'{\"estado_anterior\": \"TERMINADO\"}','{\"estado_nuevo\": \"ENTREGADO\"}',NULL,'2025-12-05 15:30:48'),(187,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',6,'{\"estado_anterior\": \"RECIBIDO\"}','{\"estado_nuevo\": \"DIAGNOSTICO\"}',NULL,'2025-12-05 15:31:40'),(188,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',5,'{\"estado_anterior\": \"RECIBIDO\"}','{\"estado_nuevo\": \"DIAGNOSTICO\", \"observaciones\": \"SE RELALIZO EL DIAGNOSTICO FALLA EN LAS BUJIAS\", \"fecha_real_entrega\": null}',NULL,'2025-12-05 15:37:53'),(189,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',5,'{\"estado_anterior\": \"DIAGNOSTICO\"}','{\"estado_nuevo\": \"EN_REPARACION\", \"observaciones\": \"Se empezo con la reparacion de la movilida\\n\", \"fecha_real_entrega\": null}',NULL,'2025-12-05 15:38:29'),(190,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',5,'{\"estado_anterior\": \"EN_REPARACION\"}','{\"estado_nuevo\": \"TERMINADO\", \"observaciones\": \"FAlla solucionanda\", \"fecha_real_entrega\": \"2025-12-05\"}',NULL,'2025-12-05 15:38:43'),(191,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',5,'{\"estado_anterior\": \"TERMINADO\"}','{\"estado_nuevo\": \"ENTREGADO\", \"observaciones\": \"ningun reclamo\", \"fecha_real_entrega\": \"2025-12-05\"}',NULL,'2025-12-05 15:38:52'),(192,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-05T20:45:18.512Z\"}',NULL,'2025-12-05 20:45:18'),(193,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-05T21:36:07.806Z\"}',NULL,'2025-12-05 21:36:07'),(194,5,'DESACTIVACION_USUARIO','usuarios',5,'{\"id\": 5, \"email\": \"conductor1@umsa.edu.bo\", \"activo\": 1, \"rol_id\": 3, \"nombres\": \"Roberto\", \"telefono\": null, \"apellidos\": \"Gutierrez\", \"creado_en\": \"2025-11-16T00:14:51.000Z\", \"rol_nombre\": \"CONDUCTOR\", \"departamento\": \"Transporte\", \"nivel_acceso\": 2, \"rol_descripcion\": \"Operación de vehículos\"}','{\"activo\": false}',NULL,'2025-12-05 21:38:03'),(195,5,'ACTUALIZACION_USUARIO','usuarios',5,'{\"id\": 5, \"email\": \"conductor1@umsa.edu.bo\", \"activo\": 0, \"rol_id\": 3, \"nombres\": \"Roberto\", \"telefono\": null, \"apellidos\": \"Gutierrez\", \"creado_en\": \"2025-11-16T00:14:51.000Z\", \"rol_nombre\": \"CONDUCTOR\", \"departamento\": \"Transporte\", \"nivel_acceso\": 2, \"rol_descripcion\": \"Operación de vehículos\"}','{\"activo\": true}',NULL,'2025-12-05 21:38:10'),(196,12,'CREACION_USUARIO','usuarios',12,NULL,'{\"email\": \"dghdf\", \"rol_id\": \"3\", \"nombres\": \"carlos\", \"apellidos\": \"valencia\"}',NULL,'2025-12-05 21:40:44'),(198,NULL,'CREACION_CONDUCTOR','conductores',4,NULL,'{\"usuario_id\": \"12\", \"licencia_numero\": \"6804905\", \"licencia_categoria\": \"C\"}',NULL,'2025-12-05 21:45:31'),(199,1,'CREACION_RESERVA','reservas',7,NULL,'{\"estado\": \"PENDIENTE\", \"vehiculo_id\": \"2\", \"fecha_reserva\": \"2025-12-06\", \"solicitante_id\": 1}',NULL,'2025-12-05 21:47:19'),(200,1,'CAMBIO_ESTADO_RESERVA','reservas',7,'{\"estado\": \"PENDIENTE\"}','{\"estado\": \"APROBADA\"}',NULL,'2025-12-05 21:49:55'),(201,1,'CAMBIO_ESTADO_RESERVA','reservas',7,'{\"estado\": \"APROBADA\"}','{\"estado\": \"COMPLETADA\"}',NULL,'2025-12-05 21:50:06'),(202,1,'CAMBIO_ESTADO_RESERVA','reservas',6,'{\"estado\": \"PENDIENTE\"}','{\"estado\": \"APROBADA\"}',NULL,'2025-12-05 21:50:16'),(203,1,'CAMBIO_ESTADO_RESERVA','reservas',6,'{\"estado\": \"APROBADA\"}','{\"estado\": \"COMPLETADA\"}',NULL,'2025-12-05 21:50:21'),(204,1,'CREACION_REPARACION','reparaciones',10,NULL,'{\"estado\": \"RECIBIDO\", \"tecnico_id\": 8, \"vehiculo_id\": 10}',NULL,'2025-12-05 21:55:43'),(205,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',10,'{\"estado_anterior\": \"RECIBIDO\"}','{\"estado_nuevo\": \"DIAGNOSTICO\", \"observaciones\": \"DESGASTE PREMATURO\", \"fecha_real_entrega\": null}',NULL,'2025-12-05 21:56:32'),(206,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',10,'{\"estado_anterior\": \"DIAGNOSTICO\"}','{\"estado_nuevo\": \"EN_REPARACION\", \"observaciones\": \"CAMBIO DE PASTILLA\", \"fecha_real_entrega\": null}',NULL,'2025-12-05 21:56:51'),(207,1,'ACTUALIZACION_ESTADO_REPARACION','reparaciones',10,'{\"estado_anterior\": \"TERMINADO\"}','{\"estado_nuevo\": \"ENTREGADO\", \"observaciones\": \"SE ENTREGO CONFORME\", \"fecha_real_entrega\": \"2025-12-20\"}',NULL,'2025-12-05 21:59:41'),(208,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-06T02:33:28.846Z\"}',NULL,'2025-12-06 02:33:28'),(209,1,'LOGIN_EXITOSO','usuarios',1,NULL,'{\"ultimo_login\": \"2025-12-06T17:21:44.669Z\"}',NULL,'2025-12-06 17:21:44'),(210,NULL,'CREACION_ITEM_INVENTARIO','items_inventario',7,NULL,'{\"nombre\": \"LLAnta \", \"categoria_id\": 5, \"stock_actual\": 1}',NULL,'2025-12-06 17:22:52'),(211,13,'CREACION_USUARIO','usuarios',13,NULL,'{\"email\": \"ejemplo@umsa.edu.bo\", \"rol_id\": 4, \"nombres\": \"Jose\", \"apellidos\": \"Alpaca\"}',NULL,'2025-12-10 02:08:22');
/*!40000 ALTER TABLE `auditoria_sistema` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_inventario`
--

DROP TABLE IF EXISTS `categorias_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('LIMPIEZA','REPUESTO','HERRAMIENTA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_inventario`
--

LOCK TABLES `categorias_inventario` WRITE;
/*!40000 ALTER TABLE `categorias_inventario` DISABLE KEYS */;
INSERT INTO `categorias_inventario` VALUES (1,'Lubricantes','REPUESTO','Aceites y lubricantes para motor','2025-11-15 23:11:18'),(2,'Filtros','REPUESTO','Filtros de aire, aceite y combustible','2025-11-15 23:11:18'),(3,'Limpieza Externa','LIMPIEZA','Productos para lavado exterior','2025-11-15 23:11:18'),(4,'Limpieza Interna','LIMPIEZA','Productos para limpieza interior','2025-11-15 23:11:18'),(5,'Herramientas','HERRAMIENTA','Herramientas de taller','2025-11-15 23:11:18');
/*!40000 ALTER TABLE `categorias_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conductores`
--

DROP TABLE IF EXISTS `conductores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conductores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `licencia_numero` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `licencia_categoria` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `licencia_vencimiento` date NOT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `habilitado` tinyint(1) DEFAULT '1',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  UNIQUE KEY `licencia_numero` (`licencia_numero`),
  CONSTRAINT `conductores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conductores`
--

LOCK TABLES `conductores` WRITE;
/*!40000 ALTER TABLE `conductores` DISABLE KEYS */;
INSERT INTO `conductores` VALUES (1,5,'123456','B','2026-01-28','67083920',1,'2025-12-03 16:02:00'),(3,11,'12345632','B','2026-01-28','8520963',1,'2025-12-05 02:18:33'),(4,12,'6804905','C','2025-12-31','78962223',1,'2025-12-05 21:45:31');
/*!40000 ALTER TABLE `conductores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consumo_repuestos`
--

DROP TABLE IF EXISTS `consumo_repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumo_repuestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reparacion_id` int NOT NULL,
  `item_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `costo_unitario` decimal(10,2) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reparacion_id` (`reparacion_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `consumo_repuestos_ibfk_1` FOREIGN KEY (`reparacion_id`) REFERENCES `reparaciones` (`id`),
  CONSTRAINT `consumo_repuestos_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items_inventario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consumo_repuestos`
--

LOCK TABLES `consumo_repuestos` WRITE;
/*!40000 ALTER TABLE `consumo_repuestos` DISABLE KEYS */;
/*!40000 ALTER TABLE `consumo_repuestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items_inventario`
--

DROP TABLE IF EXISTS `items_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_qr` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `categoria_id` int NOT NULL,
  `stock_actual` int DEFAULT '0',
  `stock_minimo` int DEFAULT '5',
  `stock_maximo` int DEFAULT '100',
  `unidad_medida` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'UNIDAD',
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  `ubicacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_qr` (`codigo_qr`),
  KEY `idx_items_categoria` (`categoria_id`),
  CONSTRAINT `items_inventario_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_inventario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items_inventario`
--

LOCK TABLES `items_inventario` WRITE;
/*!40000 ALTER TABLE `items_inventario` DISABLE KEYS */;
INSERT INTO `items_inventario` VALUES (1,NULL,'Aceite Motor 15W40','Aceite sintético para motor diesel',1,25,5,100,'UNIDAD',85.50,'Estante A1',1,'2025-11-16 00:14:51'),(2,NULL,'Filtro de Aire','Filtro de aire para motor grande',2,12,3,100,'UNIDAD',45.00,'Estante B2',0,'2025-11-16 00:14:51'),(3,NULL,'Pastillas de Freno','Juego de pastillas para frenos delanteros',3,8,2,100,'UNIDAD',120.00,'Estante C3',1,'2025-11-16 00:14:51'),(4,NULL,'Jabón Líquido Vehicular','Jabón especial para lavado de vehículos',4,12,4,100,'UNIDAD',25.00,'Estante D1',1,'2025-11-16 00:14:51'),(5,'UMSA-ERTY0F0C2','prueba','descripcion123',5,10,3,50,'UNIDAD',150.00,'Estante 23',0,'2025-11-26 01:26:28'),(6,'UMSA-MGP3VKX2C','prueba','uno dos y tres ',5,10,5,100,'UNIDAD',1000.00,'Estante A3',0,'2025-12-05 14:34:04'),(7,'UMSA-H4R4FRQKG','LLAnta ','ertghjk',5,1,1,5,'UNIDAD',150.00,'almacen 1',1,'2025-12-06 17:22:52');
/*!40000 ALTER TABLE `items_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `tipo_movimiento` enum('ENTRADA','SALIDA','AJUSTE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `stock_anterior` int NOT NULL,
  `stock_actual` int NOT NULL,
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `referencia_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_movimientos_item` (`item_id`),
  CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items_inventario` (`id`),
  CONSTRAINT `movimientos_inventario_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,5,'ENTRADA',3,0,3,'Stock inicial',NULL,1,'2025-11-26 01:26:28'),(2,2,'ENTRADA',2,15,17,'mantenimiento',NULL,1,'2025-12-03 15:18:05'),(3,2,'SALIDA',4,17,13,'uso en vehicullo ...',NULL,1,'2025-12-03 15:18:28'),(4,2,'ENTRADA',5,13,18,'Reposición de stock',NULL,1,'2025-12-04 22:01:36'),(5,2,'SALIDA',5,18,13,'reparacion',NULL,1,'2025-12-04 22:02:02'),(6,2,'AJUSTE',-1,13,12,'Ajuste de inventario',NULL,1,'2025-12-04 22:02:44'),(7,6,'ENTRADA',10,0,10,'Stock inicial',NULL,1,'2025-12-05 14:34:04'),(8,5,'SALIDA',4,6,2,'mantenimiento',NULL,1,'2025-12-05 14:43:33'),(9,5,'AJUSTE',8,2,10,'Ajuste de inventario',NULL,1,'2025-12-05 21:52:08'),(10,7,'ENTRADA',1,0,1,'Stock inicial',NULL,1,'2025-12-06 17:22:52');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reparaciones`
--

DROP TABLE IF EXISTS `reparaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reparaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int NOT NULL,
  `tecnico_id` int NOT NULL,
  `fecha_recepcion` date NOT NULL,
  `fecha_estimada_entrega` date DEFAULT NULL,
  `fecha_real_entrega` date DEFAULT NULL,
  `descripcion_problema` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `diagnostico` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('RECIBIDO','DIAGNOSTICO','EN_REPARACION','TERMINADO','ENTREGADO') COLLATE utf8mb4_unicode_ci DEFAULT 'RECIBIDO',
  `costo_total` decimal(10,2) DEFAULT '0.00',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehiculo_id` (`vehiculo_id`),
  KEY `tecnico_id` (`tecnico_id`),
  KEY `idx_reparaciones_estado` (`estado`),
  CONSTRAINT `reparaciones_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`),
  CONSTRAINT `reparaciones_ibfk_2` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reparaciones`
--

LOCK TABLES `reparaciones` WRITE;
/*!40000 ALTER TABLE `reparaciones` DISABLE KEYS */;
INSERT INTO `reparaciones` VALUES (1,2,1,'2025-12-04','2025-12-12',NULL,'LOIKUJYHTGRFEDWSQA',NULL,'RECIBIDO',0.00,'2025-12-04 13:48:26'),(2,1,4,'2025-12-04','2025-12-12',NULL,'QWERTYUIO','ASDFGHJKL;','RECIBIDO',0.00,'2025-12-04 13:57:08'),(4,3,2,'2025-12-04','2025-12-12',NULL,'QWERTYUIODFGHJKIUYTRF','LKJHGFDSWEDRFGTYH','RECIBIDO',0.00,'2025-12-04 14:01:58'),(5,2,1,'2025-12-04','2025-12-12','2025-12-05','QWERTYUIOP','SDFGHJKL','ENTREGADO',0.00,'2025-12-04 14:04:10'),(6,3,1,'2025-12-04','2025-12-12',NULL,'1234rtyuhtgfdsa','rfedwsqaRFEDWS','DIAGNOSTICO',0.00,'2025-12-04 14:12:06'),(7,2,1,'2025-12-04','2025-12-12','2025-12-05','umjnyhbgfvdcsxa','kiujyhtgrfedwsq','ENTREGADO',999.00,'2025-12-04 14:14:07'),(8,4,1,'2025-12-04','2025-12-15',NULL,'falla de motor','perdida de fuerza','RECIBIDO',0.00,'2025-12-04 21:49:38'),(9,5,2,'2025-12-05','2025-12-18',NULL,'prueba1','asdfghjk','RECIBIDO',121.00,'2025-12-05 15:09:39'),(10,10,8,'2025-12-05','2025-12-25','2025-12-20','FALLA DE FRENO','','ENTREGADO',2000.00,'2025-12-05 21:55:43');
/*!40000 ALTER TABLE `reparaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas`
--

DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `solicitante_id` int NOT NULL,
  `vehiculo_id` int NOT NULL,
  `conductor_id` int DEFAULT NULL,
  `fecha_solicitud` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `origen` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destino` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_unidad` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sin especificar',
  `motivo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('PENDIENTE','APROBADA','RECHAZADA','CANCELADA','COMPLETADA') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDIENTE',
  `aprobado_por` int DEFAULT NULL,
  `fecha_aprobacion` timestamp NULL DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `solicitante_id` (`solicitante_id`),
  KEY `vehiculo_id` (`vehiculo_id`),
  KEY `conductor_id` (`conductor_id`),
  KEY `aprobado_por` (`aprobado_por`),
  KEY `idx_reservas_fecha` (`fecha_reserva`),
  KEY `idx_reservas_estado` (`estado`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`),
  CONSTRAINT `reservas_ibfk_3` FOREIGN KEY (`conductor_id`) REFERENCES `conductores` (`id`),
  CONSTRAINT `reservas_ibfk_4` FOREIGN KEY (`aprobado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas`
--

LOCK TABLES `reservas` WRITE;
/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
INSERT INTO `reservas` VALUES (1,1,1,1,'2025-12-03 17:25:28','2025-12-12','12:30:00','15:30:00','','sdfghjkl','Sin especificar','qwertyuio','COMPLETADA',NULL,NULL,'wertyuikjhgfdsa'),(2,9,2,1,'2025-12-03 17:27:19','2025-12-13','12:30:00','15:30:00','','azqwsxedcrfv','Sin especificar','hbtgvrfcedxwsz','APROBADA',NULL,NULL,'ojveunfveunencwdoi'),(3,1,7,3,'2025-12-03 18:14:07','2025-12-06','09:00:00','12:00:00','MOnoblock CEntral','Oficina','Facultad de ciencias puras y naturales ','Prueba automática','COMPLETADA',NULL,NULL,'Creada por test'),(4,1,6,3,'2025-12-05 02:56:25','2025-12-18','08:00:00','17:00:00','MOnoblock CEntral','Cota cota ','Sin especificar','TRaslado de autoridades de la universidad ','PENDIENTE',NULL,NULL,'observaiones'),(6,1,6,1,'2025-12-05 03:12:31','2025-12-25','11:00:00','17:00:00','MOnoblock CEntral','Cota cota ','DIRECCION GERENERAL','traslado de indumentaria navideña ','COMPLETADA',NULL,NULL,'qwertyui'),(7,1,2,4,'2025-12-05 21:47:19','2025-12-06','08:00:00','17:00:00','MOnoblock CEntral','Cota cota ','RECTORADO','TRASLADO DE PERSONAL','COMPLETADA',NULL,NULL,NULL);
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `nivel_acceso` tinyint DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMINISTRADOR','Acceso completo al sistema',4,1,'2025-11-15 23:11:18'),(2,'TECNICO','Gestión de inventarios y reparaciones',3,1,'2025-11-15 23:11:18'),(3,'CONDUCTOR','Operación de vehículos',2,1,'2025-11-15 23:11:18'),(4,'SOLICITANTE','Solicitud de reservas',1,1,'2025-11-15 23:11:18');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol_id` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `token_recuperacion` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_recuperacion_expira` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'admin@umsa.edu.bo','$2a$10$ZWfXcFFpXyYgm.TB5foQmOi76kN1EBLT7d55hYb0Iakcs3FSlpsBC','Admin','Sistema',NULL,'TI',1,1,'2025-11-15 23:11:18',NULL,NULL),(2,'tecnico@umsa.edu.bo','$2a$10$ZWfXcFFpXyYgm.TB5foQmOi76kN1EBLT7d55hYb0Iakcs3FSlpsBC','Juan','Técnico',NULL,'Taller',2,1,'2025-11-15 23:11:18',NULL,NULL),(4,'tecnico1@umsa.edu.bo','$2a$12$.KuBoi2u/XXz.eLyAs5uIuMTa0Vx/3UiztFtbO.WwPe3WjLgdjmHS','Carlos','Mendez',NULL,'Taller Mecánico',2,1,'2025-11-16 00:14:51',NULL,NULL),(5,'conductor1@umsa.edu.bo','$2a$12$cVeZkfnMBQP2vHkDr97gVuMKvps.we/C9Br4Y1TFnmu2Y8n5vim1e','Roberto','Gutierrez',NULL,'Transporte',3,1,'2025-11-16 00:14:51',NULL,NULL),(8,'yhorelyharedalvareza@gmail.com','$2a$10$ZQb2ukQOY1KHZXlJVbgd9ec6t5ZT.J7tSOsw6xHcKQ4.zKKtELtXi','Nancy','Alvarez',NULL,NULL,2,1,'2025-11-26 00:15:42','eb5ecfc924891507a3fa161322529f2c696c0eccf8600d1f347a0602e15570f0','2025-12-10 00:05:08'),(9,'yhorel@umsa.edu.bo','$2a$10$nDUkD0qecFONoPrrJ0A.QeKKHrYuVVLfhr3wGP7I3lhLrOFbikT5a','Yhared','Alvarez',NULL,NULL,4,1,'2025-12-03 15:36:55',NULL,NULL),(11,'conductor2@umsa.edu.bo','$2a$10$lev6MKWFq1y3rPmcmG2nB.Il.T73ZZTF7SYWHNogTTFQcLasfiCXG','Jose Luis ','Perales ','71585159','Taller ',3,1,'2025-12-05 02:17:12',NULL,NULL),(12,'dghdf','$2a$10$V8EVD6p.HLGJ43J8XxEAoeBsM/r6HW858POWxz2Z98c3VLY.y/PNm','carlos','valencia','78962223','transportes',3,1,'2025-12-05 21:40:44',NULL,NULL),(13,'ejemplo@umsa.edu.bo','$2a$10$10M2efJIBfI.crMswBYcne/mRrP49ACiu72wLbg9T3chROR23KZzq','Jose','Alpaca','1234789','Facultad de ingienieria ',4,1,'2025-12-10 02:08:22',NULL,NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `año` int DEFAULT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacidad` int NOT NULL,
  `tipo_combustible` enum('GASOLINA','DIESEL','ELECTRICO','HIBRIDO') COLLATE utf8mb4_unicode_ci DEFAULT 'GASOLINA',
  `estado` enum('DISPONIBLE','EN_REPARACION','EN_USO','INACTIVO') COLLATE utf8mb4_unicode_ci DEFAULT 'DISPONIBLE',
  `kilometraje_actual` decimal(10,2) DEFAULT '0.00',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `placa` (`placa`),
  KEY `idx_vehiculos_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
INSERT INTO `vehiculos` VALUES (1,'UMSA-001','Toyota','Hiace',2022,'Blanco',15,'GASOLINA','DISPONIBLE',0.00,'2025-11-15 23:11:18'),(2,'UMSA-002','Mercedes','Sprinter',2021,'Azul',20,'GASOLINA','DISPONIBLE',0.00,'2025-11-15 23:11:18'),(3,'UMSA-003','Nissan','Urvan',2020,'Gris',12,'GASOLINA','DISPONIBLE',0.00,'2025-11-15 23:11:18'),(4,'TEST-001','Toyota','Hiace',2023,'Blanco',15,'DIESEL','EN_REPARACION',0.00,'2025-11-16 20:00:09'),(5,'TEST-999','Test','Model',2023,'Verde',10,'GASOLINA','EN_REPARACION',0.00,'2025-11-16 20:02:12'),(6,'ABC-123','Toyota','Hiace',2023,'Blanco',15,'DIESEL','DISPONIBLE',0.00,'2025-11-16 20:20:12'),(7,'XYZ-789','Mercedes-Benz','Sprinter',2024,'Azul',20,'DIESEL','DISPONIBLE',0.00,'2025-11-16 20:20:12'),(10,'abb-910','toyota','land crusser',2010,'azul',7,'GASOLINA','DISPONIBLE',0.00,'2025-12-05 01:49:17');
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-09 23:07:57
