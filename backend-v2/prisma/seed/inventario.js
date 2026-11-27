const { marcas } = require("./modelo");
const catalogo = require("./catalogo");

// Familia comercial, unidad, precio unitario en CLP y existencias.
const familias = {
    audio: [
        ["Caja activa de 12 pulgadas", "caja", 32000, 12], ["Subwoofer de 18 pulgadas", "caja", 45000, 6],
        ["Micrófono inalámbrico de mano", "unidad", 18000, 16], ["Mezcladora digital de 16 canales", "consola", 55000, 4],
        ["Micrófono de solapa", "unidad", 19500, 7], ["Monitor de retorno", "caja", 26000, 8]],
    luces: [
        ["Foco LED ámbar", "foco", 9500, 40], ["Cabeza móvil de haz estrecho", "foco", 29000, 12],
        ["Guirnalda cálida de diez metros", "tramo", 8500, 40], ["Barra de luz frontal", "barra", 16000, 16]],
    mesas: [
        ["Mesa redonda para diez personas", "mesa", 11500, 36], ["Silla plegable de madera", "silla", 2400, 420],
        ["Mesa alta de cóctel", "mesa", 9500, 24], ["Tablero de exposición", "mesa", 8000, 32],
        ["Atril de madera", "unidad", 14500, 4], ["Biombo de separación", "panel", 6500, 24]],
    decoracion: [
        ["Arco floral desmontable", "arco", 78000, 3], ["Centro de mesa de flores secas", "arreglo", 9500, 48],
        ["Fondo textil para fotografías", "paño", 27000, 6], ["Camino de mesa crudo", "paño", 4200, 60]],
    video: [
        ["Proyector láser de sala", "unidad", 68000, 3], ["Telón de proyección de tres metros", "unidad", 24000, 4],
        ["Monitor de apoyo de 55 pulgadas", "pantalla", 37000, 5], ["Capturadora de transmisión", "unidad", 26000, 1],
        ["Pasador inalámbrico de diapositivas", "unidad", 5500, 12]],
    montaje: [
        ["Tarima modular antideslizante", "módulo", 14500, 40], ["Escalera lateral con baranda", "unidad", 12500, 8],
        ["Carpa plegable de tres metros", "módulo", 35000, 22], ["Lastre de carpa", "juego", 6000, 35],
        ["Pasacables de caucho", "tramo", 4500, 80], ["Separador de fila con cinta", "unidad", 3500, 48]],
    menaje: [
        ["Copa de espumante", "copa", 650, 520], ["Plato bajo de loza blanca", "plato", 600, 500],
        ["Cubiertos de acero para cena", "puesto", 750, 480], ["Mantel redondo marfil", "mantel", 4200, 64],
        ["Termo dispensador de café", "termo", 8500, 12], ["Bandeja térmica de servicio", "unidad", 6500, 20]],
    comida: [
        ["Caja térmica con diez colaciones de jornada", "caja", 65000, 40], ["Estación de café y bollería para diez", "estación", 54000, 40],
        ["Servicio de cena con vajilla para diez", "juego", 245000, 36], ["Set de once con repostería para diez", "juego", 68000, 45],
        ["Bandeja de cóctel frío para diez", "bandeja", 98000, 40]],
    personal: [
        ["Operación de sonido en sala", "turno", 85000, 5], ["Técnico de iluminación", "turno", 78000, 5],
        ["Fotografía de ceremonia", "turno", 125000, 4], ["Asistencia de acreditación", "turno", 42000, 16],
        ["Garzón de banquetería", "turno", 46000, 24], ["Jefatura de montaje", "turno", 82000, 4],
        ["Conducción de furgón de carga", "turno", 58000, 6], ["Intérprete de lengua de señas", "turno", 95000, 2],
        ["Operación de streaming", "turno", 92000, 3], ["Maestría de ceremonias", "turno", 105000, 4]],
    bodega: [["Proyector de lámpara antigua", "unidad", 35000, 1], ["Foco halógeno de pedestal", "foco", 11500, 4]]
};

const recintos = [
    ["Quincho del Arrayanal", "San Pedro de la Paz", -36.852, -73.108, 120],
    ["Salón de los Telares", "Concepción", -36.821, -73.042, 250],
    ["Galpón del Varadero", "Talcahuano", -36.732, -73.105, 340],
    ["Patio de los Avellanos", "Chiguayante", -36.919, -73.022, 95],
    ["Centro de Encuentros La Greda", "Hualpén", -36.791, -73.106, 200],
    ["Pabellón Piedra Gris", "Coronel", -37.032, -73.137, 300],
    ["Casa del Vivero", "Hualqui", -36.973, -72.936, 95],
    ["Terraza del Estero", "Penco", -36.743, -72.991, 155],
    ["Auditorio Las Quillas", "Tomé", -36.624, -72.951, 280],
    ["Comedor del Molino", "Florida", -36.825, -72.659, 130],
    ["Sala del Antiguo Taller", "Lota", -37.086, -73.157, 75]
];

