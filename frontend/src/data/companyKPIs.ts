export const companyKPIs = [
  {
    title: 'Logistieke bewegingen geminimaliseerd',
    value: 'logistics_minimized',
    category: 'Operationeel'
  },
  {
    title: 'Continu verbeteren in DNA',
    value: 'continuous_improvement',
    category: 'Cultuur',
    description: 'Intal is een showcase in continu verbeteren, dagelijks in het DNA van iedere Intalist'
  },
  {
    title: 'Voorspelbare flowproductie',
    value: 'predictable_flow',
    category: 'Productie',
    description: 'Voorspelbare flowproductie, vaste takt en doorlooptijden'
  },
  {
    title: 'Hoge mate van automatisering',
    value: 'automation_level',
    category: 'Technologie',
    description: 'Software en standaarden'
  },
  {
    title: 'Product traceerbaarheid',
    value: 'product_traceability',
    category: 'Kwaliteit'
  },
  {
    title: 'Volledige schuifpuien serie',
    value: 'sliding_doors_complete',
    category: 'Product'
  },
  {
    title: '80% Brandwerende puien in Intal systemen',
    value: 'fire_resistant_doors',
    category: 'Product'
  },
  {
    title: 'Product terugname & hergebruik',
    value: 'product_recycling',
    category: 'Duurzaamheid',
    description: 'Producten zijn te traceren en lokaliseren gericht op terugname of nieuwe inzetbaarheid'
  },
  {
    title: 'Duurzame materialen',
    value: 'sustainable_materials',
    category: 'Duurzaamheid',
    description: 'Producten bevatten louter gerecyclede en duurzame materialen'
  },
  {
    title: 'Employer Branding voorloper',
    value: 'employer_branding',
    category: 'HR'
  },
  {
    title: 'Eigenaarschap & teamcultuur',
    value: 'ownership_culture',
    category: 'Cultuur',
    description: 'Intalisten voelen zich eigenaar van Intal en hun team, communiceren in Wij, zijn Open, assertief en correct'
  },
  {
    title: 'Balans structuur en cultuur',
    value: 'structure_culture_balance',
    category: 'Organisatie'
  },
  {
    title: 'Ijdema en Thermal Breaks integratie',
    value: 'company_integration',
    category: 'Organisatie'
  },
  {
    title: 'Naams- en productbekendheid',
    value: 'brand_awareness',
    category: 'Marketing',
    description: 'Hoge naams- en productbekendheid bij architecten en grotere ontwikkelaars'
  },
  {
    title: 'A-label status',
    value: 'a_label_status',
    category: 'Marketing',
    description: 'Intal staat als A-label "top of mind"'
  },
  {
    title: 'Voorkeursmerk architecten',
    value: 'architect_preference',
    category: 'Marketing',
    description: 'Architectenbureaus schrijven Intal voor'
  },
  {
    title: 'Koploper circulaire profielsystemen',
    value: 'circular_systems_leader',
    category: 'Innovatie'
  },
  {
    title: 'Volledig circulair businessmodel',
    value: 'circular_business_model',
    category: 'Strategie'
  }
];

export interface CompanyKPI {
  title: string;
  value: string;
  category: string;
  description?: string;
} 