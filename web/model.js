"use strict";

const jscad = require("@jscad/modeling");
const { sphere, cylinder, cuboid } = jscad.primitives;
const { hull } = jscad.hulls;
const { subtract, union, intersect } = jscad.booleans;
const { translate, mirror, rotateY, rotateZ } = jscad.transforms;

function getParameterDefinitions() {
  return [
    { type: "group", caption: "Visibilidad", name: "visibilidad" },
    {
      name: "modoVisibilidad",
      type: "choice",
      caption: "Pieza a mostrar",
      values: [0, 1, 2, 3, 4],
      captions: [
        "Todas",
        "Hembra Superior",
        "Macho Superior",
        "Macho Inferior",
        "Hembra Inferior",
      ],
      initial: 0,
    },

    { type: "group", caption: "Geometría Base", name: "geometria" },
    {
      name: "diametroBase",
      type: "float",
      initial: 220,
      caption: "Diámetro Base",
      min: 50,
      max: 500,
      step: 5,
    },
    {
      name: "diametroSuperior",
      type: "float",
      initial: 20,
      caption: "Diámetro Superior",
      min: 5,
      max: 400,
      step: 5,
    },
    {
      name: "altura",
      type: "float",
      initial: 95,
      caption: "Altura",
      min: 20,
      max: 500,
      step: 5,
    },
    {
      name: "segmentosBase",
      type: "int",
      initial: 6,
      caption: "Segmentos Base",
      min: 4,
      max: 12,
      step: 1,
    },
    {
      name: "diametroRedondeoArriba",
      type: "float",
      initial: 40,
      caption: "Redondeo",
      min: 10,
      max: 200,
      step: 5,
    },

    { type: "group", caption: "Bandeja", name: "bandeja" },
    {
      name: "alturaBandeja",
      type: "float",
      initial: 20,
      caption: "Altura Bandeja",
      min: 10,
      max: 150,
      step: 5,
    },
    {
      name: "anguloDesmoldeoBandeja",
      type: "float",
      initial: 50,
      caption: "Ángulo Desmoldeo (°)",
      min: 0,
      max: 60,
      step: 1,
    },
    {
      name: "diametroRedondeoBandeja",
      type: "float",
      initial: 20,
      caption: "Redondeo Bandeja",
      min: 10,
      max: 150,
      step: 5,
    },

    { type: "group", caption: "Paredes", name: "paredes" },
    {
      name: "grosorPared",
      type: "float",
      initial: 2,
      caption: "Grosor Pared",
      min: 2,
      max: 30,
      step: 1,
    },
    {
      name: "grosorPapel",
      type: "float",
      initial: 2,
      caption: "Grosor Papel",
      min: 1,
      max: 10,
      step: 0.5,
    },

    { type: "group", caption: "Drenaje", name: "drenaje" },
    {
      name: "distanciaEntreAgujeros",
      type: "float",
      initial: 10,
      caption: "Dist. entre Agujeros",
      min: 5,
      max: 60,
      step: 5,
    },
    {
      name: "diametroAgujerito",
      type: "float",
      initial: 2,
      caption: "Diámetro Agujero",
      min: 1,
      max: 10,
      step: 0.5,
    },

    { type: "group", caption: "Soportes", name: "soportes" },
    {
      name: "distanciaSoporte",
      type: "float",
      initial: 20,
      caption: "Dist. entre Soportes",
      min: 10,
      max: 80,
      step: 5,
    },
    {
      name: "grosorSoporte",
      type: "float",
      initial: 1,
      caption: "Grosor Soporte",
      min: 2,
      max: 15,
      step: 0.5,
    },

    { type: "group", caption: "Separación Z", name: "separacion" },
    {
      name: "separacionHembrasZ",
      type: "float",
      initial: 150,
      caption: "Separación Hembras Z",
      min: 50,
      max: 400,
      step: 10,
    },
    {
      name: "separacionMachosZ",
      type: "float",
      initial: 30,
      caption: "Separación Machos Z",
      min: 10,
      max: 200,
      step: 5,
    },
  ];
}

