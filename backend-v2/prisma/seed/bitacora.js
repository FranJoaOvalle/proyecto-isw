// Observaciones de producción por línea de catálogo. Cada novedad tiene una
// respuesta de otro integrante del equipo y un registro posible durante la jornada.
module.exports = {
    matrimonio: {
        previas: [
            ["HITO", "MEDIA", "Los novios aprobaron el orden del cortejo. La última pareja entra con los anillos.", "Pasé la pauta al encargado de música."],
            ["OBSERVACION", "BAJA", "La florista necesita retirar las bases de los arreglos después de la cena.", "Le guardaremos las cajas en la entrada de servicio."]],
        cambio: "Los novios pidieron mover el libro de firmas al costado del cóctel.",
        enSala: "La familia ya está en la primera fila. El encargado de música tiene la señal de entrada."
    },
    graduacion: {
        previas: [
            ["INCIDENCIA", "ALTA", "Hay dos apellidos con distinto orden en los diplomas y la pauta de llamados.", "Secretaría revisará la nómina antes del ensayo."],
            ["HITO", "MEDIA", "La directiva confirmó que las fotos se harán por curso.", "Agregué el segundo llamado al libreto."]],
        cambio: "La comisión solicitó llamar primero al curso que vuelve en bus.",
        enSala: "Los diplomas están separados por curso. Hay una copia del orden de llamados en el atril."
    },
    cumpleanos: {
        previas: [
            ["NOVEDAD", "MEDIA", "La torta viene en dos pisos que se montan en el salón.", "Cocina dejó libre una mesa hasta que termine la pastelera."],
            ["OBSERVACION", "BAJA", "La familia traerá las sorpresas en cajas cerradas.", "Las recibirá la persona que arma la mesa de dulces."]],
        cambio: "Pidieron servir la torta antes de los juegos porque parte de la familia se retira temprano.",
        enSala: "La torta llegó fría y quedó guardada hasta el aviso de la familia."
    },
    aniversario: {
        previas: [
            ["NOVEDAD", "MEDIA", "El álbum familiar trae dos videos grabados en vertical.", "Quedó una copia de respaldo con los archivos originales."],
            ["OBSERVACION", "MEDIA", "El brindis lo harán dos personas desde sus mesas.", "Sonido puede llevar el micrófono por el pasillo central."]],
        cambio: "La familia quiere dejar el brindis para después de las palabras de bienvenida.",
        enSala: "Probamos el álbum en la pantalla del salón antes de recibir a los invitados."
    },
    jornada: {
        previas: [
            ["HITO", "MEDIA", "El relator envió las guías de trabajo por mesa.", "Quedó una copia extra para quienes se inscriban al llegar."],
            ["NOVEDAD", "BAJA", "El grupo de tarde necesita un espacio para guardar sus bolsos.", "Recepción habilitará el guardarropa lateral."]],
        cambio: "La coordinación pidió separar las mesas por turno para el trabajo de la tarde.",
        enSala: "Cada mesa recibió sus guías. Dejamos un ejemplar del programa junto a la lista de asistencia."
    },
    seminario: {
        previas: [
            ["INCIDENCIA", "ALTA", "El salón tiene una sola toma junto al podio y el relator necesita dos equipos.", "Montaje llevará una extensión y un pasacables."],
            ["HITO", "MEDIA", "Recibimos las diapositivas del panel. Falta sólo la lámina de créditos.", "Se puede reemplazar al hacer la prueba técnica."]],
        cambio: "La moderadora pidió reservar diez minutos del segundo bloque para preguntas del público.",
        enSala: "Se probó el retorno con el primer expositor. Las preguntas se reciben desde el pasillo."
    },
    cena: {
        previas: [
            ["OBSERVACION", "MEDIA", "La encargada de personal revisará con cocina las dietas especiales.", "Le reservamos quince minutos antes de la apertura."],
            ["NOVEDAD", "BAJA", "Los reconocimientos llegarán en cajas por departamento.", "Los recibiremos junto a la puerta del salón."]],
        cambio: "El encargado de la empresa pidió servir primero a la mesa que vuelve al turno de noche.",
        enSala: "Cocina y sala cotejaron los números de mesa antes de despachar el primer plato."
    },
    "fin-de-ano": {
        previas: [
            ["HITO", "MEDIA", "Están confirmados los horarios de vuelta de los buses.", "Los incluí en la pauta de la animadora."],
            ["OBSERVACION", "BAJA", "Hay premios que deben entregarse por turno y otros por sorteo.", "Van en bandejas separadas."]],
        cambio: "La comisión pidió dejar los premios de trayectoria para el último bloque.",
        enSala: "Los premios de cada turno quedaron en el orden de lectura de la animadora."
    },
    feria: {
        previas: [
            ["INCIDENCIA", "ALTA", "Dos expositores solicitaron el mismo puesto de esquina para sus vitrinas.", "Envié una segunda distribución con vista a ambos pasillos."],
            ["NOVEDAD", "MEDIA", "Llegarán cajas de mercadería antes que los encargados de los puestos.", "Van con el nombre del taller y el número de stand."]],
        cambio: "Los expositores solicitaron una franja de descarga separada del ingreso de público.",
        enSala: "Los puestos están numerados. Bodega conserva una copia del plano para recibir los bultos."
    },
    institucional: {
        previas: [
            ["OBSERVACION", "MEDIA", "Protocolo confirmará la precedencia al cierre de las inscripciones.", "Dejé los nombres en tarjetas sueltas para poder intercambiarlos."],
            ["HITO", "MEDIA", "Llegó el libreto con las intervenciones de las delegaciones.", "Entregué una copia al encargado del atril."]],
        cambio: "Protocolo pidió dejar dos asientos de pasillo para la delegación que llega al final.",
        enSala: "Recepción tiene la última nómina de las delegaciones y la distribución de la testera."
    },
    familiar: {
        previas: [
            ["NOVEDAD", "BAJA", "Dos familias traerán repostería en bandejas prestadas.", "Las etiquetaremos para devolverlas al terminar la once."],
            ["OBSERVACION", "MEDIA", "Los mayores prefieren sentarse lejos de los parlantes.", "La mesa larga quedará al otro lado del salón."]],
        cambio: "Pidieron una mesa cerca de la entrada para dejar los aportes de cada familia.",
        enSala: "Los aportes para la once quedaron separados de los platos que van directamente a las mesas."
    },
    lanzamiento: {
        previas: [
            ["HITO", "MEDIA", "Llegaron las fichas técnicas con los lotes de cada muestra.", "Las copias quedaron ordenadas por ronda de degustación."],
            ["NOVEDAD", "MEDIA", "Los distribuidores solicitaron una mesa para anotar pedidos al final de la cata.", "La ubicaremos fuera del recorrido de servicio."]],
        cambio: "El cliente pidió presentar la muestra de menor guarda en la primera ronda.",
        enSala: "Comparamos los códigos de las muestras con las fichas antes de servir."
    }
};
