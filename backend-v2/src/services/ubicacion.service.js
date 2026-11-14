const prisma = require("../config/prisma");
const ConflictException = require("../exceptions/ConflictException");
const NotFoundException = require("../exceptions/NotFoundException");

class UbicacionService {

    desdeEspacio(espacio, evento) {
        if (evento?.espacioId === espacio.id && evento.direccion) {
            return {
                espacioId: espacio.id,
                lugar: evento.lugar,
                direccion: evento.direccion,
                comuna: evento.comuna,
                referenciaDireccion: evento.referenciaDireccion
            };
        }
        return {
            espacioId: espacio.id,
            lugar: espacio.nombre,
            direccion: espacio.direccion,
            comuna: espacio.comuna ?? null,
            referenciaDireccion: null
        };
    }

    async preparar(actual, datos, cliente = prisma) {
        if (
            !["espacioId", "direccion", "comuna", "referenciaDireccion"].some(
                (campo) => Object.hasOwn(datos, campo)
            )
        ) {
            if (
                datos.lugar &&
                datos.lugar !== actual.lugar
            )
                throw new ConflictException(
                    "Utiliza el formulario de ubicación para cambiar el recinto del evento."
                );
            return datos;
        }
        const espacioId = Object.hasOwn(datos, "espacioId")
            ? datos.espacioId
            : actual.espacioId;
        if (espacioId == null) {
            throw new ConflictException("Selecciona un espacio registrado en Recursos → Espacios para asignar la ubicación.");
        }
        if (actual.solicitudId && actual.espacioId && espacioId !== actual.espacioId) {
            throw new ConflictException("El evento debe conservar el espacio de la propuesta contratada. Revisa el acuerdo comercial antes de cambiar de recinto.");
        }
        let lugar = datos.lugar ?? actual.lugar;
        let direccion = datos.direccion ?? actual.direccion;
        let comuna = datos.comuna ?? actual.comuna;
        if (espacioId != null) {
            const espacio = await cliente.espacio.findUnique({
                where: { id: espacioId }
            });
            if (!espacio) throw new NotFoundException("Espacio no encontrado.");
            const conservar =
                actual.espacioId === espacioId &&
                actual.direccion &&
                (!Object.hasOwn(datos, "direccion") ||
                    datos.direccion === actual.direccion) &&
                (!Object.hasOwn(datos, "lugar") ||
                    datos.lugar === actual.lugar);
            if (!espacio.habilitado && !conservar)
                throw new ConflictException("El espacio está deshabilitado.");
            if ((datos.asistentes ?? actual.asistentes) > espacio.capacidad)
                throw new ConflictException(
                    "La capacidad del espacio es menor a los asistentes del evento."
                );
            lugar = conservar ? actual.lugar : espacio.nombre;
            direccion = conservar ? actual.direccion : espacio.direccion;
            if (
                (datos.lugar && datos.lugar !== lugar) ||
                (datos.direccion && datos.direccion !== direccion)
            ) {
                throw new ConflictException(
                    "Los datos del recinto cambiaron. Vuelve a seleccionarlo antes de guardar."
                );
            }
            comuna =
                datos.comuna ?? (conservar ? actual.comuna : espacio.comuna);
            if (!conservar && espacio.comuna && comuna !== espacio.comuna)
                throw new ConflictException(
                    "La comuna debe corresponder al recinto seleccionado."
                );
        }
        if (
            !lugar?.trim() ||
            !direccion?.trim() ||
            !comuna?.trim() ||
            comuna.trim().length < 2 ||
            direccion.trim().length < 2
        ) {
            throw new ConflictException(
                "Indica el nombre del lugar, su dirección y comuna para confirmar la ubicación."
            );
        }
        return {
            ...datos,
            espacioId: espacioId ?? null,
            lugar: lugar.trim(),
            direccion: direccion.trim(),
            comuna: comuna.trim(),
            referenciaDireccion:
                (Object.hasOwn(datos, "referenciaDireccion")
                    ? datos.referenciaDireccion
                    : (espacioId ?? null) !== (actual.espacioId ?? null)
                      ? null
                      : actual.referenciaDireccion
                )?.trim() || null
        };
    }
}

module.exports = new UbicacionService();
