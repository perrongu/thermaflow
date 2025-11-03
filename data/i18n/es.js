// Diccionario ES (solo UI)
(function() {
  'use strict';

  window.I18N_ES = Object.freeze({
    lang: 'es',
    app: {
      title: '❄️ ThermaFlow',
      subtitle: 'Detección de riesgo de congelación en tuberías de agua'
    },
    header: { langAria: 'Idioma' },
    diagram: {
      water: 'AGUA',
      air: 'AIRE',
      temperature: 'Temperatura (°C):',
      pressure: 'Presión (kPag):',
      flowRate: 'Caudal (m³/hr):',
      windSpeed: 'Velocidad del viento (km/h):'
    },
    units: {
      flowRate: {
        m3_h: 'm³/h',
        usgpm: 'USGPM'
      },
      pressure: {
        kPag: 'kPag',
        psig: 'psig'
      }
    },
    controls: {
      material: 'MATERIAL:',
      schedule: 'SCHEDULE:',
      type: 'TIPO:',
      nps: 'NPS:'
    },
    insulation: {
      sectionTitle: '🧤 Aislamiento (opcional)',
      checkbox: 'La tubería está aislada',
      materialLabel: 'Material de aislamiento',
      thicknessLabel: 'Espesor (mm)',
      materials: {
        fiberglass: 'Fibra de vidrio',
        rockwool: 'Lana mineral',
        foam: 'Espuma de poliuretano',
        polystyrene: 'Poliestireno extruido (XPS)',
        elastomeric: 'Espuma elastomérica'
      }
    },
    sections: {
      s1: '1. Parámetros y resultados',
      s2: '2. Análisis de sensibilidad',
      s21: '2.1 Análisis paramétrico (gráficos tornado)',
      s22: '2.2 Análisis combinado (heatmap 2D)',
      s3: '3. Explicación de los cálculos',
      toggleDetails: 'Mostrar detalles técnicos'
    },
    configSummary: {
      title: 'Configuración analizada',
      pipe: 'Tubería',
      pipeMaterial: 'Material:',
      pipeSpec: 'Especificación:',
      pipeLength: 'Longitud:',
      water: 'Agua',
      waterTemp: 'Temperatura:',
      waterFlow: 'Caudal:',
      waterPressure: 'Presión:',
      air: 'Aire ambiente',
      airTemp: 'Temperatura:',
      wind: 'Velocidad del viento:',
      insulation: 'Aislamiento',
      insulationType: 'Tipo:',
      insulationThickness: 'Espesor:',
      none: 'Ninguno'
    },
    chart: {
      title: '📊 Perfil de temperatura',
      legendSafe: 'Seguro (≥ 5°C)',
      legendUnder: 'Bajo el margen (0-5°C)',
      legendFreeze: 'Riesgo de congelación (≤ 0°C)',
      legendInvalid: 'Inválido (fuera de rango físico)',
      axisPosition: 'Posición (m)',
      axisTemperature: 'Temperatura (°C)',
      freezeLine: 'Congelación',
      safetyLine: 'Umbral de seguridad',
      freezeBadge: 'CONGELACIÓN',
      legendTitle: 'Leyenda:'
    },
    results: {
      thermalTitle: '🌡️ Resultados térmicos',
      hydraulicTitle: '⚙️ Resultados hidráulicos',
      tempFinal: 'Temperatura final',
      tempMin: 'Temperatura mínima',
      margin: 'Margen hasta congelación',
      heatLoss: 'Pérdida total de calor',
      regime: 'Régimen de flujo',
      reynolds: 'Número de Reynolds',
      pressureDrop: 'Pérdida de presión',
      velocity: 'Velocidad media'
    },
    sensitivity: {
      interpTitle: '📖 Interpretación',
      interp1: 'Análisis individual: Cada gráfico muestra el impacto de un único parámetro en todo su rango, ',
      interp2: 'con los demás parámetros fijos en sus valores actuales. ',
      interp3: 'Permite identificar los parámetros que más influyen en el riesgo de congelación.',
      legendBase: 'Valor base (actual)',
      legendFreeze: 'Punto crítico de congelación (0°C)',
      legendSafety: 'Umbral de seguridad (5°C)',
      legendLimit: 'Límites del rango del parámetro',
      interp2d1: 'Análisis combinado: El mapa de calor muestra el rango completo de resultados posibles ',
      interp2d2: 'cuando dos parámetros varían simultáneamente en todo su espectro, ',
      interp2d3: 'con los demás fijos. Identifica combinaciones críticas y márgenes de seguridad.',
      paramX: 'Parámetro X',
      paramY: 'Parámetro Y',
      min: 'Mín',
      max: 'Máx',
      to: 'a',
      truncatedRange: 'Rango truncado para legibilidad',
      truncatedDetail: 'Centrado en valores importantes',
      effectiveRange: 'Rango efectivo',
      theoreticalRange: 'Rango teórico',
      exceedsLimits: 'excede límites físicos'
    },
    diagram: {
      water: 'AGUA',
      air: 'AIRE',
      temperature: 'Temperatura (°C):',
      pressure: 'Presión (kPag):',
      flowRate: 'Caudal (m³/hr):',
      windSpeed: 'Velocidad del Viento (km/h):'
    },
    calcDetails: {
      introText: 'Esta sección detalla la metodología de cálculo permitiendo a un ingeniero validar el rigor de los resultados obtenidos.',
      methodology: {
        title: '📋 Resumen de la Metodología',
        pipe: 'La tubería de',
        divided: 'se divide en',
        segments: 'segmentos',
        of: 'de',
        each: 'm cada uno. Para cada segmento, el cálculo sigue 6 pasos secuenciales:',
        note: 'Nota:',
        noteText: 'La temperatura de salida de un segmento se convierte en la temperatura de entrada del siguiente, permitiendo seguir la evolución térmica a lo largo de la tubería.',
        step1Title: 'Propiedades de los Fluidos',
        step1Desc: 'Interpolación en tablas IAPWS-97 (agua) y correlaciones estándar (aire)',
        step2Title: 'Hidráulica',
        step2Desc: 'Reynolds, factor de fricción, caída de presión (Darcy-Weisbach)',
        step3Title: 'Transferencia Interna',
        step3Desc: 'Nusselt y coeficiente de convección agua → pared',
        step4Title: 'Transferencia Externa',
        step4Desc: 'Convección (forzada/natural) + radiación pared → aire',
        step5Title: 'Resistencias Térmicas',
        step5Desc: 'Suma de resistencias en serie, coeficiente UA global',
        step6Title: 'Método NTU',
        step6Desc: 'Cálculo de temperatura de salida y pérdida de calor del segmento'
      },
      example: {
        title: '🔬 Ejemplo Detallado: Segmento',
        position: 'Posición:',
        note: 'Los segmentos siguientes',
        noteText: 'utilizan la misma metodología con sus propias condiciones de entrada. Consulte la tabla resumen al final de la página para sus resultados.'
      },
      step1: {
        title: 'Paso 1: Propiedades de los Fluidos',
        water: {
          title: '1.1 Agua (interpolación tablas IAPWS-97)',
          inputValues: 'Valores de entrada:',
          avgTemp: 'Temperatura promedio: T =',
          pressure: 'Presión: P =',
          interpolation: 'Interpolación lineal 2D en las tablas IAPWS-97:',
          result: '→ Propiedades del agua a',
          source: 'Fuente: Tablas IAPWS-97 (Wagner & Pruß, 2002) - data/fluids/water-tables.js'
        },
        air: {
          title: '1.2 Aire ambiente',
          inputValue: 'Valor de entrada:',
          ambTemp: 'Temperatura ambiente: T',
          interpolation: 'Interpolación lineal en las tablas de aire:',
          result: '→ Propiedades del aire a',
          source: 'Fuente: Correlaciones estándar de aire - data/fluids/air-tables.js'
        }
      },
      step2: {
        title: 'Paso 2: Hidráulica',
        velocity: {
          title: '2.1 Velocidad de Flujo',
          inputValues: 'Valores de entrada:',
          massFlow: 'Caudal másico: ṁ =',
          density: 'Densidad: ρ =',
          diameter: 'Diámetro interior: D =',
          volumeFlow: 'Caudal volumétrico:',
          crossSection: 'Sección transversal:',
          avgVelocity: 'Velocidad promedio:',
          result: '→ Velocidad de flujo: V =',
          source: 'Fuente: Ecuación de continuidad - js/formulas/geometry.js'
        },
        reynolds: {
          title: '2.2 Número de Reynolds',
          result: '→ Re =',
          regime: 'Régimen',
          turbulent: 'turbulento',
          laminar: 'laminar',
          condition: '(Re > 4000)',
          source: 'Fuente: Perry\'s Section 6-3 - js/formulas/reynolds.js'
        },
        friction: {
          title: '2.3 Factor de Fricción',
          roughness: 'Rugosidad relativa: ε/D =',
          laminarFlow: 'Flujo laminar (Re < 2300):',
          correlation: 'Correlación de Churchill (turbulento, explícito):',
          note: 'Nota: Ecuación de Churchill resuelta explícitamente en función de Re y ε/D',
          result: '→ Factor de fricción de Darcy: f =',
          source: 'Fuente: Churchill (1977) - Perry\'s Section 6-7 - js/correlations/friction-factor.js'
        },
        pressureDrop: {
          title: '2.4 Caída de Presión',
          segmentLength: 'Longitud del segmento: L =',
          equation: 'Ecuación de Darcy-Weisbach:',
          result: '→ Caída de presión: ΔP =',
          source: 'Fuente: Darcy-Weisbach - Perry\'s Section 6-4 - js/formulas/pressure-basic.js'
        }
      },
      step3: {
        title: 'Paso 3: Transferencia de Calor Interna (agua → pared)',
        prandtl: {
          title: '3.1 Número de Prandtl (agua)',
          result: '→ Número de Prandtl del agua: Pr ='
        },
        nusselt: {
          title: '3.2 Número de Nusselt (convección interna)',
          correlation: 'Correlación: Dittus-Boelter (turbulento)',
          result: '→ Número de Nusselt interno: Nu =',
          source: 'Fuente: Perry\'s Section 5-12 - js/correlations/nusselt-internal.js'
        },
        coefficient: {
          title: '3.3 Coeficiente de Convección Interna',
          result: '→ Coeficiente de convección interna: h',
          source: 'Fuente calculado a partir del número de Nusselt'
        },
        correlations: {
          hausen: 'Hausen (laminar con efecto de entrada)',
          dittusBoelter: 'Dittus-Boelter (turbulento)',
          gnielinski: 'Gnielinski (turbulento, 3000 < Re < 5×10⁶)'
        }
      },
      step4: {
        title: 'Paso 4: Transferencia de Calor Externa (pared → aire)',
        convection: {
          title: '4.1 Convección Externa (forzada - viento)',
          outerDiameter: 'Diámetro exterior: D',
          windSpeed: 'Velocidad del viento: V',
          forcedConvection: 'Convección forzada (Churchill-Bernstein)',
          reynoldsAir: 'Reynolds aire:',
          correlation: 'Correlación de Churchill-Bernstein para cilindro en flujo cruzado',
          calculated: 'calculado mediante correlaciones establecidas',
          result: '→ Coeficiente de convección externa: h',
          source: 'Fuente: Churchill-Bernstein (1977) - js/correlations/nusselt-external.js',
          naturalConvection: 'Convección natural (cilindro horizontal)',
          rayleighCorrelation: 'Número de Rayleigh luego correlación de convección natural'
        },
        radiation: {
          title: '4.2 Radiación',
          emissivity: 'Emisividad steel: ε =',
          stefanBoltzmann: 'Constante Stefan-Boltzmann: σ =',
          linearized: 'Coeficiente de radiación linealizado:',
          surfaceTemp: 'Con T',
          surfaceTempNote: '≈ temperatura superficial estimada',
          result: '→ Coeficiente de radiación: h',
          source: 'Fuente: Ley de Stefan-Boltzmann - js/correlations/radiation.js'
        },
        total: {
          title: '4.3 Coeficiente Externo Total',
          result: '→ Coeficiente externo total: h'
        }
      },
      step5: {
        title: 'Paso 5: Resistencias Térmicas',
        series: {
          title: '5.1 Resistencias en Serie',
          convInternal: '(convección interna):',
          condPipe: '(conducción pared steel):',
          condInsulation: '(conducción aislamiento',
          convExternal: '(convección externa + radiación):'
        },
        total: {
          title: '5.2 Resistencia Total',
          result: '→ Resistencia térmica total: R'
        },
        ua: {
          title: '5.3 Coeficiente UA Global',
          result: '→ Coeficiente UA:',
          source: 'Fuente: Resistencias en serie - js/calculations/thermal-resistance.js'
        }
      },
      step6: {
        title: 'Paso 6: Método NTU (temperatura de salida)',
        ntu: {
          title: '6.1 Número de Unidades de Transferencia (NTU)',
          fluidCapacity: 'Capacidad térmica del fluido:',
          transferUnits: 'Número de unidades de transferencia:',
          result: '→ NTU ='
        },
        effectiveness: {
          title: '6.2 Efectividad Térmica',
          exchanger: 'Para un intercambiador con T',
          constant: 'constante (C',
          infinity: '= ∞):',
          result: '→ Efectividad: ε ='
        },
        outletTemp: {
          title: '6.3 Temperatura de Salida',
          result: '→ Temperatura de salida: T'
        },
        heatLoss: {
          title: '6.4 Pérdida de Calor',
          result: '→ Pérdida de calor: Q',
          source: 'Fuente: Método NTU - Incropera & DeWitt, Perry\'s Section 5-10 - js/calculations/heat-transfer.js'
        }
      }
    },
    buttons: {
      exportPDF: 'Exportar PDF'
    },
    footer: {
      license: 'Licencia MIT',
      basedOn: 'Cálculos basados en Perry\'s Handbook e IAPWS-97'
    },
  errors: {
    suggestionsTitle: 'Sugerencias para resolver el problema:'
  },
    status: {
      modifying: 'Modificación en curso...',
      recalculating: 'Recalculando...',
      uptodate: 'Resultados al día',
      error: 'Error de cálculo'
    },
  validation: {
    requiredMissing: 'Campo obligatorio faltante: {label}',
    lengthRange: 'La longitud debe estar entre 1 y 1000 m',
    waterTempRange: 'La temperatura del agua debe estar entre 1 y 100°C',
    airTempRange: 'La temperatura del aire debe estar entre -50 y 30°C',
    waterPressureRange: 'La presión del agua debe estar entre 100 y 1000 kPag',
    waterFlowRange: 'El caudal de agua debe estar entre 0.06 y 30 m³/hr',
    windSpeedRange: 'La velocidad del viento debe estar entre 0 y 108 km/h'
  },
    alerts: {
      modulesMissing: 'Error: Algunos módulos no se cargaron. Recargue la página.',
      noResultsToExport: 'No hay resultados para exportar. Ejecute un análisis primero.',
      exportUnavailable: 'Módulo de exportación no disponible'
    },
    verdict: {
      frozen: {
        title: 'CONDICIÓN DE CONGELACIÓN ALCANZADA',
        msg: 'El agua alcanzó 0°C (punto de congelación) a {distance} m de la entrada. El agua se congela en la tubería.\n\n⚠️ Posición crítica: {distance} m de la entrada\n❌ Margen de seguridad: 0.0°C (congelado)\n⚠️ Riesgo de parada de producción y rotura de tubería'
      },
      critical: {
        title: 'RIESGO DE CONGELACIÓN DETECTADO',
        msg: 'Temperatura mínima: {tmin}°C alcanzada a {pos} m de la entrada.\n\n⚠️ Posición crítica: {freezePos} m (congelación proyectada)\n❌ Margen hasta congelación: {marginFreeze}°C (por debajo de 0°C)\n❌ Diferencia vs seguridad: {marginSafety}°C (por debajo de {safety}°C)'
      },
      warning: {
        title: 'PRECAUCIÓN: POR DEBAJO DEL MARGEN DE SEGURIDAD',
        msg: 'Temperatura mínima: {tmin}°C alcanzada a {pos} m de la entrada.\n\n⚠️ Posición más fría: {pos} m\n⚠️ Margen hasta congelación: +{marginFreeze}°C (por encima de 0°C)\n⚠️ Diferencia vs seguridad: {marginSafety}°C (por debajo de {safety}°C)'
      },
      ok: {
        title: 'SIN RIESGO DE CONGELACIÓN',
        msg: 'La tubería está protegida. Temperatura mínima: {tmin}°C alcanzada a {pos} m.\n\n✅ Margen hasta congelación: +{marginFreeze}°C (por encima de 0°C)\n✅ Margen de seguridad: +{marginSafety}°C (por encima de {safety}°C)'
      }
    },
    corrective: {
      warningTitle: '⚠️ Configuración cercana a los límites físicos',
      warningNote: 'Nota: Su configuración ACTUAL produjo resultados válidos. Esta advertencia se refiere a valores MIN/MAX probados en el análisis de sensibilidad.',
      pressureCritical: '🚨 Errores críticos de presión:',
      tempErrors: '⚠️ Errores de temperatura:',
      otherLimits: 'Otras limitaciones:',
      recs: 'Recomendaciones para alejarse de los límites:',
      incPressure: 'Aumentar la presión de entrada (actualmente cerca del mínimo de 1 bar)',
      reduceLength: 'Reducir la longitud de la tubería para limitar pérdidas de presión',
      incDiameter: 'Aumentar el diámetro (NPS) para reducir velocidad y pérdidas',
      reduceFlow: 'Reducir el caudal si es posible para disminuir pérdidas de presión',
      adjustTemps: 'Ajustar temperaturas para mantenerse dentro de los rangos válidos',
      verifyAmbient: 'Verificar que las condiciones ambientales sean realistas',
      reviewInputs: 'Revisar los parámetros de entrada para mantenerse en los rangos de validez',
      consultDocs: 'Consultar documentación técnica para los límites de cada correlación'
    },
    detailed: {
      atPosition: 'a {pos}m',
      gelAtteint: 'Congelado',
      secure: 'seguro',
      underMargin: 'bajo el margen',
      gel: 'congelación'
    },
    sensitivityTable: {
      parameter: 'Parámetro',
      currentValue: 'Valor Actual',
      tempAtMin: 'T°C en Mín',
      tempAtMax: 'T°C en Máx',
      freezeCritical: 'Punto crítico de congelación (0°C)',
      safetyCritical: 'Punto crítico de seguridad (5°C)',
      amplitude: 'Amplitud',
      pipeLength: 'Longitud de Tubería',
      waterFlow: 'Caudal de Agua',
      waterTempIn: 'Temperatura de Entrada del Agua',
      airTemp: 'Temperatura del Aire',
      windSpeed: 'Velocidad del Viento'
    },
    materials: {
      steel: 'Acero',
      copper: 'Cobre',
      stainless_steel: 'Acero inoxidable'
    },
    diagram: {
      water: 'AGUA',
      air: 'AIRE',
      temperature: 'Temperatura (°C):',
      pressure: 'Presión (kPag):',
      flowRate: 'Caudal (m³/hr):',
      windSpeed: 'Velocidad del viento (km/h):'
    },
    common: { od: 'OD', id: 'ID' },
    sensitivityTable: {
      parameter: 'Parámetro',
      currentValue: 'Valor actual',
      tempAtMin: 'T°C en Mín',
      tempAtMax: 'T°C en Máx',
      freezeCritical: 'Punto crítico congelación (0°C)',
      safetyCritical: 'Umbral de seguridad (5°C)',
      amplitude: 'Rango',
      pipeLength: 'Longitud tubería',
      waterFlow: 'Caudal agua',
      waterTempIn: 'Temp. agua entrada',
      airTemp: 'Temp. aire',
      windSpeed: 'Velocidad viento',
      paramX: 'Parámetro X',
      paramY: 'Parámetro Y',
      min: 'Mín',
      max: 'Máx',
      to: 'a'
    },
    detailedCalcs: {
      outputTemp: 'Temperatura de salida:',
      heatLoss: 'Pérdida térmica:',
      source: 'Fuente:',
      showSegmentsTable: 'Mostrar tabla resumen de todos los segmentos',
      hideSegmentsTable: 'Ocultar tabla resumen',
      showTechnicalDetails: 'Mostrar detalles técnicos',
      hideTechnicalDetails: 'Ocultar detalles técnicos',
      outOfRange: 'Fuera de rango',
      tableTitle: '📊 Tabla resumen de todos los segmentos',
      tableNote: 'Cada segmento sigue la metodología detallada anterior.',
      regime: 'Régimen',
      segment1Note: 'Segmento 1:',
      segment1Text: 'Cálculos detallados mostrados arriba',
      fluidPropertiesNote: 'Nota:',
      fluidPropertiesText: 'Las propiedades de los fluidos se recalculan en cada segmento en función de T<sub>avg</sub> = (T<sub>in</sub> + T<sub>out</sub>)/2 para una precisión óptima.'
    },
    disclaimer: {
      title: 'Advertencia y condiciones de uso',
      text: 'Esta aplicación proporciona una estimación del riesgo de congelación en tuberías de agua basada en modelos térmicos e hidráulicos validados.<br><br>A pesar de las pruebas realizadas en condiciones variadas, los resultados obtenidos deben utilizarse únicamente con fines <strong>indicativos</strong> y de <strong>apoyo a la decisión</strong>. No reemplazan el análisis de un profesional calificado ni las validaciones necesarias antes de cualquier decisión operativa.<br><br>El usuario sigue siendo <strong>el único responsable</strong> de la verificación de los datos de entrada, la interpretación de los resultados y la implementación de medidas de protección y contingencia adecuadas.<br><br>El uso de esta aplicación implica la <strong>aceptación de estas condiciones</strong>.',
      accept: 'Acepto'
    }
  });
})();


