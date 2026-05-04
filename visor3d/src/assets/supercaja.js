import { primitives, hulls, booleans, transforms } from "@jscad/modeling";

const { sphere, cylinder, cuboid } = primitives;
const { hull } = hulls;
const { subtract, union, intersect } = booleans;
const { translate, mirror, rotateY, rotateZ } = transforms;

const config = {
  modoVisibilidad: 4,

  // --- GEOMETRÍA (DIÁMETROS) ---
  diametroBase: 440,
  diametroSuperior: 80,
  altura: 190,
  segmentosBase: 6,
  diametroRedondeoArriba: 80,

  alturaBandeja: 40,

  // --- NUEVO: ÁNGULO DE DESMOLDEO (En grados) ---
  // 0 = Recto. Entre 5 y 15 es estándar para pulpa.
  anguloDesmoldeoBandeja: 45,

  diametroRedondeoBandeja: 70,

  resolucion: 32,
  grosorPared: 10,
  grosorPapel: 3,

  distanciaEntreAgujeros: 40,
  diametroAgujerito: 6,

  distanciaSoporte: 40,
  grosorSoporte: 3,

  separacionHembrasZ: 150,
  separacionMachosZ: 30,
};

const generarFormaBase = (
  diamB,
  diamS,
  alt,
  diamRed,
  mantenerSegmentos = false,
) => {
  const puntosYEsferas = [];
  const rB = diamB / 2;
  const rS = diamS / 2;
  const rRed = diamRed / 2;
  const segSup = mantenerSegmentos
    ? config.segmentosBase
    : config.segmentosBase - 1;

  for (let i = 0; i < config.segmentosBase; i++) {
    const ang = (Math.PI * 2 * i) / config.segmentosBase;
    puntosYEsferas.push(
      sphere({
        radius: 0.1,
        center: [Math.cos(ang) * rB, Math.sin(ang) * rB, 0],
        segments: 8,
      }),
    );
  }

  for (let i = 0; i < segSup; i++) {
    const ang = (Math.PI * 2 * i) / segSup;
    puntosYEsferas.push(
      sphere({
        radius: rRed,
        center: [Math.cos(ang) * rS, Math.sin(ang) * rS, alt],
        segments: config.resolucion,
      }),
    );
  }
  return hull(puntosYEsferas);
};

const generarMatrizDrenaje = (diamB, diamS, alt, diamRed) => {
  const agujeros = [];
  const rB = diamB / 2;
  const rS = diamS / 2;
  const r_ag = config.diametroAgujerito / 2;

  const inclinacion = Math.atan2(rB - rS, alt);
  const rotacionPerpendicular = Math.PI / 2 - inclinacion;

  for (
    let z = config.distanciaEntreAgujeros / 2;
    z <= alt + diamRed / 2;
    z += config.distanciaEntreAgujeros
  ) {
    let r = rB - (rB - rS) * (z / alt);
    if (r < rS) r = rS;

    const perimetro = 2 * Math.PI * r;
    const numAgujeros = Math.max(
      1,
      Math.floor(perimetro / config.distanciaEntreAgujeros),
    );

    for (let i = 0; i < numAgujeros; i++) {
      const ang = (Math.PI * 2 * i) / numAgujeros;
      let cyl = cylinder({
        center: [0, 0, 0],
        height: 100,
        radius: r_ag,
        segments: 6,
      });
      cyl = rotateY(rotacionPerpendicular, cyl);
      cyl = rotateZ(ang, cyl);
      cyl = translate([r * Math.cos(ang), r * Math.sin(ang), z], cyl);
      agujeros.push(cyl);
    }
  }

  for (let x = -rS; x <= rS; x += config.distanciaEntreAgujeros) {
    for (let y = -rS; y <= rS; y += config.distanciaEntreAgujeros) {
      if (Math.sqrt(x * x + y * y) < rS) {
        agujeros.push(
          cylinder({
            center: [x, y, alt],
            height: 100,
            radius: r_ag,
            segments: 6,
          }),
        );
      }
    }
  }
  return union(agujeros);
};

