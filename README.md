# 🛒 Shopping Cart - Arquitectura y Gestión de Base de Datos

## 📌 Descripción
Este proyecto implementa un sistema de carrito de compras siguiendo buenas prácticas de desarrollo por ambientes (**dev, qa, main**) utilizando un ORM para el mapeo de entidades y **Liquibase** para el control de versiones de la base de datos.

![Login](./docs/login.png)
![DashBoard](./docs/dashboard_1.png)
![Sidebar](./docs/dashboard_2.png)
![Nuevo Producto](./docs/nuevo_producto.png)
![Venta](./docs/venta.png)

📄 [Ver Factura](./docs/Fact_1.pdf)

---

## 🏗️ Arquitectura del Carrito de Compras

A continuación se muestra la estructura del carrito de compras:

![Estructura del carrito](./docs/cart-structure.png)
---

## 🔄 Evolución de Features por Ambiente

La evolución de un feature se maneja de forma controlada en cada ambiente para garantizar estabilidad y trazabilidad. En **desarrollo (dev)** se realizan cambios sobre las entidades del ORM y se prueban funcionalidades, permitiendo configuraciones flexibles como actualización automática de la base de datos para agilizar el desarrollo; en **qa (testing)** se despliega el código sin permitir modificaciones automáticas del ORM, aplicando en su lugar scripts de migración versionados para validar el comportamiento del sistema; finalmente, en **producción (main)** solo se liberan cambios estables, configurando el ORM en modo validación para que únicamente verifique la consistencia entre las entidades y la base de datos sin alterarla, asegurando así control, estabilidad y consistencia entre ambientes.

---

## 🗄️ Gestión de Base de Datos con Liquibase

Liquibase se utiliza como herramienta de control de versiones de base de datos mediante archivos `changeLog`, donde se definen de manera explícita los cambios estructurales (creación, modificación o eliminación de tablas), permitiendo ejecutar estos cambios de forma ordenada y controlada en cada ambiente; al integrarlo con el ORM, se desactiva la generación automática del esquema configurando el ORM en modo `validate`, de forma que este solo verifique la estructura existente sin crear ni modificar tablas, delegando completamente la gestión de la base de datos a Liquibase, lo cual garantiza trazabilidad, control de cambios y posibilidad de rollback en cualquier entorno.

---

## ⚙️ Puesta en Marcha

Sigue estos pasos para ejecutar el proyecto correctamente:

1. Clona el repositorio en tu equipo en la carpeta deseada.

2. Accede a la carpeta raíz del proyecto:
   ```bash
   cd shopping_cart

3. Ejecuta los contenedores con Docker:
    ```bash
    docker-compose up --build

⚠️ Asegúrate de tener Docker Desktop iniciado antes de ejecutar este comando, de lo contrario no funcionará correctamente.

4. Una vez los servicios estén arriba, inicia el frontend:
    ```bash
    cd frontend
    npm run dev

Abre tu navegador y accede a la aplicación ShopCart.

http://localhost:5173/login

---

## 🔐 Credenciales

### 👑 Rol: Administrador
- Usuario: admin@shopcart.com
- Password: admin

### 👷 Rol: Empleado
- Usuario: empleado_1@shopcart.com
- Password: 1234

---