function main(params) {
  const c = {
    modoVisibilidad: params.modoVisibilidad || 0,
    diametroBase: params.diametroBase || 440,
    diametroSuperior: params.diametroSuperior || 80,
    altura: params.altura || 190,
    segmentosBase: params.segmentosBase || 6,
    diametroRedondeoArriba: params.diametroRedondeoArriba || 80,
    alturaBandeja: params.alturaBandeja || 40,
    anguloDesmoldeoBandeja: params.anguloDesmoldeoBandeja || 50,
    diametroRedondeoBandeja: params.diametroRedondeoBandeja || 40,
    resolucion: params.resolucion || 32,
    grosorPared: params.grosorPared || 10,
    grosorPapel: params.grosorPapel || 3,
    distanciaEntreAgujeros: params.distanciaEntreAgujeros || 25,
    diametroAgujerito: params.diametroAgujerito || 3,
    distanciaSoporte: params.distanciaSoporte || 40,
    grosorSoporte: params.grosorSoporte || 3,
    separacionHembrasZ: params.separacionHembrasZ || 150,
    separacionMachosZ: params.separacionMachosZ || 30,
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
    const segSup = mantenerSegmentos ? c.segmentosBase : c.segmentosBase - 1;

    for (let i = 0; i < c.segmentosBase; i++) {
      const ang = (Math.PI * 2 * i) / c.segmentosBase;
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
          segments: c.resolucion,
        }),
      );
    }
    return hull(puntosYEsferas);
  };

  const generarMatrizDrenaje = (diamB, diamS, alt, diamRed) => {
    const agujeros = [];
    const rB = diamB / 2;
    const rS = diamS / 2;
    const r_ag = c.diametroAgujerito / 2;

    const inclinacion = Math.atan2(rB - rS, alt);
    const rotacionPerpendicular = Math.PI / 2 - inclinacion;

    for (
      let z = c.distanciaEntreAgujeros / 2;
      z <= alt + diamRed / 2;
      z += c.distanciaEntreAgujeros
    ) {
      let r = rB - (rB - rS) * (z / alt);
      if (r < rS) r = rS;

      const perimetro = 2 * Math.PI * r;
      const numAgujeros = Math.max(
        1,
        Math.floor(perimetro / c.distanciaEntreAgujeros),
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

    for (let x = -rS; x <= rS; x += c.distanciaEntreAgujeros) {
      for (let y = -rS; y <= rS; y += c.distanciaEntreAgujeros) {
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

  const anguloRad = c.anguloDesmoldeoBandeja * (Math.PI / 180);
  const reduccionRadio = c.alturaBandeja * Math.tan(anguloRad);
  const diametroBandejaCalc = Math.max(
    0.1,
    c.diametroBase - 2 * reduccionRadio,
  );

  const doblePared = c.grosorPared * 2;
  const doblePapel = c.grosorPapel * 2;
  const diametroMachoExt = c.diametroBase - doblePared - doblePapel;

  const matrizDrenajeTop = generarMatrizDrenaje(
    c.diametroBase,
    c.diametroSuperior,
    c.altura,
    c.diametroRedondeoArriba,
  );
  const matrizDrenajeBot = generarMatrizDrenaje(
    c.diametroBase,
    diametroBandejaCalc,
    c.alturaBandeja,
    c.diametroRedondeoBandeja,
  );

  const hembraExterior = generarFormaBase(
    c.diametroBase,
    c.diametroSuperior,
    c.altura,
    c.diametroRedondeoArriba,
  );
  const hembraInterior = generarFormaBase(
    c.diametroBase - doblePared,
    Math.max(0.1, c.diametroSuperior - doblePared),
    c.altura - c.grosorPared,
    Math.max(0.1, c.diametroRedondeoArriba - doblePared),
  );

  let hembraTop = subtract(
    hembraExterior,
    translate([0, 0, -1], hembraInterior),
  );
  hembraTop = subtract(hembraTop, matrizDrenajeTop);

  const alturaMacho = c.altura - c.grosorPared - c.grosorPapel;
  const diamMachoSupExt = Math.max(
    0.1,
    c.diametroSuperior - doblePared - doblePapel,
  );
  const diamRedondeoMacho = Math.max(
    0.1,
    c.diametroRedondeoArriba - doblePared - doblePapel,
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
    alturaMacho - c.grosorPared,
    Math.max(0.1, diamRedondeoMacho - doblePared),
  );

  let machoTop = subtract(
    machoExterior,
    translate([0, 0, -1], machoInteriorVacio),
  );
  machoTop = subtract(machoTop, matrizDrenajeTop);

  const nervios = [];
  const radioBaseCalc = c.diametroBase / 2;
  for (
    let pos = -radioBaseCalc;
    pos <= radioBaseCalc;
    pos += c.distanciaSoporte
  ) {
    nervios.push(
      cuboid({
        size: [c.grosorSoporte, c.diametroBase * 1.5, c.altura * 2],
        center: [pos, 0, c.altura / 2],
      }),
    );
    nervios.push(
      cuboid({
        size: [c.diametroBase * 1.5, c.grosorSoporte, c.altura * 2],
        center: [0, pos, c.altura / 2],
      }),
    );
  }
  const soporteInterno = intersect(union(nervios), machoInteriorVacio);
  machoTop = union(machoTop, soporteInterno);

  const hembraBExt = generarFormaBase(
    c.diametroBase,
    diametroBandejaCalc,
    c.alturaBandeja,
    c.diametroRedondeoBandeja,
    true,
  );
  const hembraBInt = generarFormaBase(
    c.diametroBase - doblePared,
    Math.max(0.1, diametroBandejaCalc - doblePared),
    c.alturaBandeja - c.grosorPared,
    Math.max(0.1, c.diametroRedondeoBandeja - doblePared),
    true,
  );

  let hembraBot = subtract(hembraBExt, translate([0, 0, -1], hembraBInt));
  hembraBot = subtract(hembraBot, matrizDrenajeBot);
  hembraBot = mirror({ normal: [0, 0, 1] }, hembraBot);

  const alturaMachoB = c.alturaBandeja - c.grosorPared - c.grosorPapel;
  const diamMachoSupExtB = Math.max(
    0.1,
    diametroBandejaCalc - doblePared - doblePapel,
  );
  const diamRedondeoMachoB = Math.max(
    0.1,
    c.diametroRedondeoBandeja - doblePared - doblePapel,
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
    alturaMachoB - c.grosorPared,
    Math.max(0.1, diamRedondeoMachoB - doblePared),
    true,
  );

  let machoBot = subtract(machoBExt, translate([0, 0, -1], machoBInt));
  machoBot = subtract(machoBot, matrizDrenajeBot);
  machoBot = mirror({ normal: [0, 0, 1] }, machoBot);

  switch (c.modoVisibilidad) {
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
        translate([0, 0, c.separacionHembrasZ], hembraTop),
        translate([0, 0, c.separacionMachosZ], machoTop),
        translate([0, 0, -c.separacionMachosZ], machoBot),
        translate([0, 0, -c.separacionHembrasZ], hembraBot),
      ];
  }
}

module.exports = { main, getParameterDefinitions };
