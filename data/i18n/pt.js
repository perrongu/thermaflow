// Dicionário PT (apenas UI)
(function() {
  'use strict';

  window.I18N_PT = Object.freeze({
    lang: 'pt',
    app: {
      title: '❄️ ThermaFlow',
      subtitle: 'Detecção de risco de congelamento em tubulações de água'
    },
    header: { langAria: 'Idioma' },
    diagram: {
      water: 'ÁGUA',
      air: 'AR',
      temperature: 'Temperatura (°C):',
      pressure: 'Pressão (kPag):',
      flowRate: 'Vazão (m³/hr):',
      windSpeed: 'Velocidade do vento (km/h):'
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
      sectionTitle: '🧤 Isolamento (opcional)',
      checkbox: 'A tubulação é isolada',
      materialLabel: 'Material de isolamento',
      thicknessLabel: 'Espessura (mm)',
      materials: {
        fiberglass: 'Fibra de vidro',
        rockwool: 'Lã mineral',
        foam: 'Espuma de poliuretano',
        polystyrene: 'Poliestireno extrudado (XPS)',
        elastomeric: 'Espuma elastomérica'
      }
    },
    sections: {
      s1: '1. Parâmetros e resultados',
      s2: '2. Análise de sensibilidade',
      s21: '2.1 Análise paramétrica (gráficos tornado)',
      s22: '2.2 Análise combinada (heatmap 2D)',
      s3: '3. Explicação dos cálculos',
      toggleDetails: 'Mostrar detalhes técnicos'
    },
    configSummary: {
      title: 'Configuração analisada',
      pipe: 'Tubo',
      pipeMaterial: 'Material:',
      pipeSpec: 'Especificação:',
      pipeLength: 'Comprimento:',
      water: 'Água',
      waterTemp: 'Temperatura:',
      waterFlow: 'Vazão:',
      waterPressure: 'Pressão:',
      air: 'Ar ambiente',
      airTemp: 'Temperatura:',
      wind: 'Velocidade do vento:',
      insulation: 'Isolamento',
      insulationType: 'Tipo:',
      insulationThickness: 'Espessura:',
      none: 'Nenhum'
    },
    chart: {
      title: '📊 Perfil de temperatura',
      legendSafe: 'Seguro (≥ 5°C)',
      legendUnder: 'Abaixo da margem (0-5°C)',
      legendFreeze: 'Risco de congelamento (≤ 0°C)',
      legendInvalid: 'Inválido (fora da faixa física)',
      axisPosition: 'Posição (m)',
      axisTemperature: 'Temperatura (°C)',
      freezeLine: 'Congelamento',
      safetyLine: 'Limite de segurança',
      freezeBadge: 'GELO',
      legendTitle: 'Legenda:'
    },
    results: {
      thermalTitle: '🌡️ Resultados térmicos',
      hydraulicTitle: '⚙️ Resultados hidráulicos',
      tempFinal: 'Temperatura final',
      tempMin: 'Temperatura mínima',
      margin: 'Margem até congelar',
      heatLoss: 'Perda térmica total',
      regime: 'Regime de escoamento',
      reynolds: 'Número de Reynolds',
      pressureDrop: 'Perda de pressão',
      velocity: 'Velocidade média'
    },
    sensitivity: {
      interpTitle: '📖 Interpretação',
      interp1: 'Análise individual: Cada gráfico mostra o impacto de um único parâmetro em todo seu intervalo, ',
      interp2: 'com os demais parâmetros fixos nos valores atuais. ',
      interp3: 'Permite identificar quais parâmetros mais influenciam o risco de congelamento.',
      legendBase: 'Valor de base (atual)',
      legendFreeze: 'Ponto crítico de congelamento (0°C)',
      legendSafety: 'Limite de segurança (5°C)',
      legendLimit: 'Limites do intervalo do parâmetro',
      interp2d1: 'Análise combinada: O mapa de calor mostra toda a faixa possível de resultados ',
      interp2d2: 'quando dois parâmetros variam simultaneamente em seus espectros, ',
      interp2d3: 'com os demais fixos. Identifica combinações críticas e margens de segurança.',
      paramX: 'Parâmetro X',
      paramY: 'Parâmetro Y',
      min: 'Mín',
      max: 'Máx',
      to: 'a',
      truncatedRange: 'Faixa truncada para legibilidade',
      truncatedDetail: 'Centrado em valores importantes',
      effectiveRange: 'Faixa efetiva',
      theoreticalRange: 'Faixa teórica',
      exceedsLimits: 'excede limites físicos'
    },
    diagram: {
      water: 'ÁGUA',
      air: 'AR',
      temperature: 'Temperatura (°C):',
      pressure: 'Pressão (kPag):',
      flowRate: 'Vazão (m³/hr):',
      windSpeed: 'Velocidade do Vento (km/h):'
    },
    calcDetails: {
      introText: 'Esta seção detalha a metodologia de cálculo permitindo a um engenheiro validar o rigor dos resultados obtidos.',
      methodology: {
        title: '📋 Resumo da Metodologia',
        pipe: 'A tubulação de',
        divided: 'é dividida em',
        segments: 'segmentos',
        of: 'de',
        each: 'm cada. Para cada segmento, o cálculo segue 6 etapas sequenciais:',
        note: 'Nota:',
        noteText: 'A temperatura de saída de um segmento torna-se a temperatura de entrada do seguinte, permitindo acompanhar a evolução térmica ao longo da tubulação.',
        step1Title: 'Propriedades dos Fluidos',
        step1Desc: 'Interpolação em tabelas IAPWS-97 (água) e correlações padrão (ar)',
        step2Title: 'Hidráulica',
        step2Desc: 'Reynolds, fator de atrito, queda de pressão (Darcy-Weisbach)',
        step3Title: 'Transferência Interna',
        step3Desc: 'Nusselt e coeficiente de convecção água → parede',
        step4Title: 'Transferência Externa',
        step4Desc: 'Convecção (forçada/natural) + radiação parede → ar',
        step5Title: 'Resistências Térmicas',
        step5Desc: 'Soma das resistências em série, coeficiente UA global',
        step6Title: 'Método NTU',
        step6Desc: 'Cálculo da temperatura de saída e perda de calor do segmento'
      },
      example: {
        title: '🔬 Exemplo Detalhado: Segmento',
        position: 'Posição:',
        note: 'Os segmentos seguintes',
        noteText: 'usam a mesma metodologia com suas próprias condições de entrada. Consulte a tabela resumo no final da página para seus resultados.'
      },
      step1: {
        title: 'Etapa 1: Propriedades dos Fluidos',
        water: {
          title: '1.1 Água (interpolação tabelas IAPWS-97)',
          inputValues: 'Valores de entrada:',
          avgTemp: 'Temperatura média: T =',
          pressure: 'Pressão: P =',
          interpolation: 'Interpolação linear 2D nas tabelas IAPWS-97:',
          result: '→ Propriedades da água a',
          source: 'Fonte: Tabelas IAPWS-97 (Wagner & Pruß, 2002) - data/fluids/water-tables.js'
        },
        air: {
          title: '1.2 Ar ambiente',
          inputValue: 'Valor de entrada:',
          ambTemp: 'Temperatura ambiente: T',
          interpolation: 'Interpolação linear nas tabelas de ar:',
          result: '→ Propriedades do ar a',
          source: 'Fonte: Correlações padrão de ar - data/fluids/air-tables.js'
        }
      },
      step2: {
        title: 'Etapa 2: Hidráulica',
        velocity: {
          title: '2.1 Velocidade de Escoamento',
          inputValues: 'Valores de entrada:',
          massFlow: 'Vazão mássica: ṁ =',
          density: 'Densidade: ρ =',
          diameter: 'Diâmetro interno: D =',
          volumeFlow: 'Vazão volumétrica:',
          crossSection: 'Seção transversal:',
          avgVelocity: 'Velocidade média:',
          result: '→ Velocidade de escoamento: V =',
          source: 'Fonte: Equação da continuidade - js/formulas/geometry.js'
        },
        reynolds: {
          title: '2.2 Número de Reynolds',
          result: '→ Re =',
          regime: 'Regime',
          turbulent: 'turbulento',
          laminar: 'laminar',
          condition: '(Re > 4000)',
          source: 'Fonte: Perry\'s Section 6-3 - js/formulas/reynolds.js'
        },
        friction: {
          title: '2.3 Fator de Atrito',
          roughness: 'Rugosidade relativa: ε/D =',
          laminarFlow: 'Escoamento laminar (Re < 2300):',
          correlation: 'Correlação de Churchill (turbulento, explícito):',
          note: 'Nota: Equação de Churchill resolvida explicitamente em função de Re e ε/D',
          result: '→ Fator de atrito de Darcy: f =',
          source: 'Fonte: Churchill (1977) - Perry\'s Section 6-4 - js/correlations/friction-factor.js'
        },
        pressureDrop: {
          title: '2.4 Queda de Pressão',
          segmentLength: 'Comprimento do segmento: L =',
          equation: 'Equação de Darcy-Weisbach:',
          result: '→ Queda de pressão: ΔP =',
          source: 'Fonte: Darcy-Weisbach - Perry\'s Section 6-4 - js/formulas/pressure-basic.js'
        }
      },
      step3: {
        title: 'Etapa 3: Transferência de Calor Interna (água → parede)',
        prandtl: {
          title: '3.1 Número de Prandtl (água)',
          result: '→ Número de Prandtl da água: Pr ='
        },
        nusselt: {
          title: '3.2 Número de Nusselt (convecção interna)',
          correlation: 'Correlação: Dittus-Boelter (turbulento)',
          result: '→ Número de Nusselt interno: Nu =',
          source: 'Fonte: Perry\'s Section 5-12 - js/correlations/nusselt-internal.js'
        },
        coefficient: {
          title: '3.3 Coeficiente de Convecção Interna',
          result: '→ Coeficiente de convecção interna: h',
          source: 'Fonte calculado a partir do número de Nusselt'
        },
        correlations: {
          hausen: 'Hausen (laminar com efeito de entrada)',
          dittusBoelter: 'Dittus-Boelter (turbulento)',
          gnielinski: 'Gnielinski (turbulento, 3000 < Re < 5×10⁶)'
        }
      },
      step4: {
        title: 'Etapa 4: Transferência de Calor Externa (parede → ar)',
        convection: {
          title: '4.1 Convecção Externa (forçada - vento)',
          outerDiameter: 'Diâmetro externo: D',
          windSpeed: 'Velocidade do vento: V',
          forcedConvection: 'Convecção forçada (Churchill-Bernstein)',
          reynoldsAir: 'Reynolds ar:',
          correlation: 'Correlação de Churchill-Bernstein para cilindro em fluxo cruzado',
          calculated: 'calculado via correlações estabelecidas',
          result: '→ Coeficiente de convecção externa: h',
          source: 'Fonte: Churchill-Bernstein (1977) - js/correlations/nusselt-external.js',
          naturalConvection: 'Convecção natural (cilindro horizontal)',
          rayleighCorrelation: 'Número de Rayleigh então correlação de convecção natural'
        },
        radiation: {
          title: '4.2 Radiação',
          emissivity: 'Emissividade steel: ε =',
          stefanBoltzmann: 'Constante Stefan-Boltzmann: σ =',
          linearized: 'Coeficiente de radiação linearizado:',
          surfaceTemp: 'Com T',
          surfaceTempNote: '≈ temperatura superficial estimada',
          result: '→ Coeficiente de radiação: h',
          source: 'Fonte: Lei de Stefan-Boltzmann - js/correlations/radiation.js'
        },
        total: {
          title: '4.3 Coeficiente Externo Total',
          result: '→ Coeficiente externo total: h'
        }
      },
      step5: {
        title: 'Etapa 5: Resistências Térmicas',
        series: {
          title: '5.1 Resistências em Série',
          convInternal: '(convecção interna):',
          condPipe: '(condução parede steel):',
          condInsulation: '(condução isolamento',
          convExternal: '(convecção externa + radiação):'
        },
        total: {
          title: '5.2 Resistência Total',
          result: '→ Resistência térmica total: R'
        },
        ua: {
          title: '5.3 Coeficiente UA Global',
          result: '→ Coeficiente UA:',
          source: 'Fonte: Resistências em série - js/calculations/thermal-resistance.js'
        }
      },
      step6: {
        title: 'Etapa 6: Método NTU (temperatura de saída)',
        ntu: {
          title: '6.1 Número de Unidades de Transferência (NTU)',
          fluidCapacity: 'Capacidade térmica do fluido:',
          transferUnits: 'Número de unidades de transferência:',
          result: '→ NTU ='
        },
        effectiveness: {
          title: '6.2 Efetividade Térmica',
          exchanger: 'Para um trocador com T',
          constant: 'constante (C',
          infinity: '= ∞):',
          result: '→ Efetividade: ε ='
        },
        outletTemp: {
          title: '6.3 Temperatura de Saída',
          result: '→ Temperatura de saída: T'
        },
        heatLoss: {
          title: '6.4 Perda de Calor',
          result: '→ Perda de calor: Q',
          source: 'Fonte: Método NTU - Incropera & DeWitt, Perry\'s Section 5-10 - js/calculations/heat-transfer.js'
        }
      }
    },
    buttons: {
      exportPDF: 'Exportar PDF'
    },
    footer: {
      license: 'Licença MIT',
      basedOn: 'Cálculos baseados no Perry\'s Handbook e IAPWS-97'
    },
  errors: {
    suggestionsTitle: 'Sugestões para resolver o problema:'
  },
    status: {
      modifying: 'Modificação em curso...',
      recalculating: 'Recalculando...',
      uptodate: 'Resultados atualizados',
      error: 'Erro de cálculo'
    },
  validation: {
    requiredMissing: 'Campo obrigatório ausente: {label}',
    lengthRange: 'Comprimento deve estar entre 1 e 2500 m',
    waterTempRange: 'Temperatura da água deve estar entre 1 e 100°C',
    airTempRange: 'Temperatura do ar deve estar entre -50 e 30°C',
    waterPressureRange: 'Pressão da água deve estar entre 100 e 1000 kPag',
    waterFlowRange: 'Vazão da água deve estar entre 0.06 e 30 m³/hr',
    windSpeedRange: 'Velocidade do vento deve estar entre 0 e 108 km/h'
  },
    alerts: {
      modulesMissing: 'Erro: Alguns módulos não carregaram. Recarregue a página.',
      noResultsToExport: 'Sem resultados para exportar. Execute uma análise primeiro.',
      exportUnavailable: 'Módulo de exportação indisponível'
    },
    verdict: {
      frozen: {
        title: 'CONDIÇÃO DE CONGELAMENTO ALCANÇADA',
        msg: 'A água atingiu 0°C (ponto de congelamento) a {distance} m da entrada. A água congela na tubulação.\n\n⚠️ Posição crítica: {distance} m da entrada\n❌ Margem de segurança: 0.0°C (congelado)\n⚠️ Risco de parada de produção e ruptura da tubulação'
      },
      critical: {
        title: 'RISCO DE CONGELAMENTO DETECTADO',
        msg: 'Temperatura mínima: {tmin}°C alcançada a {pos} m da entrada.\n\n⚠️ Posição crítica: {freezePos} m (congelamento projetado)\n❌ Margem até congelar: {marginFreeze}°C (abaixo de 0°C)\n❌ Diferença vs segurança: {marginSafety}°C (abaixo de {safety}°C)'
      },
      warning: {
        title: 'ATENÇÃO: ABAIXO DA MARGEM DE SEGURANÇA',
        msg: 'Temperatura mínima: {tmin}°C alcançada a {pos} m da entrada.\n\n⚠️ Posição mais fria: {pos} m\n⚠️ Margem até congelar: +{marginFreeze}°C (acima de 0°C)\n⚠️ Diferença vs segurança: {marginSafety}°C (abaixo de {safety}°C)'
      },
      ok: {
        title: 'SEM RISCO DE CONGELAMENTO',
        msg: 'A tubulação está protegida. Temperatura mínima: {tmin}°C a {pos} m.\n\n✅ Margem até congelar: +{marginFreeze}°C (acima de 0°C)\n✅ Margem de segurança: +{marginSafety}°C (acima de {safety}°C)'
      }
    },
    corrective: {
      warningTitle: '⚠️ Configuração próxima aos limites físicos',
      warningNote: 'Nota: Sua configuração ATUAL produziu resultados válidos. Este aviso refere-se aos valores MÍN/MÁX testados na análise de sensibilidade.',
      pressureCritical: '🚨 Erros críticos de pressão:',
      tempErrors: '⚠️ Erros de temperatura:',
      otherLimits: 'Outras limitações:',
      recs: 'Recomendações para afastar-se dos limites:',
      incPressure: 'Aumentar a pressão de entrada (atualmente próximo de 1 bar mínimo)',
      reduceLength: 'Reduzir o comprimento da tubulação para limitar perdas de pressão',
      incDiameter: 'Aumentar o diâmetro (NPS) para reduzir velocidade e perdas',
      reduceFlow: 'Reduzir a vazão se possível para diminuir perdas de pressão',
      adjustTemps: 'Ajustar temperaturas para permanecer dentro das faixas válidas',
      verifyAmbient: 'Verificar se as condições ambientais são realistas',
      reviewInputs: 'Revisar entradas para permanecer dentro das faixas de validade',
      consultDocs: 'Consultar documentação técnica para limites de cada correlação'
    },
    detailed: {
      atPosition: 'a {pos}m',
      gelAtteint: 'Congelado',
      secure: 'seguro',
      underMargin: 'abaixo da margem',
      gel: 'congelamento'
    },
    sensitivityTable: {
      parameter: 'Parâmetro',
      currentValue: 'Valor Atual',
      tempAtMin: 'T°C no Mín',
      tempAtMax: 'T°C no Máx',
      freezeCritical: 'Ponto crítico de congelamento (0°C)',
      safetyCritical: 'Ponto crítico de segurança (5°C)',
      amplitude: 'Amplitude',
      pipeLength: 'Comprimento da Tubulação',
      waterFlow: 'Vazão de Água',
      waterTempIn: 'Temperatura de Entrada da Água',
      airTemp: 'Temperatura do Ar',
      windSpeed: 'Velocidade do Vento'
    },
    materials: {
      steel: 'Aço',
      copper: 'Cobre',
      stainless_steel: 'Aço inoxidável'
    },
    diagram: {
      water: 'ÁGUA',
      air: 'AR',
      temperature: 'Temperatura (°C):',
      pressure: 'Pressão (kPag):',
      flowRate: 'Vazão (m³/hr):',
      windSpeed: 'Velocidade do vento (km/h):'
    },
    common: { od: 'OD', id: 'ID' },
    sensitivityTable: {
      parameter: 'Parâmetro',
      currentValue: 'Valor atual',
      tempAtMin: 'T°C no Mín',
      tempAtMax: 'T°C no Máx',
      freezeCritical: 'Ponto crítico congelamento (0°C)',
      safetyCritical: 'Limite de segurança (5°C)',
      amplitude: 'Faixa',
      pipeLength: 'Comprimento tubulação',
      waterFlow: 'Vazão água',
      waterTempIn: 'Temp. água entrada',
      airTemp: 'Temp. ar',
      windSpeed: 'Velocidade vento',
      paramX: 'Parâmetro X',
      paramY: 'Parâmetro Y',
      min: 'Mín',
      max: 'Máx',
      to: 'a'
    },
    detailedCalcs: {
      outputTemp: 'Temperatura de saída:',
      heatLoss: 'Perda térmica:',
      source: 'Fonte:',
      showSegmentsTable: 'Mostrar tabela resumo de todos os segmentos',
      hideSegmentsTable: 'Ocultar tabela resumo',
      showTechnicalDetails: 'Mostrar detalhes técnicos',
      hideTechnicalDetails: 'Ocultar detalhes técnicos',
      outOfRange: 'Fora de faixa',
      tableTitle: '📊 Tabela resumo de todos os segmentos',
      tableNote: 'Cada segmento segue a metodologia detalhada acima.',
      regime: 'Regime',
      segment1Note: 'Segmento 1:',
      segment1Text: 'Cálculos detalhados mostrados acima',
      fluidPropertiesNote: 'Nota:',
      fluidPropertiesText: 'As propriedades dos fluidos são recalculadas em cada segmento com base em T<sub>avg</sub> = (T<sub>in</sub> + T<sub>out</sub>)/2 para precisão ideal.'
    },
    disclaimer: {
      title: 'Aviso e termos de uso',
      text: 'Esta aplicação fornece uma estimativa do risco de congelamento em tubulações de água com base em modelos térmicos e hidráulicos validados.<br><br>Apesar dos testes realizados em condições variadas, os resultados obtidos devem ser usados apenas para fins <strong>indicativos</strong> e de <strong>apoio à decisão</strong>. Eles não substituem a análise de um profissional qualificado nem as validações necessárias antes de qualquer decisão operacional.<br><br>O usuário permanece <strong>exclusivamente responsável</strong> pela verificação dos dados de entrada, interpretação dos resultados e implementação de medidas de proteção e contingência apropriadas.<br><br>O uso desta aplicação implica a <strong>aceitação destes termos</strong>.',
      accept: 'Eu aceito'
    }
  });
})();