export const main = () => {
  // --- 1. CÁLCULO TRIGONOMÉTRICO DEL DIÁMETRO DE LA BANDEJA ---
  // Pasamos los grados a radianes
  const anguloRad = config.anguloDesmoldeoBandeja * (Math.PI / 180);
  // Calculamos cuánto se encoge el radio usando la tangente
  const reduccionRadio = config.alturaBandeja * Math.tan(anguloRad);
  // Calculamos el diámetro final (Math.max evita que el diámetro colapse a números negativos)
  const diametroBandejaCalc = Math.max(
    0.1,
    config.diametroBase - 2 * reduccionRadio,
  );

  const doblePared = config.grosorPared * 2;
  const doblePapel = config.grosorPapel * 2;
  const diametroMachoExt = config.diametroBase - doblePared - doblePapel;

  const matrizDrenajeTop = generarMatrizDrenaje(
    config.diametroBase,
    config.diametroSuperior,
    config.altura,
    config.diametroRedondeoArriba,
  );
  const matrizDrenajeBot = generarMatrizDrenaje(
    config.diametroBase,
    diametroBandejaCalc,
    config.alturaBandeja,
    config.diametroRedondeoBandeja,
  );

  // =========================================================
  // --- PARTE SUPERIOR (MOLDE ORIGINAL CON NERVIOS) ---
  // =========================================================
  const hembraExterior = generarFormaBase(
    config.diametroBase,
    config.diametroSuperior,
    config.altura,
    config.diametroRedondeoArriba,
  );
  const hembraInterior = generarFormaBase(
    config.diametroBase - doblePared,
    Math.max(0.1, config.diametroSuperior - doblePared),
    config.altura - config.grosorPared,
    Math.max(0.1, config.diametroRedondeoArriba - doblePared),
  );

  let hembraTop = subtract(
    hembraExterior,
    translate([0, 0, -1], hembraInterior),
  );
  hembraTop = subtract(hembraTop, matrizDrenajeTop);

  const alturaMacho = config.altura - config.grosorPared - config.grosorPapel;
  const diamMachoSupExt = Math.max(
    0.1,
    config.diametroSuperior - doblePared - doblePapel,
  );
  const diamRedondeoMacho = Math.max(
    0.1,
    config.diametroRedondeoArriba - doblePared - doblePapel,
  );

  const machoExterior = generarFormaBase(
    diametroMachoExt,
    diamMachoSupExt,
    alturaMacho,
    diamRedondeoMacho,
  );
  const machoInteriorVacio = generarFormaBase(
    diametroMachoExt - doblePared,
    Math.max(0.1, diamMachoSupExt - doblePared),
    alturaMacho - config.grosorPared,
    Math.max(0.1, diamRedondeoMacho - doblePared),
  );

  let machoTop = subtract(
    machoExterior,
    translate([0, 0, -1], machoInteriorVacio),
  );
  machoTop = subtract(machoTop, matrizDrenajeTop);

  const nervios = [];
  const radioBaseCalc = config.diametroBase / 2;
  for (
    let pos = -radioBaseCalc;
    pos <= radioBaseCalc;
    pos += config.distanciaSoporte
  ) {
    nervios.push(
      cuboid({
        size: [
          config.grosorSoporte,
          config.diametroBase * 1.5,
          config.altura * 2,
        ],
        center: [pos, 0, config.altura / 2],
      }),
    );
    nervios.push(
      cuboid({
        size: [
          config.diametroBase * 1.5,
          config.grosorSoporte,
          config.altura * 2,
        ],
        center: [0, pos, config.altura / 2],
      }),
    );
  }
  const soporteInterno = intersect(union(nervios), machoInteriorVacio);
  machoTop = union(machoTop, soporteInterno);

  // =========================================================
  // --- PARTE INFERIOR (BANDEJA ESPEJADA, USA EL NUEVO DIÁMETRO CALCULADO) ---
  // =========================================================
  const hembraBExt = generarFormaBase(
    config.diametroBase,
    diametroBandejaCalc,
    config.alturaBandeja,
    config.diametroRedondeoBandeja,
    true,
  );
  const hembraBInt = generarFormaBase(
    config.diametroBase - doblePared,
    Math.max(0.1, diametroBandejaCalc - doblePared),
    config.alturaBandeja - config.grosorPared,
    Math.max(0.1, config.diametroRedondeoBandeja - doblePared),
    true,
  );

  let hembraBot = subtract(hembraBExt, translate([0, 0, -1], hembraBInt));
  hembraBot = subtract(hembraBot, matrizDrenajeBot);
  hembraBot = mirror({ normal: [0, 0, 1] }, hembraBot);

  const alturaMachoB =
    config.alturaBandeja - config.grosorPared - config.grosorPapel;
  const diamMachoSupExtB = Math.max(
    0.1,
    diametroBandejaCalc - doblePared - doblePapel,
  );
  const diamRedondeoMachoB = Math.max(
    0.1,
    config.diametroRedondeoBandeja - doblePared - doblePapel,
  );

  const machoBExt = generarFormaBase(
    diametroMachoExt,
    diamMachoSupExtB,
    alturaMachoB,
    diamRedondeoMachoB,
    true,
  );
  const machoBInt = generarFormaBase(
    diametroMachoExt - doblePared,
    Math.max(0.1, diamMachoSupExtB - doblePared),
    alturaMachoB - config.grosorPared,
    Math.max(0.1, diamRedondeoMachoB - doblePared),
    true,
  );

  let machoBot = subtract(machoBExt, translate([0, 0, -1], machoBInt));
  machoBot = subtract(machoBot, matrizDrenajeBot);
  machoBot = mirror({ normal: [0, 0, 1] }, machoBot);

  // =========================================================
  // --- SELECTOR DE VISIBILIDAD / EXPORTACIÓN ---
  // =========================================================
  switch (config.modoVisibilidad) {
    case 1:
      return hembraTop;
    case 2:
      return machoTop;
    case 3:
      return machoBot;
    case 4:
      return hembraBot;
    default:
      return [
        translate([0, 0, config.separacionHembrasZ], hembraTop),
        translate([0, 0, config.separacionMachosZ], machoTop),
        translate([0, 0, -config.separacionMachosZ], machoBot),
        translate([0, 0, -config.separacionHembrasZ], hembraBot),
      ];
  }
};
