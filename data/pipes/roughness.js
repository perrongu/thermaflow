// Données de rugosité absolue pour différents matériaux de conduite
// Source: Perry's Chemical Engineers' Handbook, Table 6-7; Moody Diagram
const pipeRoughnessData = {
  "description": "Valeurs de rugosité absolue pour différents matériaux de conduite",
  "source": "Perry's Chemical Engineers' Handbook, Table 6-7; Valeurs de référence du diagramme de Moody",
  "reference_url": "https://fluids.readthedocs.io/fluids.friction.html",
  "notes": "Ces valeurs sont utilisées pour calculer la rugosité relative (ε/D) et le facteur de friction dans l'équation de Darcy-Weisbach",
  "unites": {
    "rugosite_mm": "millimètres",
    "rugosite_pouces": "pouces"
  },
  "materiaux": [
    {
      "materiau": "Acier commercial",
      "condition": "Neuf",
      "rugosite_mm": 0.045,
      "rugosite_pouces": 0.0018,
      "notes": "Tuyau en acier commercial neuf, propre"
    },
    {
      "materiau": "Acier commercial",
      "condition": "Usagé",
      "rugosite_mm": 0.15,
      "rugosite_pouces": 0.006,
      "notes": "Tuyau en acier commercial usagé avec rouille légère"
    },
    {
      "materiau": "Fonte",
      "condition": "Neuve",
      "rugosite_mm": 0.26,
      "rugosite_pouces": 0.01,
      "notes": "Fonte non revêtue neuve"
    },
    {
      "materiau": "Fonte",
      "condition": "Usagée",
      "rugosite_mm": 1.5,
      "rugosite_pouces": 0.059,
      "notes": "Fonte usagée avec dépôts"
    },
    {
      "materiau": "Fer galvanisé",
      "condition": "Neuf",
      "rugosite_mm": 0.15,
      "rugosite_pouces": 0.006,
      "notes": "Tuyau en fer galvanisé neuf"
    },
    {
      "materiau": "Fer forgé",
      "condition": "Neuf",
      "rugosite_mm": 0.045,
      "rugosite_pouces": 0.0018,
      "notes": "Tuyau en fer forgé neuf"
    },
    {
      "materiau": "Fer forgé",
      "condition": "Usagé",
      "rugosite_mm": 0.15,
      "rugosite_pouces": 0.006,
      "notes": "Fer forgé usagé avec corrosion"
    },
    {
      "materiau": "Tube tiré",
      "condition": "Neuf",
      "rugosite_mm": 0.0015,
      "rugosite_pouces": 5.9e-05,
      "notes": "Tube tiré lisse en cuivre, laiton ou acier inoxydable"
    },
    {
      "materiau": "Cuivre",
      "condition": "Neuf",
      "rugosite_mm": 0.0015,
      "rugosite_pouces": 5.9e-05,
      "notes": "Tube de cuivre neuf, très lisse"
    },
    {
      "materiau": "Laiton",
      "condition": "Neuf",
      "rugosite_mm": 0.0015,
      "rugosite_pouces": 5.9e-05,
      "notes": "Tube de laiton neuf, très lisse"
    },
    {
      "materiau": "Acier inoxydable",
      "condition": "Neuf",
      "rugosite_mm": 0.002,
      "rugosite_pouces": 7.9e-05,
      "notes": "Tuyau en acier inoxydable neuf, très lisse"
    },
    {
      "materiau": "PVC",
      "condition": "Neuf",
      "rugosite_mm": 0.0015,
      "rugosite_pouces": 5.9e-05,
      "notes": "Tuyaux en PVC et plastique, très lisses"
    },
    {
      "materiau": "Plastique",
      "condition": "Neuf",
      "rugosite_mm": 0.0015,
      "rugosite_pouces": 5.9e-05,
      "notes": "Tuyaux en plastique général (PVC, PEHD, etc.), très lisses"
    },
    {
      "materiau": "Béton",
      "condition": "Neuf, finition lisse",
      "rugosite_mm": 0.3,
      "rugosite_pouces": 0.012,
      "notes": "Tuyau en béton avec finition lisse"
    },
    {
      "materiau": "Béton",
      "condition": "Finition rugueuse",
      "rugosite_mm": 3.0,
      "rugosite_pouces": 0.118,
      "notes": "Tuyau en béton avec finition rugueuse"
    },
    {
      "materiau": "Acier riveté",
      "condition": "Neuf",
      "rugosite_mm": 1.0,
      "rugosite_pouces": 0.039,
      "notes": "Tuyau en acier riveté"
    },
    {
      "materiau": "Fonte asphaltée",
      "condition": "Neuve",
      "rugosite_mm": 0.12,
      "rugosite_pouces": 0.0047,
      "notes": "Fonte avec revêtement d'asphalte"
    },
    {
      "materiau": "Aluminium",
      "condition": "Neuf",
      "rugosite_mm": 0.0015,
      "rugosite_pouces": 5.9e-05,
      "notes": "Tube en aluminium neuf, lisse"
    }
  ],
  "plages_rugosite_relative_typiques": {
    "tres_lisse": {
      "description": "PVC, tubes tirés, verre",
      "plage_epsilon_sur_D": "< 0.00001"
    },
    "lisse": {
      "description": "Acier commercial, fer forgé",
      "plage_epsilon_sur_D": "0.00001 - 0.0001"
    },
    "moyen": {
      "description": "Fonte, béton",
      "plage_epsilon_sur_D": "0.0001 - 0.001"
    },
    "rugueux": {
      "description": "Acier riveté, tuyaux corrodés",
      "plage_epsilon_sur_D": "> 0.001"
    }
  }
};
