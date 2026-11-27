// Cada etapa representa una pauta que gerencia utilizó durante parte del historial.
module.exports = [
    ["Recepción y cierre", "CLIENTE_EVENTO", false, "Primera pauta usada por el equipo de atención.",
        [["ESCALA", "¿Cómo resultó el ingreso al recinto?"], ["SI_NO", "¿Encontró al encargado a su llegada?"], ["TEXTO", "¿Qué habría facilitado la llegada?", false]]],
    ["Celebraciones y banquetería", "CLIENTE_EVENTO", true, "Para la persona que coordinó el comedor o la recepción.",
        [["ESCALA", "¿Qué nota le pondría al ritmo del servicio?"], ["SELECCION_UNICA", "¿Cuándo se sirvió la comida?", true, ["A la hora acordada", "Antes de lo previsto", "Con atraso"]],
         ["SELECCION_MULTIPLE", "¿Qué aspectos revisó con el equipo?", false, ["Menús especiales", "Distribución de mesas", "Hora del brindis"]]]],
    ["Balance de la producción", "CLIENTE_EVENTO", true, "Cuéntenos qué pasó en sala y qué conviene ajustar para el próximo encargo.",
        [["ESCALA", "¿Cómo calificaría la coordinación en terreno?"], ["SI_NO", "¿Tuvo un contacto disponible durante el evento?"],
         ["SELECCION_UNICA", "¿Cómo se resolvieron sus consultas?", true, ["En el momento", "Después de insistir", "Quedaron pendientes"]],
         ["SELECCION_MULTIPLE", "¿En qué etapas participó directamente?", false, ["Preparación", "Recepción", "Cierre"]],
         ["TEXTO", "¿Qué le gustaría que supiera el equipo?", false]]],
    ["Revisión de turno", "ADMIN_PRODUCTOR", false, "Ficha de supervisión anterior a la revisión técnica.",
        [["ESCALA", "¿Cómo se organizó el relevo del turno?"], ["SI_NO", "¿Quedó constancia de la entrega de llaves?"]]],
    ["Supervisión de escenario", "ADMIN_PRODUCTOR", true, "Para jornadas con amplificación, tarima o intervenciones en sala.",
        [["ESCALA", "¿Cómo respondió el productor ante ajustes de pauta?"], ["SELECCION_MULTIPLE", "¿Qué respaldos quedaron listos antes del ingreso?", true, ["Audio de reserva", "Copia de presentaciones", "Micrófono de repuesto"]],
         ["TEXTO", "Registre un hallazgo del turno.", false]]],
    ["Evaluación de producción en terreno", "ADMIN_PRODUCTOR", true, "Balance del administrador responsable del contrato.",
        [["ESCALA", "¿Cómo administró el productor los tiempos de montaje?"], ["SI_NO", "¿Verificó los recursos al cierre?"],
         ["SELECCION_UNICA", "¿Cuánta supervisión necesitó en sala?", true, ["Trabajó con autonomía", "Una revisión puntual", "Apoyo permanente"]],
         ["TEXTO", "Describa una decisión que afectó al equipo.", false]]]
];
