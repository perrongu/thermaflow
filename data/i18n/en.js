// English dictionary (UI only)
(function() {
  'use strict';

  window.I18N_EN = Object.freeze({
    lang: 'en',
    app: {
      title: '❄️ ThermaFlow',
      subtitle: 'Freeze risk detection in water pipelines'
    },
    header: { langAria: 'Language' },
    diagram: {
      water: 'WATER',
      air: 'AIR',
      temperature: 'Temperature (°C):',
      pressure: 'Pressure (kPag):',
      flowRate: 'Flow rate (m³/hr):',
      windSpeed: 'Wind speed (km/h):'
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
      type: 'TYPE:',
      nps: 'NPS:'
    },
    insulation: {
      sectionTitle: '🧤 Insulation (optional)',
      checkbox: 'The pipe is insulated',
      materialLabel: 'Insulation material',
      thicknessLabel: 'Thickness (mm)',
      materials: {
        fiberglass: 'Fiberglass',
        rockwool: 'Mineral wool',
        foam: 'Polyurethane foam',
        polystyrene: 'Extruded polystyrene (XPS)',
        elastomeric: 'Elastomeric foam'
      }
    },
    sections: {
      s1: '1. Parameters and results',
      s2: '2. Sensitivity analysis',
      s21: '2.1 Parametric analysis (tornado charts)',
      s22: '2.2 Combined analysis (2D heatmap)',
      s3: '3. Explanation of calculations',
      toggleDetails: 'Show technical details'
    },
    configSummary: {
      title: 'Analyzed configuration',
      pipe: 'Pipe',
      pipeMaterial: 'Material:',
      pipeSpec: 'Specification:',
      pipeLength: 'Length:',
      water: 'Water',
      waterTemp: 'Temperature:',
      waterFlow: 'Flow rate:',
      waterPressure: 'Pressure:',
      air: 'Ambient air',
      airTemp: 'Temperature:',
      wind: 'Wind speed:',
      insulation: 'Insulation',
      insulationType: 'Type:',
      insulationThickness: 'Thickness:',
      none: 'None'
    },
    chart: {
      title: '📊 Temperature profile',
      legendSafe: 'Safe (≥ 5°C)',
      legendUnder: 'Below margin (0-5°C)',
      legendFreeze: 'Freeze risk (≤ 0°C)',
      legendInvalid: 'Invalid (out of physical range)',
      axisPosition: 'Position (m)',
      axisTemperature: 'Temperature (°C)',
      freezeLine: 'Freeze',
      safetyLine: 'Safety threshold',
      freezeBadge: 'FREEZE',
      legendTitle: 'Legend:'
    },
    results: {
      thermalTitle: '🌡️ Thermal results',
      hydraulicTitle: '⚙️ Hydraulic results',
      tempFinal: 'Final temperature',
      tempMin: 'Minimum temperature',
      margin: 'Margin to freezing',
      heatLoss: 'Total heat loss',
      regime: 'Flow regime',
      reynolds: 'Reynolds number',
      pressureDrop: 'Pressure drop',
      velocity: 'Average velocity'
    },
    sensitivity: {
      interpTitle: '📖 Interpretation',
      interp1: 'Individual analysis: Each chart shows the impact of a single parameter varying over its full range, ',
      interp2: 'all other parameters fixed at their current values. ',
      interp3: 'This identifies which parameters most influence freeze risk.',
      legendBase: 'Baseline (current) value',
      legendFreeze: 'Freeze critical point (0°C)',
      legendSafety: 'Safety threshold (5°C)',
      legendLimit: 'Parameter range limits',
      interp2d1: 'Combined analysis: The heatmap shows the full range of possible results ',
      interp2d2: 'when two parameters vary simultaneously across their spectra, ',
      interp2d3: 'others being fixed. It reveals critical combinations and safety margins.',
      paramX: 'Parameter X',
      paramY: 'Parameter Y',
      min: 'Min',
      max: 'Max',
      to: 'to',
      truncatedRange: 'Truncated range for readability',
      truncatedDetail: 'Centered on important values',
      effectiveRange: 'Effective range',
      theoreticalRange: 'Theoretical range',
      exceedsLimits: 'exceeds physical limits'
    },
    diagram: {
      water: 'WATER',
      air: 'AIR',
      temperature: 'Temperature (°C):',
      pressure: 'Pressure (kPag):',
      flowRate: 'Flow Rate (m³/hr):',
      windSpeed: 'Wind Speed (km/h):'
    },
    calcDetails: {
      introText: 'This section details the calculation methodology allowing an engineer to validate the rigor of the results obtained.',
      methodology: {
        title: '📋 Methodology Summary',
        pipe: 'The',
        divided: 'm pipe is divided into',
        segments: 'segments',
        of: 'of',
        each: 'm each. For each segment, the calculation follows 6 sequential steps:',
        note: 'Note:',
        noteText: 'The output temperature of one segment becomes the input temperature of the next, allowing to follow the thermal evolution along the pipe.',
        step1Title: 'Fluid Properties',
        step1Desc: 'Interpolation in IAPWS-97 tables (water) and standard correlations (air)',
        step2Title: 'Hydraulics',
        step2Desc: 'Reynolds, friction factor, pressure drop (Darcy-Weisbach)',
        step3Title: 'Internal Transfer',
        step3Desc: 'Nusselt and convection coefficient water → wall',
        step4Title: 'External Transfer',
        step4Desc: 'Convection (forced/natural) + radiation wall → air',
        step5Title: 'Thermal Resistances',
        step5Desc: 'Sum of resistances in series, overall UA coefficient',
        step6Title: 'NTU Method',
        step6Desc: 'Calculation of outlet temperature and heat loss of the segment'
      },
      example: {
        title: '🔬 Detailed Example: Segment',
        position: 'Position:',
        note: 'The following segments',
        noteText: 'use the same methodology with their own inlet conditions. Consult the summary table at the bottom of the page for their results.'
      },
      step1: {
        title: 'Step 1: Fluid Properties',
        water: {
          title: '1.1 Water (IAPWS-97 tables interpolation)',
          inputValues: 'Input values:',
          avgTemp: 'Average temperature: T =',
          pressure: 'Pressure: P =',
          interpolation: '2D linear interpolation in IAPWS-97 tables:',
          result: '→ Water properties at',
          source: 'Source: IAPWS-97 Tables (Wagner & Pruß, 2002) - data/fluids/water-tables.js'
        },
        air: {
          title: '1.2 Ambient air',
          inputValue: 'Input value:',
          ambTemp: 'Ambient temperature: T',
          interpolation: 'Linear interpolation in air tables:',
          result: '→ Air properties at',
          source: 'Source: Standard air correlations - data/fluids/air-tables.js'
        }
      },
      step2: {
        title: 'Step 2: Hydraulics',
        velocity: {
          title: '2.1 Flow Velocity',
          inputValues: 'Input values:',
          massFlow: 'Mass flow rate: ṁ =',
          density: 'Density: ρ =',
          diameter: 'Inner diameter: D =',
          volumeFlow: 'Volumetric flow rate:',
          crossSection: 'Cross-sectional area:',
          avgVelocity: 'Average velocity:',
          result: '→ Flow velocity: V =',
          source: 'Source: Continuity equation - js/formulas/geometry.js'
        },
        reynolds: {
          title: '2.2 Reynolds Number',
          result: '→ Re =',
          regime: 'Regime',
          turbulent: 'turbulent',
          laminar: 'laminar',
          condition: '(Re > 4000)',
          source: 'Source: Perry\'s Section 6-3 - js/formulas/reynolds.js'
        },
        friction: {
          title: '2.3 Friction Factor',
          roughness: 'Relative roughness: ε/D =',
          laminarFlow: 'Laminar flow (Re < 2300):',
          correlation: 'Churchill correlation (turbulent, explicit):',
          note: 'Note: Churchill equation solved explicitly as a function of Re and ε/D',
          result: '→ Darcy friction factor: f =',
          source: 'Source: Churchill (1977) - Perry\'s Section 6-7 - js/correlations/friction-factor.js'
        },
        pressureDrop: {
          title: '2.4 Pressure Drop',
          segmentLength: 'Segment length: L =',
          equation: 'Darcy-Weisbach equation:',
          result: '→ Pressure drop: ΔP =',
          source: 'Source: Darcy-Weisbach - Perry\'s Section 6-4 - js/formulas/pressure-basic.js'
        }
      },
      step3: {
        title: 'Step 3: Internal Heat Transfer (water → wall)',
        prandtl: {
          title: '3.1 Prandtl Number (water)',
          result: '→ Water Prandtl number: Pr ='
        },
        nusselt: {
          title: '3.2 Nusselt Number (internal convection)',
          correlation: 'Correlation: Dittus-Boelter (turbulent)',
          result: '→ Internal Nusselt number: Nu =',
          source: 'Source: Perry\'s Section 5-12 - js/correlations/nusselt-internal.js'
        },
        coefficient: {
          title: '3.3 Internal Convection Coefficient',
          result: '→ Internal convection coefficient: h',
          source: 'Source calculated from Nusselt number'
        },
        correlations: {
          hausen: 'Hausen (laminar with entrance effect)',
          dittusBoelter: 'Dittus-Boelter (turbulent)',
          gnielinski: 'Gnielinski (turbulent, 3000 < Re < 5×10⁶)'
        }
      },
      step4: {
        title: 'Step 4: External Heat Transfer (wall → air)',
        convection: {
          title: '4.1 External Convection (forced - wind)',
          outerDiameter: 'Outer diameter: D',
          windSpeed: 'Wind speed: V',
          forcedConvection: 'Forced convection (Churchill-Bernstein)',
          reynoldsAir: 'Air Reynolds:',
          correlation: 'Churchill-Bernstein correlation for cylinder in cross flow',
          calculated: 'calculated via established correlations',
          result: '→ External convection coefficient: h',
          source: 'Source: Churchill-Bernstein (1977) - js/correlations/nusselt-external.js',
          naturalConvection: 'Natural convection (horizontal cylinder)',
          rayleighCorrelation: 'Rayleigh number then natural convection correlation'
        },
        radiation: {
          title: '4.2 Radiation',
          emissivity: 'Steel emissivity: ε =',
          stefanBoltzmann: 'Stefan-Boltzmann constant: σ =',
          linearized: 'Linearized radiation coefficient:',
          surfaceTemp: 'With T',
          surfaceTempNote: '≈ estimated surface temperature',
          result: '→ Radiation coefficient: h',
          source: 'Source: Stefan-Boltzmann law - js/correlations/radiation.js'
        },
        total: {
          title: '4.3 Total External Coefficient',
          result: '→ Total external coefficient: h'
        }
      },
      step5: {
        title: 'Step 5: Thermal Resistances',
        series: {
          title: '5.1 Series Resistances',
          convInternal: '(internal convection):',
          condPipe: '(steel wall conduction):',
          condInsulation: '(insulation conduction',
          convExternal: '(external convection + radiation):'
        },
        total: {
          title: '5.2 Total Resistance',
          result: '→ Total thermal resistance: R'
        },
        ua: {
          title: '5.3 Overall UA Coefficient',
          result: '→ UA coefficient:',
          source: 'Source: Resistances in series - js/calculations/thermal-resistance.js'
        }
      },
      step6: {
        title: 'Step 6: NTU Method (outlet temperature)',
        ntu: {
          title: '6.1 Number of Transfer Units (NTU)',
          fluidCapacity: 'Fluid thermal capacity:',
          transferUnits: 'Number of transfer units:',
          result: '→ NTU ='
        },
        effectiveness: {
          title: '6.2 Thermal Effectiveness',
          exchanger: 'For an exchanger with T',
          constant: 'constant (C',
          infinity: '= ∞):',
          result: '→ Effectiveness: ε ='
        },
        outletTemp: {
          title: '6.3 Outlet Temperature',
          result: '→ Outlet temperature: T'
        },
        heatLoss: {
          title: '6.4 Heat Loss',
          result: '→ Heat loss: Q',
          source: 'Source: NTU method - Incropera & DeWitt, Perry\'s Section 5-10 - js/calculations/heat-transfer.js'
        }
      }
    },
    buttons: {
      exportPDF: 'Export PDF'
    },
    footer: {
      license: 'MIT License',
      basedOn: "Calculations based on Perry's Handbook and IAPWS-97"
    },
  errors: {
    suggestionsTitle: 'Suggestions to resolve the issue:'
  },
    status: {
      modifying: 'Modifications pending...',
      recalculating: 'Recalculating...',
      uptodate: 'Results up to date',
      error: 'Calculation error'
    },
  validation: {
    requiredMissing: 'Required field missing: {label}',
    lengthRange: 'Length must be between 1 and 2500 m',
    waterTempRange: 'Water temperature must be between 1 and 100°C',
    airTempRange: 'Air temperature must be between -50 and 30°C',
    waterPressureRange: 'Water pressure must be between 100 and 1000 kPag',
    waterFlowRange: 'Water flow must be between 0.06 and 30 m³/hr',
    windSpeedRange: 'Wind speed must be between 0 and 108 km/h'
  },
    alerts: {
      modulesMissing: 'Error: Some modules failed to load. Reload the page.',
      noResultsToExport: 'No results to export. Run an analysis first.',
      exportUnavailable: 'Export module not available'
    },
    verdict: {
      frozen: {
        title: 'FREEZING CONDITION REACHED',
        msg: "Water reached 0°C (freezing point) at {distance} m from inlet. Water freezes in the pipe.\n\n⚠️ Critical position: {distance} m from inlet\n❌ Safety margin: 0.0°C (frozen)\n⚠️ Risk of production stop and pipe burst"
      },
      critical: {
        title: 'FREEZE RISK DETECTED',
        msg: 'Minimum temperature: {tmin}°C at {pos} m from inlet.\n\n⚠️ Critical position: {freezePos} m (projected freezing)\n❌ Margin to freeze: {marginFreeze}°C (below 0°C)\n❌ Gap vs safety: {marginSafety}°C (below {safety}°C)'
      },
      warning: {
        title: 'CAUTION: BELOW SAFETY MARGIN',
        msg: 'Minimum temperature: {tmin}°C at {pos} m from inlet.\n\n⚠️ Coldest position: {pos} m\n⚠️ Margin to freeze: +{marginFreeze}°C (above 0°C)\n⚠️ Gap vs safety: {marginSafety}°C (below {safety}°C)'
      },
      ok: {
        title: 'NO FREEZE RISK',
        msg: 'Pipe is protected. Minimum temperature: {tmin}°C at {pos} m.\n\n✅ Margin to freeze: +{marginFreeze}°C (above 0°C)\n✅ Safety margin: +{marginSafety}°C (above {safety}°C)'
      }
    },
    corrective: {
      warningTitle: '⚠️ Configuration near physical limits',
      warningNote: 'Note: Your CURRENT configuration yielded valid results. This warning concerns MIN/MAX values tested in sensitivity analysis.',
      pressureCritical: '🚨 Critical pressure errors:',
      tempErrors: '⚠️ Temperature errors:',
      otherLimits: 'Other limitations:',
      recs: 'Recommendations to move away from limits:',
      incPressure: 'Increase inlet pressure (currently near 1 bar minimum)',
      reduceLength: 'Reduce pipe length to limit pressure losses',
      incDiameter: 'Increase diameter (NPS) to reduce velocity and losses',
      reduceFlow: 'Reduce flow if possible to decrease pressure drops',
      adjustTemps: 'Adjust temperatures to stay within validity ranges',
      verifyAmbient: 'Verify ambient conditions are realistic',
      reviewInputs: 'Review inputs to stay within validity ranges',
      consultDocs: 'Consult technical docs for each correlation limits'
    },
    detailed: {
      atPosition: 'at {pos}m',
      gelAtteint: 'Frozen',
      secure: 'safe',
      underMargin: 'below margin',
      gel: 'freezing'
    },
    sensitivityTable: {
      parameter: 'Parameter',
      currentValue: 'Current Value',
      tempAtMin: 'T°C at Min',
      tempAtMax: 'T°C at Max',
      freezeCritical: 'Freeze critical point (0°C)',
      safetyCritical: 'Safety critical point (5°C)',
      amplitude: 'Amplitude',
      pipeLength: 'Pipe Length',
      waterFlow: 'Water Flow',
      waterTempIn: 'Water Inlet Temperature',
      airTemp: 'Air Temperature',
      windSpeed: 'Wind Speed'
    },
    materials: {
      steel: 'Steel',
      copper: 'Copper',
      stainless_steel: 'Stainless steel'
    },
    diagram: {
      water: 'WATER',
      air: 'AIR',
      temperature: 'Temperature (°C):',
      pressure: 'Pressure (kPag):',
      flowRate: 'Flow rate (m³/hr):',
      windSpeed: 'Wind speed (km/h):'
    },
    common: { od: 'OD', id: 'ID' },
    sensitivityTable: {
      parameter: 'Parameter',
      currentValue: 'Current value',
      tempAtMin: 'T°C at Min',
      tempAtMax: 'T°C at Max',
      freezeCritical: 'Freeze critical (0°C)',
      safetyCritical: 'Safety threshold (5°C)',
      amplitude: 'Range',
      pipeLength: 'Pipe length',
      waterFlow: 'Water flow',
      waterTempIn: 'Water inlet temp.',
      airTemp: 'Air temp.',
      windSpeed: 'Wind speed',
      paramX: 'Parameter X',
      paramY: 'Parameter Y',
      min: 'Min',
      max: 'Max',
      to: 'to'
    },
    detailedCalcs: {
      outputTemp: 'Outlet temperature:',
      heatLoss: 'Heat loss:',
      source: 'Source:',
      showSegmentsTable: 'Show summary table of all segments',
      hideSegmentsTable: 'Hide summary table',
      showTechnicalDetails: 'Show technical details',
      hideTechnicalDetails: 'Hide technical details',
      outOfRange: 'Out of range',
      tableTitle: '📊 Summary table of all segments',
      tableNote: 'Each segment follows the detailed methodology above.',
      regime: 'Regime',
      segment1Note: 'Segment 1:',
      segment1Text: 'Detailed calculations shown above',
      fluidPropertiesNote: 'Note:',
      fluidPropertiesText: 'Fluid properties are recalculated at each segment based on T<sub>avg</sub> = (T<sub>in</sub> + T<sub>out</sub>)/2 for optimal precision.'
    },
    disclaimer: {
      title: 'Warning and Terms of Use',
      text: 'This application provides an estimate of freeze risk in water pipelines based on validated thermal and hydraulic models.<br><br>Despite testing under various conditions, the obtained results should be used only for <strong>indicative</strong> and <strong>decision support</strong> purposes. They do not replace the analysis of a qualified professional nor the necessary validations before any operational decision.<br><br>The user remains <strong>solely responsible</strong> for verifying input data, interpreting results, and implementing appropriate protection and contingency measures.<br><br>Using this application implies <strong>acceptance of these terms</strong>.',
      accept: 'I accept'
    }
  });
})();


