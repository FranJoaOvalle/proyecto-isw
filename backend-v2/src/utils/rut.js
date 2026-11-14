const normalizarRut = (rut) =>
    rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase();

const calcularDv = (rut) => {
    let suma = 0;
    let multiplicador = 2;

    for (let i = rut.length - 1; i >= 0; i--) {
        suma += Number(rut[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);

    if (resto === 11) return "0";
    if (resto === 10) return "K";
    return String(resto);
};

const validarRut = (rutCompleto) => {
    const rut = normalizarRut(rutCompleto);

    if (!/^\d+-[\dK]$/.test(rut)) return false;

    const [numero, dv] = rut.split("-");
    return calcularDv(numero) === dv;
};

module.exports = {
    normalizarRut,
    validarRut
};