function inventario(s) {
    const { db, agregar, origen, web } = s;
    const familiasIds = {};
    for (const [familia, items] of Object.entries(familias)) {
        familiasIds[familia] = items.map(([nombre, unidad, precioUnitario, stockTotal], i) => {
            const humano = familia === "personal";
            const r = agregar("Recurso", { nombre, descripcion: familia === "comida" ? "Incluye diez porciones y material de servicio retornable. Se reserva por grupos de diez." : humano ? "Turno presencial, con traslado dentro del Gran Concepción."
                : `Se cotiza por ${unidad}. Retiro y revisión en bodega al cierre del evento.`,
                tipo: humano ? "HUMANO" : "MATERIAL", precioUnitario, stockTotal,
                cantidadEnMantencion: familia === "video" && !i ? 1 : 0,
                cantidadPerdida: familia === "menaje" ? i : 0, activo: familia !== "bodega", ...marcas(origen) });
            if (humano) db.RecursoHumano.push({ recursoId: r.id, origen: i % 3 ? "EXTERNO" : "INTERNO" });
            else db.RecursoMaterial.push({ recursoId: r.id, unidad });
            return r;
        });
    }
    catalogo.forEach(([nombre, foto, cantidadPersonasBase, precio, , descripcion, incluye]) => {
        const horas = ["jornada", "seminario", "feria"].includes(foto);
        agregar("TipoEvento", { nombre, descripcion, incluye, cantidadPersonasBase, modalidadPrecio: horas ? "POR_HORA" : "FIJO",
            tarifaHora: horas ? precio : null, precioBase: horas ? null : precio,
            imagen_url: web + "/assets/img/catalogo/" + foto + ".webp", activo: true, ...marcas(origen) });
    });
    recintos.forEach(([nombre, comuna, latitud, longitud, capacidad], i) => agregar("Espacio", {
        nombre, direccion: `Pasaje ${["de los Husos", "Canelo Azul", "Carpinteros del Sur", "del Telar"][i % 4]} ${124 + 69 * i}`, comuna, latitud, longitud, capacidad,
        costoArriendo: [35000, 245000, 290000][i % 3], unidadArriendo: ["HORA", "DIA", "EVENTO"][i % 3],
        habilitado: i !== recintos.length - 1, observaciones: ["Acceso de carga por el portón lateral.", "Llaves en recepción.", "Estacionamiento al fondo."][i % 3], ...marcas(origen) }));
    const flota = [["Furgón", "Peugeot", "Boxer", 3], ["Minibús", "Mercedes-Benz", "Sprinter", 15], ["Camión", "Hyundai", "Mighty", 3],
        ["Furgón", "Fiat", "Ducato", 3], ["Minibús", "Renault", "Master", 12], ["Camioneta", "Toyota", "Hilux", 5]];
    flota.forEach(([tipo, marca, modelo, capacidadPasajeros], i) => agregar("Vehiculo", {
        patente: "ZZTX" + (80 + i), tipo, marca, modelo, capacidadPasajeros, anio: 2017 + i,
        estado: i < 4 ? "DISPONIBLE" : i === 4 ? "EN_MANTENCION" : "RETIRADO", habilitado: i < 5, ...marcas(origen) }));
    return familiasIds;
}

// Los extras son líneas de cotización; el paquete de catálogo cubre coordinación.
function cotizarExtras(s, grupos, tipoId, asistentes) {
    const opcionesComida = { 1: 4, 2: 1, 3: 3, 4: 2, 5: 0, 6: 1, 7: 2, 8: 2, 9: 0, 10: 4, 11: 3, 12: 4 };
    const comida = grupos.comida[opcionesComida[tipoId]];
    const social = [1, 3, 4, 7, 8, 11].includes(tipoId);
    const recursos = [comida, s.elegir(grupos.audio), s.elegir(grupos.personal), s.elegir(social ? grupos.decoracion : grupos.video),
        s.elegir(social ? grupos.menaje : grupos.montaje)];
    if (s.entero(0, 1)) recursos.push(s.elegir(grupos.luces));
    if (tipoId === 9) recursos.push(grupos.mesas[3]);
    return recursos.map(r => {
        const cantidad = ["Copa de espumante", "Plato bajo de loza blanca", "Cubiertos de acero para cena"].includes(r.nombre)
            ? asistentes : r.stockTotal >= 24 ? Math.ceil(asistentes / 10) : 1;
        return { recursoId: r.id, nombreRecurso: r.nombre, tipoRecurso: r.tipo, cantidad,
            precioUnitario: r.precioUnitario, subtotal: r.precioUnitario * cantidad };
    });
}

module.exports = { inventario, cotizarExtras, recintos };
