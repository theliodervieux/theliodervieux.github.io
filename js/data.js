/* ════════════════════════════════════════════════════════════════════
   DONNÉES DU PORTFOLIO — c'est le seul fichier à modifier pour le contenu
   ────────────────────────────────────────────────────────────────────
   • SITE        : infos générales (date de naissance, e-mail, CV…)
   • COMPETENCES : les 3 compétences du BUT SD et leurs apprentissages critiques
   • PROJECTS    : un objet par projet (voir le modèle en bas du fichier)
   • TEXTS       : présentation, à propos, bilan
   • UI          : petits textes de l'interface (FR / EN)
   Les descriptions longues acceptent : "## Titre", "- liste", "**gras**".
   ════════════════════════════════════════════════════════════════════ */

window.SITE = {
  name: 'Thélio Dervieux',
  birthDate: '2007-08-19',          // l'âge est calculé automatiquement
  butStart: '2025-09-01',           // l'année de BUT (1ère, 2ème, 3ème) aussi
  email: 'thelio.dervieux@etu.univ-poitiers.fr',
  photo: 'assets/img/thelio.jpg',
  // Bandeau « recherche de stage » en haut de l'accueil (mettre null pour l'enlever)
  internship: { fr: 'Stage recherché · avril → juin 2027', en: 'Seeking an internship · Apr → Jun 2027' },
  cv: {
    available: true,               // ← passer à true une fois le PDF déposé
    path: 'assets/cv/CV-Thelio-Dervieux.pdf'
  }
};

/* ── Compétences du BUT Science des Données (niveau 1) ── */
window.COMPETENCES = {
  C1: {
    color: 'olive',
    short: { fr: 'Traiter', en: 'Process' },
    name: { fr: 'Traiter des données à des fins décisionnelles', en: 'Process data for decision-making' },
    acs: {
      'AC11.01': { fr: 'Correctement interpréter et prendre en compte le besoin du commanditaire ou du client', en: 'Correctly interpret and take into account the needs of the client' },
      'AC11.02': { fr: 'Respecter les formalismes de notation', en: 'Follow notation conventions' },
      'AC11.03': { fr: 'Connaître la syntaxe des langages et savoir l’utiliser', en: 'Know the syntax of programming languages and how to use it' },
      'AC11.04': { fr: 'Mesurer l’importance de maîtriser la structure des données à exploiter', en: 'Understand the importance of mastering the structure of the data being used' },
      'AC11.05': { fr: 'Comprendre les structures algorithmiques de base et leur contexte d’usage', en: 'Understand basic algorithmic structures and when to use them' },
      'AC11.06': { fr: 'Prendre conscience de l’intérêt de la programmation', en: 'Realise the value of programming' }
    }
  },
  C2: {
    color: 'ochre',
    short: { fr: 'Analyser', en: 'Analyse' },
    name: { fr: 'Analyser statistiquement les données', en: 'Analyse data statistically' },
    acs: {
      'AC21.01': { fr: 'Réaliser que les sources de données ont des caractéristiques propres à considérer (variation, précision, mise à jour…)', en: 'Realise that data sources have their own characteristics to consider (variation, precision, updates…)' },
      'AC21.02': { fr: 'Comprendre qu’une analyse correcte ne peut émaner que de données propres et préparées', en: 'Understand that a sound analysis can only come from clean, prepared data' },
      'AC21.03': { fr: 'Comprendre l’intérêt des synthèses numériques et graphiques pour décrire une variable statistique', en: 'Understand the value of numerical and graphical summaries to describe a statistical variable' },
      'AC21.04': { fr: 'Comprendre l’intérêt des synthèses numériques et graphiques pour mettre en évidence des liaisons entre variables', en: 'Understand the value of numerical and graphical summaries to highlight relationships between variables' }
    }
  },
  C3: {
    color: 'clay',
    short: { fr: 'Valoriser', en: 'Communicate' },
    name: { fr: 'Valoriser une production dans un contexte professionnel', en: 'Showcase work in a professional context' },
    acs: {
      'AC31.01': { fr: 'Prendre connaissance des biais rencontrés dans la mise en place d’une enquête', en: 'Become aware of the biases involved in setting up a survey' },
      'AC31.02': { fr: 'Identifier l’importance de contextualiser ses données', en: 'Recognise the importance of putting data in context' },
      'AC31.03': { fr: 'Mesurer l’importance de mettre en évidence des résultats clés par l’utilisation d’indicateurs pertinents', en: 'Understand the importance of highlighting key results with relevant indicators' },
      'AC31.04': { fr: 'Lors de la restitution des résultats, mesurer l’importance d’expliciter également la démarche suivie', en: 'When presenting results, understand the importance of also explaining the approach taken' }
    }
  }
};

/* ════════════════════════════════════════════════════════════════════
   PROJETS
   ════════════════════════════════════════════════════════════════════ */
window.PROJECTS = [
  /* ─────────────────────────── LabVision ─────────────────────────── */
  {
    slug: 'labvision-qualyse',
    featured: true,
    date: '2026-06-10', but: 1, semester: 2,
    thumb: 'assets/img/projets/labvision-qualyse.jpg',
    title: { fr: 'Analyse de données, reporting et datavisualisation', en: 'Data Analysis, Reporting & Data Visualisation' },
    short: {
      fr: 'Projet de fin d’année avec le laboratoire Qualyse : LabVision, un outil Python qui compile, nettoie et visualise des résultats de tests PCR sur des cheptels bovins. Restitution en anglais.',
      en: 'Year-end project with the Qualyse laboratory: LabVision, a Python tool that compiles, cleans and visualises PCR test results on cattle herds. Presented in English.'
    },
    facts: [
      { k: { fr: 'Commanditaire', en: 'Client' }, v: { fr: 'Laboratoire Qualyse', en: 'Qualyse laboratory' } },
      { k: { fr: 'Équipe', en: 'Team' }, v: { fr: '5 étudiants', en: '5 students' } },
      { k: { fr: 'Mon rôle', en: 'My role' }, v: { fr: 'Développeur', en: 'Developer' } },
      { k: { fr: 'Méthode', en: 'Method' }, v: { fr: 'SCRUM', en: 'SCRUM' } }
    ],
    tools: ['Python', 'pandas', 'customtkinter', 'Matplotlib', 'Excel', 'Trello'],
    long: {
      fr: `## Contexte
Pour le projet de fin de première année, notre groupe de 5 étudiants a travaillé avec **Qualyse**, laboratoire public d’analyses sanitaires basé près de Niort. Son représentant, M. Treilles, nous a demandé un outil dynamique pour traiter les résultats des tests PCR Mycoplasmes réalisés depuis 2018 sur les cheptels bovins des Deux-Sèvres (79) et de la Vienne (86).

## La mission
- **Compiler automatiquement** les fichiers Excel bruts de chaque session de tests
- **Nettoyer et structurer** les données dans un fichier de résultats unique et actualisable
- **Classer chaque cheptel** en 9 classes (A à I) à partir de ses 6 derniers résultats
- **Produire un tableau de bord** avec les indicateurs clés demandés par le commanditaire

## La classification
La règle repose sur la valeur Ct (un résultat est positif quand Ct < 40) :
- **A** — toujours négatif · **B** — toujours positif
- **C** — nouveau positif fort (dernier Ct < 35, les 5 précédents négatifs)
- **D / E** — positif récurrent, fort ou non (3 à 5 positifs)
- **F / G** — positif ponctuel, fort ou non (1 à 2 positifs)
- **H** — ancien positif (4 derniers résultats négatifs) · **I** — statut non défini

## L’outil : LabVision
Notre réponse est **LabVision**, une application Python avec une interface graphique construite en customtkinter. Un utilisateur sans compétences en programmation peut charger les fichiers du laboratoire, lancer le traitement en un clic, puis consulter les résultats et le tableau de bord.

## Organisation et restitution
Le projet a été mené en **méthode SCRUM** (Daily, Niko-Niko, Kanban sur Trello). J’y occupais le rôle de **développeur**, chargé du code principal. La soutenance s’est faite **entièrement en anglais** devant un jury, avec une démonstration de l’outil en conditions réelles.

## Ce que j’en retiens
C’est la demande du commanditaire qui m’a fait comprendre l’intérêt de notre travail : un outil qui nettoie, insère et stocke des données automatiquement peut changer la façon de travailler de personnes peu exposées à la programmation, en leur faisant gagner beaucoup de temps.`,
      en: `## Context
For our end-of-first-year project, our group of 5 students worked with **Qualyse**, a public health laboratory based near Niort. Its representative, Mr Treilles, asked us for a dynamic tool to process the PCR Mycoplasma test results carried out since 2018 on cattle herds in the Deux-Sèvres (79) and Vienne (86) departments.

## The mission
- **Automatically compile** the raw Excel files from each testing session
- **Clean and structure** the data into a single, updatable results file
- **Classify each herd** into 9 classes (A to I) based on its last 6 results
- **Produce a dashboard** with the key indicators requested by the client

## The classification
The rule relies on the Ct value (a result is positive when Ct < 40):
- **A** — always negative · **B** — always positive
- **C** — new strong positive (last Ct < 35, previous 5 negative)
- **D / E** — recurring positive, strong or not (3 to 5 positives)
- **F / G** — occasional positive, strong or not (1 to 2 positives)
- **H** — former positive (last 4 results negative) · **I** — undefined status

## The tool: LabVision
Our answer is **LabVision**, a Python application with a graphical interface built with customtkinter. A user with no programming skills can load the laboratory files, run the processing in one click, then browse the results and the dashboard.

## Organisation and presentation
The project was run with the **SCRUM method** (daily stand-ups, Niko-Niko, Kanban on Trello). I was the team’s **developer**, in charge of the main code. The final presentation was given **entirely in English** to a jury, with a live demo of the tool.

## What I take away
It was the client’s request that made me understand the value of our work: a tool that cleans, inserts and stores data automatically can change the way people who rarely code work, and save them a lot of time.`
    },
    competences: [
      { id: 'C1', acs: ['AC11.01', 'AC11.03', 'AC11.06'],
        proof: { fr: 'J’ai écrit le code principal de LabVision : compilation des fichiers Excel du laboratoire, insertion dans un fichier de résultats actualisable et classification automatique des cheptels.', en: 'I wrote LabVision’s main code: compiling the laboratory’s Excel files, inserting them into an updatable results file and classifying herds automatically.' } },
      { id: 'C2', acs: ['AC21.01', 'AC21.02'],
        proof: { fr: 'Les résultats PCR de plusieurs années et de deux départements ont été nettoyés et harmonisés avant tout calcul de classe ou d’indicateur.', en: 'PCR results spanning several years and two departments were cleaned and harmonised before computing any class or indicator.' } },
      { id: 'C3', acs: ['AC31.03', 'AC31.04'],
        proof: { fr: 'Tableau de bord d’indicateurs pour le commanditaire, vidéo de démonstration et soutenance en anglais expliquant toute la démarche.', en: 'An indicator dashboard for the client, a demo video and a presentation in English explaining the whole approach.' } }
    ],
    files: [
      { type: 'PDF', path: 'assets/files/projet-10/rapport-individuel-thelio.pdf', name: { fr: 'Rapport individuel', en: 'Individual report' }, dl: 'Rapport individuel - Thelio Dervieux.pdf' },
      { type: 'DOCX', path: 'assets/files/projet-10/Rapport_collectif_Groupe1.docx', name: { fr: 'Rapport collectif du groupe', en: 'Group report' } },
      { type: 'PY', path: 'assets/files/projet-10/LabVision.py', name: { fr: 'LabVision.py — application', en: 'LabVision.py — application' } },
      { type: 'PY', path: 'assets/files/projet-10/SAE_insertion.py', name: { fr: 'SAE_insertion.py — module d’insertion', en: 'SAE_insertion.py — insertion module' } },
      { type: 'XLSX', path: 'assets/files/projet-10/resultats.xlsx', name: { fr: 'Fichier de résultats', en: 'Results file' } },
      { type: 'ZIP', path: 'assets/files/projet-10/donnees-sources-qualyse.zip', name: { fr: 'Données sources du laboratoire', en: 'Laboratory source data' } },
      { type: 'PDF', path: 'assets/files/projet-10/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - LabVision.pdf' }
    ]
  },

  /* ─────────────────────── Estimation par échantillonnage ─────────────────────── */
  {
    slug: 'estimation-echantillonnage',
    featured: true,
    date: '2026-05-27', but: 1, semester: 2,
    thumb: 'assets/img/projets/estimation-echantillonnage.jpg',
    title: { fr: 'Estimation par échantillonnage', en: 'Estimation by Sampling' },
    short: {
      fr: 'Estimer la population totale d’une région française à l’aide d’un échantillonnage aléatoire simple puis stratifié, et tester des liaisons sur une enquête.',
      en: 'Estimating the total population of a French region with simple then stratified random sampling, and testing relationships in a survey.'
    },
    facts: [
      { k: { fr: 'Région étudiée', en: 'Region studied' }, v: { fr: 'Nouvelle-Aquitaine', en: 'Nouvelle-Aquitaine' } },
      { k: { fr: 'Matière', en: 'Subject' }, v: { fr: 'Statistique inférentielle', en: 'Inferential statistics' } }
    ],
    tools: ['R', 'SAS 9.4', 'Python', 'Word'],
    long: {
      fr: `## Objectif
Comprendre, en pratique, l’incertitude et la précision d’une estimation. La grandeur à estimer : le nombre total d’habitants de la **Nouvelle-Aquitaine**, à partir de la table INSEE de la population des communes françaises.

## Partie 1 — Échantillonnage aléatoire simple
- Tirage de **100 communes** au hasard parmi toutes celles de la région
- Calcul du nombre moyen d’habitants et de son **intervalle de confiance à 95 %**
- Estimation de la population totale, de son intervalle de confiance et de la **marge d’erreur**
- Répétition de l’expérience une dizaine de fois pour observer la variabilité des résultats

## Partie 2 — Échantillonnage stratifié
Les communes sont réparties en **4 strates**, des moins peuplées aux plus peuplées (quartiles de la population). L’échantillon de 100 communes est tiré avec des effectifs proportionnels à chaque strate, puis les estimations sont recalculées et comparées à celles du sondage simple.

## Partie 3 — Traitement d’une enquête
Sur une enquête auprès d’étudiants, recherche de liaisons entre la pratique du sport et d’autres variables : **tableaux croisés**, **tests du khi-deux** et **V de Cramer** pour mesurer la force des liaisons significatives.

## Exigence
Chaque ligne de code R et chaque résultat devaient être expliqués et commentés dans le compte rendu.`,
      en: `## Goal
Understand, in practice, the uncertainty and precision of an estimate. The quantity to estimate: the total population of **Nouvelle-Aquitaine**, from the INSEE table of French municipalities.

## Part 1 — Simple random sampling
- Drawing **100 municipalities** at random from the whole region
- Computing the mean number of inhabitants and its **95% confidence interval**
- Estimating the total population, its confidence interval and the **margin of error**
- Repeating the experiment about ten times to observe how results vary

## Part 2 — Stratified sampling
Municipalities are split into **4 strata**, from least to most populated (population quartiles). The 100-municipality sample is drawn proportionally to each stratum, then the estimates are recomputed and compared with simple sampling.

## Part 3 — Survey processing
Using a student survey, looking for relationships between practising sport and other variables: **cross-tabulations**, **chi-square tests** and **Cramér’s V** to measure the strength of significant relationships.

## Requirement
Every line of R code and every result had to be explained and discussed in the report.`
    },
    competences: [
      { id: 'C2', acs: ['AC21.01', 'AC21.03', 'AC21.04'],
        proof: { fr: 'Comparaison de la précision de deux méthodes de sondage par intervalles de confiance, puis tests du khi-deux et V de Cramer sur l’enquête.', en: 'Comparing the precision of two sampling methods with confidence intervals, then chi-square tests and Cramér’s V on the survey.' } },
      { id: 'C3', acs: ['AC31.04'],
        proof: { fr: 'Un compte rendu où chaque ligne de code et chaque résultat sont expliqués, illustrés par des tableaux et graphiques.', en: 'A report in which every line of code and every result is explained, illustrated with tables and charts.' } }
    ],
    files: [
      { type: 'R', path: 'assets/files/projet-6/scriptSAE.R', name: { fr: 'Script R', en: 'R script' } },
      { type: 'XLSX', path: 'assets/files/projet-6/population_francaise_communes.xlsx', name: { fr: 'Population des communes (INSEE)', en: 'Municipal population (INSEE)' } },
      { type: 'PDF', path: 'assets/files/projet-6/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - Echantillonnage.pdf' }
    ]
  },

  /* ─────────────────────────── Dataviz INSEE ─────────────────────────── */
  {
    slug: 'dataviz-insee',
    featured: true,
    date: '2026-05-21', but: 1, semester: 2,
    thumb: 'assets/img/projets/dataviz-insee.jpg',
    title: { fr: 'Dataviz — Concours national', en: 'Dataviz — National Competition' },
    short: {
      fr: 'Concours national de datavisualisation avec l’INSEE : pourquoi le solde naturel de l’Île-de-France ne suit-il pas la tendance nationale ?',
      en: 'National data visualisation contest with INSEE: why doesn’t natural population growth in Île-de-France follow the national trend?'
    },
    facts: [
      { k: { fr: 'Partenaire', en: 'Partner' }, v: { fr: 'INSEE', en: 'INSEE' } },
      { k: { fr: 'Format', en: 'Format' }, v: { fr: 'Infographie', en: 'Infographic' } }
    ],
    tools: ['Power BI', 'Canva', 'Excel'],
    long: {
      fr: `## Le concours
Concours national de datavisualisation proposé aux départements Science des Données, en partenariat avec l’**INSEE**. Le principe : choisir une problématique dans les données publiques, mener l’étude et la résumer en une infographie claire et percutante.

## Notre problématique
**Pourquoi le solde naturel en Île-de-France ne suit-il pas la tendance nationale ?** Alors que les décès rattrapent les naissances dans le reste du pays, la région capitale garde un solde naturel très positif : en moyenne **70 382** par département francilien, contre **6 666** pour l’ensemble des départements français.

## Ce que montre l’infographie
- **L’urbanisation** : la part de l’urbain dense est bien plus forte en Île-de-France que dans le reste du pays
- **La structure par âge** : les 15-44 ans sont surreprésentés, portés par l’attractivité économique et universitaire, tandis que les plus de 60 ans sont proportionnellement moins nombreux
- **Les dynamiques 2016-2022** : l’Île-de-France conserve une forte croissance naturelle malgré un solde migratoire négatif, quand le reste de la France compte surtout sur l’apport migratoire

## Le défi
Sélectionner peu d’indicateurs, mais les bons, et choisir pour chacun la représentation qui se lit en un coup d’œil.`,
      en: `## The contest
A national data visualisation contest for Data Science departments, in partnership with **INSEE**, the French national statistics institute. The idea: pick a question from public data, carry out the study and sum it up in a clear, striking infographic.

## Our question
**Why doesn’t natural population growth in Île-de-France follow the national trend?** While deaths are catching up with births in the rest of the country, the capital region keeps a strongly positive natural balance: on average **70,382** per Île-de-France department, versus **6,666** across all French departments.

## What the infographic shows
- **Urbanisation**: dense urban areas weigh far more in Île-de-France than in the rest of the country
- **Age structure**: 15-44 year-olds are over-represented, drawn by economic and academic opportunities, while over-60s are proportionally fewer
- **2016-2022 dynamics**: Île-de-France keeps strong natural growth despite negative net migration, whereas the rest of France relies mostly on migration

## The challenge
Selecting few indicators, but the right ones, and choosing for each the chart that can be read at a glance.`
    },
    competences: [
      { id: 'C2', acs: ['AC21.03', 'AC21.04'],
        proof: { fr: 'Comparaison de l’Île-de-France et de la France sur le solde naturel, l’urbanisation et la pyramide des âges pour expliquer l’écart.', en: 'Comparing Île-de-France with France on natural balance, urbanisation and age pyramid to explain the gap.' } },
      { id: 'C3', acs: ['AC31.02', 'AC31.03'],
        proof: { fr: 'Une infographie construite autour de quelques chiffres clés, chacun replacé dans son contexte national.', en: 'An infographic built around a few key figures, each put in its national context.' } }
    ],
    files: [
      { type: 'PDF', path: 'assets/files/projet-8/infographie-solde-naturel-idf.pdf', name: { fr: 'Infographie finale', en: 'Final infographic' }, dl: 'Infographie - Solde naturel Ile-de-France.pdf' },
      { type: 'PDF', path: 'assets/files/projet-8/Sujet.pdf', name: { fr: 'Jeu de données du concours', en: 'Contest dataset' }, dl: 'Sujet - Dataviz INSEE.pdf' }
    ]
  },

  /* ─────────────────────── Indicateurs Fleury Michon ─────────────────────── */
  {
    slug: 'indicateurs-fleury-michon',
    featured: true,
    date: '2026-05-06', but: 1, semester: 2,
    thumb: 'assets/img/projets/indicateurs-fleury-michon.jpg',
    title: { fr: 'Construction et présentation d’indicateurs de performance', en: 'Building and Presenting Performance Indicators' },
    short: {
      fr: 'Analyse économique et financière du groupe Fleury Michon et de sa principale filiale, avec un diagnostic et un tableau de bord d’aide à la décision.',
      en: 'Economic and financial analysis of the Fleury Michon group and its main subsidiary, with a diagnosis and a decision-support dashboard.'
    },
    facts: [
      { k: { fr: 'Entreprise', en: 'Company' }, v: { fr: 'Fleury Michon', en: 'Fleury Michon' } },
      { k: { fr: 'Période', en: 'Period' }, v: { fr: '2019 — 2024', en: '2019 — 2024' } }
    ],
    tools: ['Excel', 'Word'],
    long: {
      fr: `## Contexte
Fleury Michon, entreprise vendéenne fondée en 1905, est le leader français du jambon en tranches. Le but : réaliser un dossier d’étude complet à partir de ses données publiques et des comptes de résultat de sa principale filiale, **Fleury Michon LS**.

## Partie 1 — Le groupe
- **Chiffre d’affaires** en hausse : de 705,6 M€ en 2022 à 836,2 M€ en 2024 (environ +13 % puis +5 %)
- **Taux de profitabilité** faible pour le secteur : 0,3 % en 2023, 1,23 % en 2024
- **CA et résultat par salarié** pour comparer les pôles (GMS France, international, autres secteurs) : c’est l’international qui affiche le meilleur résultat opérationnel par salarié en 2024

## Partie 2 — La filiale Fleury Michon LS (2019-2022)
- Calcul des **soldes intermédiaires de gestion** et des ratios
- Valeur ajoutée en baisse (de 193,5 M€ à 151,3 M€) sous l’effet de la hausse des matières premières
- EBE divisé par plus de deux entre 2020 et 2022, marge nette de 1,04 % contre 2,6 % pour le secteur
- Charges de personnel représentant 76,85 % de la valeur ajoutée

## Diagnostic et tableau de bord
Une entreprise commercialement solide mais à la rentabilité fragile, qui doit mieux maîtriser ses coûts. Le tout est résumé dans un **tableau de bord** visuel (activité, résultat, partage de la valeur ajoutée, productivité), avec notamment un graphique à deux axes.`,
      en: `## Context
Fleury Michon, a company from Vendée founded in 1905, is France’s leading brand of sliced ham. The goal: produce a full study file from its public data and the income statements of its main subsidiary, **Fleury Michon LS**.

## Part 1 — The group
- **Revenue** rising: from €705.6M in 2022 to €836.2M in 2024 (about +13% then +5%)
- **Profitability rate** low for the sector: 0.3% in 2023, 1.23% in 2024
- **Revenue and profit per employee** to compare divisions (French retail, international, other French sectors): international shows the best operating profit per employee in 2024

## Part 2 — The Fleury Michon LS subsidiary (2019-2022)
- Computing **intermediate management balances** and ratios
- Value added falling (from €193.5M to €151.3M) due to rising raw material costs
- Gross operating profit more than halved between 2020 and 2022, net margin of 1.04% vs 2.6% for the sector
- Staff costs accounting for 76.85% of value added

## Diagnosis and dashboard
A commercially solid company with fragile profitability, which needs to control its costs better. Everything is summed up in a visual **dashboard** (activity, profit, value-added split, productivity), including a dual-axis chart.`
    },
    competences: [
      { id: 'C2', acs: ['AC21.03'],
        proof: { fr: 'Calcul des taux de variation, SIG et ratios, puis lecture de leur évolution sur plusieurs années.', en: 'Computing growth rates, management balances and ratios, then reading how they change over several years.' } },
      { id: 'C3', acs: ['AC31.02', 'AC31.03'],
        proof: { fr: 'Choix de KPI pertinents comparés aux moyennes du secteur, et tableau de bord pensé pour la prise de décision.', en: 'Choosing relevant KPIs compared with sector averages, and a dashboard designed for decision-making.' } }
    ],
    files: [
      { type: 'PDF', path: 'assets/files/projet-9/dossier-indicateurs-performance.pdf', name: { fr: 'Dossier d’étude final', en: 'Final study file' }, dl: 'Dossier - Indicateurs de performance Fleury Michon.pdf' },
      { type: 'XLSX', path: 'assets/files/projet-9/calculs-indicateurs-fm-ls.xlsx', name: { fr: 'Comptes de résultat et calculs', en: 'Income statements and calculations' } },
      { type: 'PDF', path: 'assets/files/projet-9/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - Indicateurs de performance.pdf' }
    ]
  },

  /* ─────────────────────── Base de données GreenSD ─────────────────────── */
  {
    slug: 'base-de-donnees-greensd',
    featured: true,
    date: '2026-04-06', but: 1, semester: 2,
    thumb: 'assets/img/projets/base-de-donnees-greensd.jpg',
    title: { fr: 'Conception et implémentation d’une base de données', en: 'Database Design and Implementation' },
    short: {
      fr: 'Concevoir la base de données d’une entreprise de livraison bas-carbone et l’alimenter automatiquement à partir de fichiers CSV bruts, avec une interface graphique.',
      en: 'Designing the database of a low-carbon delivery company and filling it automatically from raw CSV files, with a graphical interface.'
    },
    facts: [
      { k: { fr: 'Entreprise fictive', en: 'Fictional company' }, v: { fr: 'GreenSD', en: 'GreenSD' } },
      { k: { fr: 'Équipe', en: 'Team' }, v: { fr: 'Binôme', en: 'Pair' } }
    ],
    tools: ['SQL', 'MySQL', 'Looping', 'Python', 'Tkinter', 'Excel'],
    long: {
      fr: `## Contexte
**GreenSD** est une entreprise de livraison bas-carbone en ville (vélos-cargo, triporteurs, utilitaires électriques). Elle veut centraliser le suivi de ses livraisons, véhicules, tournées, livreurs et de l’empreinte CO₂ de chaque colis. Ses données 2026 arrivent dans 5 fichiers CSV en vrac, imparfaits et mal structurés.

## Démarche
- **Modèle conceptuel** (MCD) réalisé avec Looping, en tenant compte des clés et contraintes
- **Modèle logique** puis script SQL de création de la base sous MySQL
- **Jeu de données de test** couvrant tous les cas prévus par les cardinalités
- **Script Python d’automatisation** qui nettoie les CSV et les importe dans la base, réutilisable les années suivantes
- **10 requêtes SQL** utiles à un décideur (GROUP BY, HAVING, différence, vue…)

## L’interface
Une application **Tkinter** sert de programme principal : consulter les tables, importer les fichiers, ajouter, modifier ou supprimer des lignes et lancer les requêtes.

## Bilan
Le projet s’est conclu par une vidéo de démonstration et de tests, présentant honnêtement ce qui fonctionne, ce qui reste à améliorer et l’usage qui a été fait de l’IA.`,
      en: `## Context
**GreenSD** is a low-carbon urban delivery company (cargo bikes, tricycles, electric vans). It wants to centralise the tracking of its deliveries, vehicles, rounds, drivers and the CO₂ footprint of each parcel. Its 2026 data comes in 5 messy, imperfect and poorly structured CSV files.

## Approach
- **Conceptual model** built with Looping, taking keys and constraints into account
- **Logical model**, then an SQL script creating the database in MySQL
- **Test dataset** covering every case allowed by the cardinalities
- **Python automation script** that cleans the CSV files and imports them into the database, reusable in future years
- **10 SQL queries** useful to a decision-maker (GROUP BY, HAVING, difference, view…)

## The interface
A **Tkinter** application acts as the main program: browse tables, import files, add, edit or delete rows and run the queries.

## Review
The project ended with a demo and testing video, honestly presenting what works, what could be improved and how AI was used.`
    },
    competences: [
      { id: 'C1', acs: ['AC11.02', 'AC11.03', 'AC11.04', 'AC11.05'],
        proof: { fr: 'Du MCD au script SQL en respectant les formalismes, puis automatisation de l’import des CSV en Python et interface Tkinter.', en: 'From conceptual model to SQL script following notation rules, then automating the CSV import in Python with a Tkinter interface.' } }
    ],
    files: [
      { type: 'PY', path: 'assets/files/projet-5/greensd_ihm.py', name: { fr: 'greensd_ihm.py — interface', en: 'greensd_ihm.py — interface' } },
      { type: 'PY', path: 'assets/files/projet-5/greensd.py', name: { fr: 'greensd.py — automatisation', en: 'greensd.py — automation' } },
      { type: 'SQL', path: 'assets/files/projet-5/greensd_create.sql', name: { fr: 'Script de création SQL', en: 'SQL creation script' } },
      { type: 'LOO', path: 'assets/files/projet-5/greensd.loo', name: { fr: 'Modèle conceptuel (Looping)', en: 'Conceptual model (Looping)' } },
      { type: 'PDF', path: 'assets/files/projet-5/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - Base de donnees GreenSD.pdf' }
    ]
  },

  /* ─────────────────────── Régression immobilier ─────────────────────── */
  {
    slug: 'regression-immobilier-niort',
    featured: true,
    date: '2026-04-05', but: 1, semester: 2,
    thumb: 'assets/img/projets/regression-immobilier-niort.jpg',
    title: { fr: 'Régression sur des données réelles', en: 'Regression on Real Data' },
    short: {
      fr: 'Prédire le prix de vente de 1 277 logements de l’agglomération niortaise grâce à des régressions linéaires simples par segment, codées en R natif.',
      en: 'Predicting the sale price of 1,277 homes around Niort with simple linear regressions per segment, coded in base R.'
    },
    facts: [
      { k: { fr: 'Données', en: 'Data' }, v: { fr: 'Ventes depuis 2021', en: 'Sales since 2021' } },
      { k: { fr: 'Équipe', en: 'Team' }, v: { fr: 'Binôme', en: 'Pair' } }
    ],
    tools: ['R', 'Word'],
    long: {
      fr: `## Contexte
À partir des ventes immobilières réalisées depuis 2021 dans la **Communauté d’Agglomération du Niortais**, construire un modèle capable d’estimer la valeur foncière de **1 277 logements** dont le prix est inconnu. Contrainte : tout coder en **R natif**, sans librairie ni fonctions lm() et predict().

## Exploration et segmentation
La valeur foncière est très asymétrique (la plupart des ventes entre 80 000 € et 300 000 €, avec des valeurs extrêmes). Deux variables structurent le marché :
- **Le type de bien** : appartements et maisons suivent des logiques de prix très différentes
- **La localisation** : Niort (pôle urbain), Chauray (commune résidentielle prisée) et les autres communes (marché plus rural)

D’où **6 segments**, en croisant commune et type de bien.

## Modélisation
Dans chaque segment, une **régression linéaire simple** relie la valeur foncière à la surface bâtie. Les coefficients sont calculés à la main par les moindres carrés (covariance et variance), puis appliqués pour produire le fichier de prédictions.

## Regard critique
Le modèle est lisible mais limité : la surface n’explique qu’une partie du prix (état, jardin, étage, année de construction sont ignorés), la relation n’est pas forcément linéaire aux extrêmes, et certains segments comptent peu d’observations.`,
      en: `## Context
Using property sales since 2021 in the **Niort urban area**, build a model that can estimate the value of **1,277 homes** whose price is unknown. Constraint: everything coded in **base R**, with no packages and no lm() or predict().

## Exploration and segmentation
Property value is highly skewed (most sales between €80,000 and €300,000, with extreme values). Two variables shape the market:
- **Property type**: flats and houses follow very different pricing logic
- **Location**: Niort (urban centre), Chauray (sought-after residential town) and the other towns (a more rural market)

Hence **6 segments**, crossing town and property type.

## Modelling
In each segment, a **simple linear regression** links property value to built surface. Coefficients are computed by hand with least squares (covariance and variance), then applied to produce the predictions file.

## Critical view
The model is readable but limited: surface only explains part of the price (condition, garden, floor and year of construction are ignored), the relationship may not be linear at the extremes, and some segments have few observations.`
    },
    competences: [
      { id: 'C2', acs: ['AC21.02', 'AC21.04'],
        proof: { fr: 'Préparation des données (conversion des surfaces, segmentation), puis étude de la liaison entre surface et prix dans chaque segment.', en: 'Preparing the data (converting surfaces, segmenting), then studying the link between surface and price in each segment.' } },
      { id: 'C3', acs: ['AC31.04'],
        proof: { fr: 'Un rapport qui détaille la démarche de segmentation, les modèles retenus et leurs limites.', en: 'A report detailing the segmentation approach, the chosen models and their limits.' } }
    ],
    files: [
      { type: 'PDF', path: 'assets/files/projet-7/Rapport.pdf', name: { fr: 'Rapport final', en: 'Final report' }, dl: 'Rapport - Regression immobilier Niort.pdf' },
      { type: 'R', path: 'assets/files/projet-7/codeR.R', name: { fr: 'Code R', en: 'R code' } },
      { type: 'CSV', path: 'assets/files/projet-7/train.csv', name: { fr: 'Données d’entraînement', en: 'Training data' } },
      { type: 'CSV', path: 'assets/files/projet-7/test.csv', name: { fr: 'Données de test', en: 'Test data' } },
      { type: 'CSV', path: 'assets/files/projet-7/to_predict.csv', name: { fr: 'Logements à prédire', en: 'Homes to predict' } },
      { type: 'PDF', path: 'assets/files/projet-7/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - Regression.pdf' }
    ]
  },

  /* ─────────────────────── Enquête téléphone ─────────────────────── */
  {
    slug: 'enquete-telephone-etudiants',
    featured: false,
    date: '2026-01-10', but: 1, semester: 1,
    thumb: 'assets/img/projets/enquete-telephone-etudiants.jpg',
    title: { fr: 'Préparation et synthèse d’un tableau de données', en: 'Data Table Preparation and Synthesis' },
    short: {
      fr: 'Mettre en valeur les résultats d’une enquête menée auprès de 373 étudiants de l’IUT de Niort sur leur usage du téléphone portable et ses effets sur la santé.',
      en: 'Presenting the results of a survey of 373 students at IUT Niort on their smartphone use and its effects on health.'
    },
    facts: [
      { k: { fr: 'Répondants', en: 'Respondents' }, v: { fr: '373 étudiants', en: '373 students' } },
      { k: { fr: 'Équipe', en: 'Team' }, v: { fr: 'Binôme', en: 'Pair' } }
    ],
    tools: ['Sphinx', 'Excel', 'Word'],
    long: {
      fr: `## La question
En France, 85 % des jeunes passent au moins 2 heures par jour sur leur téléphone. Qu’en est-il à Niort ? Nous avons exploité une enquête menée auprès de **373 étudiants** de BUT SD, GEA et HSE pour le vérifier.

## Ce que révèlent les données
- **Les usages** : les réseaux sociaux arrivent en tête (80 % des répondants), devant la musique et les vidéos ; la durée la plus citée est de 3 à 4 heures par jour
- **Le ressenti** : près de 4 étudiants sur 5 se déclarent dépendants, et 37 % disent avoir des difficultés de concentration
- **Le sommeil** : 43 % de ceux qui dorment moins de 6 heures passent plus de 5 heures par jour sur leur téléphone, contre 17 % de ceux qui dorment plus de 8 heures
- **Les comportements** : ceux qui « gardent la maîtrise » et ceux qui « regrettent leur addiction » ont des habitudes étonnamment proches

## La restitution
Le tout prend la forme d’un document de synthèse en double page, avec des graphiques choisis pour chaque message et des recommandations concrètes : téléphone hors de la chambre le soir, utilisation différée au réveil, limites de temps sur les applications.`,
      en: `## The question
In France, 85% of young people spend at least 2 hours a day on their phone. What about Niort? We used a survey of **373 students** in Data Science, Business and Health & Safety programmes to find out.

## What the data shows
- **Uses**: social media comes first (80% of respondents), ahead of music and videos; the most common answer is 3 to 4 hours a day
- **Perception**: nearly 4 students in 5 describe themselves as addicted, and 37% report concentration problems
- **Sleep**: 43% of those who sleep under 6 hours spend more than 5 hours a day on their phone, versus 17% of those who sleep over 8 hours
- **Behaviour**: students who “stay in control” and those who “regret their addiction” have surprisingly similar habits

## The deliverable
Everything is presented as a two-page summary document, with charts chosen for each message and concrete recommendations: phone out of the bedroom at night, delayed use after waking up, time limits on apps.`
    },
    competences: [
      { id: 'C2', acs: ['AC21.03', 'AC21.04'],
        proof: { fr: 'Tris à plat et tris croisés (temps d’écran × sommeil, dépendance × habitudes) mis en forme dans des graphiques adaptés.', en: 'Univariate and cross-tabulations (screen time × sleep, addiction × habits) turned into suitable charts.' } },
      { id: 'C3', acs: ['AC31.01', 'AC31.02'],
        proof: { fr: 'Résultats comparés aux chiffres nationaux et lus avec prudence (réponses déclaratives, profil des répondants).', en: 'Results compared with national figures and read with care (self-reported answers, respondent profile).' } }
    ],
    files: [
      { type: 'PDF', path: 'assets/files/projet-3/rapport-enquete-telephone.pdf', name: { fr: 'Document de synthèse', en: 'Summary document' }, dl: 'Synthese - Enquete telephone etudiants.pdf' }
    ]
  },

  /* ─────────────────────── Reporting Excel ─────────────────────── */
  {
    slug: 'reporting-excel-notes',
    featured: false,
    date: '2025-12-21', but: 1, semester: 1,
    thumb: 'assets/img/projets/reporting-excel-notes.jpg',
    title: { fr: 'Création d’un reporting', en: 'Creating a Reporting Tool' },
    short: {
      fr: 'Un outil Excel dynamique pour gérer ses notes de BUT : saisie guidée, tableau de bord et décision de jury automatique.',
      en: 'A dynamic Excel tool to manage one’s grades: guided entry, dashboard and automatic end-of-year decision.'
    },
    facts: [
      { k: { fr: 'Équipe', en: 'Team' }, v: { fr: 'Binôme', en: 'Pair' } },
      { k: { fr: 'Évaluation', en: 'Assessment' }, v: { fr: 'Livrable + oral individuel', en: 'Deliverable + individual oral' } }
    ],
    tools: ['Excel', 'VBA'],
    gallery: [
      { src: 'assets/files/projet-1/tableau-de-bord.png', caption: { fr: 'Le tableau de bord de l’outil', en: 'The tool’s dashboard' } }
    ],
    long: {
      fr: `## Le besoin
Créer, avec Excel, un **outil personnel de gestion des notes** pour la première année de BUT Science des Données, à partir des coefficients de chaque ressource et SAÉ.

## Les fonctionnalités
- Une **base de données structurée** dans Excel
- L’**ajout et la modification** de notes, avec des listes déroulantes liées (semestre, compétence, ressource ou SAÉ)
- Un **tableau de bord dynamique** par semestre, compétence et module, avec des graphiques variés
- Une **décision de jury automatique** : passage en deuxième année et compétences dont le niveau 1 est validé, selon les règles officielles
- Un guide d’utilisation

## Les choix techniques
Les fonctions Excel sont privilégiées pour les traitements simples ; le **VBA** est réservé aux traitements plus complexes, avec un code commenté, indenté et découpé en modules.`,
      en: `## The need
Build, in Excel, a **personal grade management tool** for the first year of the Data Science programme, based on the weighting of each course and project.

## Features
- A **structured database** in Excel
- **Adding and editing** grades, with linked drop-down lists (semester, competency, course or project)
- A **dynamic dashboard** by semester, competency and module, with a variety of charts
- An **automatic jury decision**: progression to second year and competencies validated at level 1, following the official rules
- A user guide

## Technical choices
Excel functions are used for simple processing; **VBA** is kept for more complex tasks, with commented, indented and modular code.`
    },
    competences: [
      { id: 'C1', acs: ['AC11.01', 'AC11.03', 'AC11.04'],
        proof: { fr: 'Une base structurée pour répondre au besoin, des listes liées et du VBA utilisé à bon escient pour les traitements complexes.', en: 'A structured database answering the need, linked lists and VBA used wisely for complex processing.' } },
      { id: 'C3', acs: ['AC31.03'],
        proof: { fr: 'Un tableau de bord qui met en avant les moyennes clés et la décision de fin d’année.', en: 'A dashboard highlighting the key averages and the end-of-year decision.' } }
    ],
    files: [
      { type: 'XLSM', path: 'assets/files/projet-1/SAE.xlsm', name: { fr: 'Outil Excel (avec macros)', en: 'Excel tool (with macros)' }, dl: 'Reporting notes - Thelio Dervieux.xlsm' },
      { type: 'PNG', path: 'assets/files/projet-1/tableau-de-bord.png', name: { fr: 'Capture du tableau de bord', en: 'Dashboard screenshot' } },
      { type: 'PDF', path: 'assets/files/projet-1/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - Reporting.pdf' }
    ]
  },

  /* ─────────────────────── Réarmement démographique ─────────────────────── */
  {
    slug: 'rearmement-demographique',
    featured: false,
    date: '2025-12-08', but: 1, semester: 1,
    thumb: 'assets/img/projets/rearmement-demographique.jpg',
    title: { fr: 'Apprendre en situation la production de données en entreprise', en: 'Learning Data Production in a Business Context' },
    short: {
      fr: 'Étude des 25 communes françaises au plus fort taux de natalité, à partir du recensement INSEE, pour conseiller le « réarmement démographique » de la France.',
      en: 'A study of the 25 French municipalities with the highest birth rates, based on the INSEE census, to advise on France’s demographic renewal.'
    },
    facts: [
      { k: { fr: 'Source', en: 'Source' }, v: { fr: 'Recensement 2022 (INSEE)', en: '2022 census (INSEE)' } },
      { k: { fr: 'Échantillon', en: 'Sample' }, v: { fr: '25 communes', en: '25 municipalities' } }
    ],
    tools: ['Excel', 'Word'],
    long: {
      fr: `## Le scénario
Pour la première fois depuis la Seconde Guerre mondiale, la France compte plus de décès que de naissances. Dans le rôle d’une cellule d’experts statisticiens, nous étudions les **25 communes du dernier centile** en taux de natalité pour aider le gouvernement à cibler ses mesures.

## Les résultats clés
- **Deux fois plus de naissances** : 20,7 ‰ en moyenne dans l’échantillon contre 11,1 ‰ en France (2016-2022), et plus de 2,5 enfants par femme contre 1,62
- **Une pyramide des âges « parfaite »** : 31 % de moins de 20 ans, un indice de vieillissement proche de 40 contre 111 au niveau national, un âge médian de 33,6 ans contre 42
- **Un marché du travail contrasté** : deux fois plus de personnes sans activité et deux fois moins de retraités qu’en France, avec un chômage des jeunes 3,5 fois plus élevé que celui des autres actifs

## Les recommandations
Une politique familiale forte (aides progressives selon le nombre d’enfants, congés parentaux, services publics) et une réflexion sur le rôle de l’immigration dans la croissance démographique.`,
      en: `## The scenario
For the first time since the Second World War, France records more deaths than births. Acting as a team of expert statisticians, we study the **25 municipalities in the top percentile** for birth rate to help the government target its measures.

## Key findings
- **Twice as many births**: 20.7‰ on average in the sample versus 11.1‰ in France (2016-2022), and more than 2.5 children per woman versus 1.62
- **A “perfect” age pyramid**: 31% under 20, an ageing index close to 40 versus 111 nationally, a median age of 33.6 versus 42
- **A contrasted labour market**: twice as many people without work and half as many retirees as in France, with youth unemployment 3.5 times higher than for other workers

## Recommendations
A strong family policy (benefits increasing with the number of children, parental leave, public services) and a reflection on the role of immigration in population growth.`
    },
    competences: [
      { id: 'C2', acs: ['AC21.01', 'AC21.03'],
        proof: { fr: 'Exploitation du recensement INSEE et calcul d’indicateurs (natalité, fécondité, indice de vieillissement, âges médian et moyen).', en: 'Using the INSEE census and computing indicators (birth rate, fertility, ageing index, median and mean age).' } },
      { id: 'C3', acs: ['AC31.02', 'AC31.03'],
        proof: { fr: 'Chaque chiffre de l’échantillon est comparé à la moyenne nationale pour en tirer des recommandations.', en: 'Every figure from the sample is compared with the national average to draw recommendations.' } }
    ],
    files: [
      { type: 'DOCX', path: 'assets/files/projet-4/rearmement-demographique.docx', name: { fr: 'Étude finale', en: 'Final study' }, dl: 'Le Rearmement Demographique de la France.docx' }
    ]
  },

  /* ─────────────────────── JSON → CSV ─────────────────────── */
  {
    slug: 'json-csv-pollution',
    featured: false,
    date: '2025-12-06', but: 1, semester: 1,
    thumb: 'assets/img/projets/json-csv-pollution.jpg',
    title: { fr: 'Écriture et lecture de fichiers de données', en: 'Reading and Writing Data Files' },
    short: {
      fr: 'Nettoyer un fichier JSON de mesures de pollution de l’air à Poitiers et le transformer en CSV propre, lisible dans Excel.',
      en: 'Cleaning a JSON file of air pollution measurements in Poitiers and turning it into a clean CSV readable in Excel.'
    },
    facts: [
      { k: { fr: 'Données', en: 'Data' }, v: { fr: 'Qualité de l’air à Poitiers', en: 'Air quality in Poitiers' } },
      { k: { fr: 'Volume', en: 'Size' }, v: { fr: 'Fichier JSON de 4 Mo', en: '4 MB JSON file' } }
    ],
    tools: ['Python', 'JSON', 'CSV'],
    long: {
      fr: `## Le jeu de données
Les concentrations moyennes horaires des principaux polluants mesurés à Poitiers : dioxyde de soufre, oxydes et dioxyde d’azote, particules PM10 et PM2.5, ozone, benzène et monoxyde de carbone.

## La mission
Écrire un **script Python** qui transforme ce fichier JSON en un fichier CSV contenant uniquement : nom de la station, latitude, longitude, date de prélèvement, polluant, valeur et unité.

## Les contraintes
- Ne garder que les **lignes complètes** et écarter les autres
- Utiliser le **point-virgule** comme séparateur
- Convertir les dates au **format français**
- Gérer les **accents** pour que le fichier s’ouvre correctement dans Excel

## La réalisation
Lecture du JSON avec gestion d’erreur si le fichier est introuvable, parcours de chaque mesure, contrôle des champs manquants, puis écriture ligne par ligne dans un CSV encodé pour Excel. Le tout dans un code commenté et indenté.`,
      en: `## The dataset
Hourly average concentrations of the main pollutants measured in Poitiers: sulphur dioxide, nitrogen oxides and dioxide, PM10 and PM2.5 particles, ozone, benzene and carbon monoxide.

## The mission
Write a **Python script** that turns this JSON file into a CSV file containing only: station name, latitude, longitude, sampling date, pollutant, value and unit.

## Constraints
- Keep only **complete rows** and drop the rest
- Use the **semicolon** as separator
- Convert dates to **French format**
- Handle **accents** so the file opens correctly in Excel

## Implementation
Reading the JSON with error handling if the file is missing, looping over each measurement, checking for missing fields, then writing line by line to a CSV encoded for Excel. All in commented, indented code.`
    },
    competences: [
      { id: 'C1', acs: ['AC11.01', 'AC11.03', 'AC11.04', 'AC11.05'],
        proof: { fr: 'Un script qui respecte précisément le format attendu, en s’appuyant sur la structure du JSON, des boucles et la gestion d’erreurs.', en: 'A script that follows the expected format precisely, relying on the JSON structure, loops and error handling.' } }
    ],
    files: [
      { type: 'PY', path: 'assets/files/projet-2/ProgrammeFinal.py', name: { fr: 'Script Python', en: 'Python script' } },
      { type: 'JSON', path: 'assets/files/projet-2/concentrations-polluants-dans-lair-ambiant.json', name: { fr: 'Données brutes (JSON)', en: 'Raw data (JSON)' } },
      { type: 'PDF', path: 'assets/files/projet-2/Sujet.pdf', name: { fr: 'Sujet du projet', en: 'Project brief' }, dl: 'Sujet - Gestion de fichiers.pdf' }
    ]
  },

  /* ─────────────────────── Territoire ─────────────────────── */
  {
    slug: 'territoire-ville-jumelee',
    featured: false,
    date: '2025-10-15', but: 1, semester: 1,
    thumb: 'assets/img/projets/territoire-ville-jumelee.jpg',
    title: { fr: 'Présentation d’un territoire économique et culturel', en: 'Presenting an Economic and Cultural Territory' },
    short: {
      fr: 'Présenter à l’oral La Seyne-sur-Mer en français, puis sa ville jumelle tunisienne, Menzel Bourguiba, en anglais : histoire, culture, économie et données.',
      en: 'An oral presentation of La Seyne-sur-Mer in French, then of its Tunisian twin town, Menzel Bourguiba, in English: history, culture, economy and data.'
    },
    facts: [
      { k: { fr: 'Villes', en: 'Towns' }, v: { fr: 'La Seyne-sur-Mer · Menzel Bourguiba', en: 'La Seyne-sur-Mer · Menzel Bourguiba' } },
      { k: { fr: 'Équipe', en: 'Team' }, v: { fr: 'Groupe de 3', en: 'Team of 3' } },
      { k: { fr: 'Langues', en: 'Languages' }, v: { fr: 'Français et anglais', en: 'French and English' } }
    ],
    tools: ['PowerPoint', 'Word'],
    long: {
      fr: `## Le principe
Premier projet du BUT, mené en groupe de 3 : présenter une ville française d’environ 60 000 habitants et sa ville jumelle, devant un amphithéâtre. Notre groupe a travaillé sur **La Seyne-sur-Mer**, dans le Var, et sur sa ville jumelle tunisienne, **Menzel Bourguiba**.

## Deux présentations, deux langues
- **En français (8 min)** : La Seyne-sur-Mer sous l’angle historique et culturel (architecture, événements, équipements), avec un focus sur son attractivité pour la génération Z
- **En anglais (8 min)** : Menzel Bourguiba sous l’angle économique (population, secteurs d’activité, métiers du numérique), appuyée par des données pertinentes

## Les attendus
Un propos structuré, fluide et clair, un contenu riche et un support PowerPoint efficace, complétés par un écrit en anglais.`,
      en: `## The idea
The first project of the programme, carried out in a team of 3: presenting a French town of about 60,000 inhabitants and its twin town, in front of a lecture hall. Our group worked on **La Seyne-sur-Mer**, in the Var department, and its Tunisian twin town, **Menzel Bourguiba**.

## Two presentations, two languages
- **In French (8 min)**: La Seyne-sur-Mer from a historical and cultural angle (architecture, events, facilities), with a focus on its appeal to Generation Z
- **In English (8 min)**: Menzel Bourguiba from an economic angle (population, business sectors, digital jobs), backed by relevant data

## Expectations
A structured, fluent and clear talk, rich content and an effective PowerPoint, plus a written piece in English.`
    },
    competences: [
      { id: 'C3', acs: ['AC31.02', 'AC31.04'],
        proof: { fr: 'Des données démographiques et économiques replacées dans leur contexte et présentées à l’oral, en français comme en anglais.', en: 'Demographic and economic data put in context and presented orally, in both French and English.' } }
    ],
    files: [
      { type: 'PDF', path: 'assets/files/projet-11/SujetSAEterritoire.pdf', name: { fr: 'Présentation du projet', en: 'Project brief' }, dl: 'Sujet - SAE Territoire.pdf' }
    ]
  }
];

/* ════════════════════════════════════════════════════════════════════
   TEXTES DES SECTIONS
   ════════════════════════════════════════════════════════════════════ */
window.TEXTS = {
  heroIntro: {
    fr: 'Étudiant en {year} de BUT Science des Données à Niort, je suis passionné par les statistiques et la manipulation de données, dans le but de fournir une analyse rigoureuse des chiffres.',
    en: '{Year}-year student in a Bachelor of Technology in Data Science in Niort, I am passionate about statistics and data manipulation, with the goal of providing rigorous numerical analysis.'
  },
  about: {
    fr: [
      'Passionné par les mathématiques et les sciences depuis toujours, j’ai naturellement orienté mon parcours vers l’analyse de données. Ce qui me fascine dans la data science, c’est cette capacité à transformer des chiffres bruts en informations pertinentes — à faire parler les données là où d’autres ne voient que du bruit.',
      'En dehors des études, le sport occupe une place centrale dans ma vie — aussi bien en le pratiquant qu’en suivant les compétitions avec passion. Cette discipline sportive nourrit ma rigueur et ma persévérance dans le travail. Aujourd’hui je joue au volley-ball avec le SUAPS, après onze ans de football en niveau régional, six ans de tennis (classé 15/2) et deux ans d’escalade : j’aime à peu près tous les sports.'
    ],
    en: [
      'Passionate about mathematics and science for as long as I can remember, I naturally steered my path towards data analysis. What fascinates me about data science is the ability to turn raw numbers into meaningful insights — to make data speak where others only see noise.',
      'Outside my studies, sport plays a central role in my life — both playing it and following competitions with passion. This discipline fuels my rigour and perseverance at work. Today I play volleyball with my university sports service, after eleven years of football at regional level, six years of tennis (ranked 15/2) and two years of climbing: I enjoy pretty much every sport.'
    ]
  },
  /* Parcours : du plus ancien au plus récent */
  timeline: [
    { years: { fr: '2024', en: '2024' }, title: { fr: 'Baccalauréat général', en: 'French Baccalauréat' }, place: { fr: 'Spécialités Mathématiques & HGGSP', en: 'Majors: Mathematics & History-Geopolitics' } },
    { years: { fr: '2024 — 2025', en: '2024 — 2025' }, title: { fr: 'Licence de Mathématiques (L1)', en: 'Bachelor’s in Mathematics (1st year)' }, place: { fr: 'Université de Bordeaux', en: 'University of Bordeaux' } },
    { years: { fr: '2025 → aujourd’hui', en: '2025 → today' }, title: { fr: 'BUT Science des Données', en: 'Bachelor of Technology in Data Science' }, place: { fr: 'Université de Poitiers · IUT de Niort', en: 'University of Poitiers · IUT Niort' }, current: true }
  ],

  /* « En bref » dans À propos ({age} et {year} sont calculés automatiquement) */
  facts: [
    { k: { fr: 'Âge', en: 'Age' }, v: { fr: '{age} ans', en: '{age} years old' } },
    { k: { fr: 'Basé à', en: 'Based in' }, v: { fr: 'Niort · Bordeaux', en: 'Niort · Bordeaux' } },
    { k: { fr: 'Formation', en: 'Studies' }, v: { fr: 'BUT SD · {year}', en: 'Data Science · {year}' } },
    { k: { fr: 'Établissement', en: 'School' }, v: { fr: 'IUT de Poitiers – Campus de Niort', en: 'IUT of Poitiers – Niort campus' } },
    { k: { fr: 'Langues', en: 'Languages' }, v: { fr: 'Français · Anglais (C1)', en: 'French · English (C1)' } },
    { k: { fr: 'Sport', en: 'Sport' }, v: { fr: 'Volley-ball au SUAPS', en: 'Volleyball (university club)' } },
    { k: { fr: 'Je recherche', en: 'Looking for' }, v: { fr: 'Stage du 5 avril au 11 juin 2027', en: 'Internship, 5 April – 11 June 2027' }, highlight: true }
  ],

  /* Ce qui me caractérise */
  values: [
    { icon: 'target', title: { fr: 'Rigueur', en: 'Rigour' }, text: { fr: 'Fournir une analyse rigoureuse des chiffres, c’est ce qui me guide dans chaque projet.', en: 'Providing a rigorous analysis of the numbers is what guides me in every project.' } },
    { icon: 'mountain', title: { fr: 'Persévérance', en: 'Perseverance' }, text: { fr: 'Face aux matières qui me résistent, je reste motivé et je progresse pas à pas.', en: 'When a subject resists me, I stay motivated and improve step by step.' } },
    { icon: 'trophy', title: { fr: 'Esprit de compétition', en: 'Competitive spirit' }, text: { fr: 'Onze ans de foot en régional, le tennis classé 15/2 : j’aime me fixer des objectifs et me dépasser.', en: 'Eleven years of regional football, tennis ranked 15/2: I like setting goals and pushing myself.' } },
    { icon: 'compass', title: { fr: 'Autonomie', en: 'Independence' }, text: { fr: 'Mettre la théorie en pratique m’a appris à chercher, tester et avancer par moi-même.', en: 'Putting theory into practice taught me to search, test and move forward on my own.' } }
  ],

  bilans: [
    {
      id: 'but1',
      label: { fr: 'BUT 1', en: 'Year 1' },
      title: { fr: 'Ma première année', en: 'My first year' },
      quote: {
        fr: 'Cette première année de BUT Science des Données a été une expérience très enrichissante, aussi bien sur le plan académique que personnel.',
        en: 'This first year of the Bachelor of Technology in Data Science has been a very enriching experience, both academically and personally.'
      },
      sections: [
        { title: { fr: 'Une découverte', en: 'A discovery' }, text: {
          fr: 'En intégrant cette formation, j’ai découvert un domaine passionnant qui combine les mathématiques, l’informatique et l’analyse de données, tout en développant une meilleure compréhension des enjeux liés à l’exploitation des données dans le monde actuel.',
          en: 'By joining this programme, I discovered a fascinating field that combines mathematics, computer science and data analysis, while developing a better understanding of the challenges surrounding the use of data in today’s world.'
        } },
        { title: { fr: 'Des compétences techniques', en: 'Technical skills' }, text: {
          fr: 'Au cours de cette année, j’ai acquis de nombreuses compétences techniques, notamment en programmation, en statistiques, en gestion de bases de données et en visualisation de données. J’ai également appris à utiliser différents outils et méthodes permettant d’analyser et d’interpréter des données de manière rigoureuse. Les projets réalisés m’ont permis de mettre en pratique les connaissances théoriques acquises en cours et de développer mon autonomie.',
          en: 'Throughout this year, I acquired many technical skills, notably in programming, statistics, database management and data visualisation. I also learned to use various tools and methods to analyse and interpret data rigorously. The projects I completed allowed me to put classroom theory into practice and develop my independence.'
        } },
        { title: { fr: 'Le travail en équipe', en: 'Teamwork' }, text: {
          fr: 'Cette année a également été l’occasion de renforcer mes compétences organisationnelles et mon travail en équipe. Les travaux de groupe et les projets collaboratifs m’ont appris à communiquer efficacement, à partager des idées et à m’adapter à différentes méthodes de travail. Ces expériences ont contribué à renforcer ma confiance en moi et ma capacité à relever de nouveaux défis.',
          en: 'This year was also an opportunity to strengthen my organisational skills and teamwork. Group assignments and collaborative projects taught me to communicate effectively, share ideas and adapt to different ways of working. These experiences helped build my self-confidence and my ability to take on new challenges.'
        } },
        { title: { fr: 'Rester persévérant', en: 'Staying persistent' }, text: {
          fr: 'Je suis particulièrement satisfait du chemin parcouru depuis le début de l’année. Malgré les exigences de la formation et les difficultés rencontrées dans certaines matières, j’ai su rester motivé et persévérant. Ces efforts m’ont permis de progresser régulièrement et de mieux définir mon projet professionnel.',
          en: 'I am particularly proud of the ground covered since the start of the year. Despite the demands of the programme and the difficulties I met in some subjects, I stayed motivated and persistent. These efforts allowed me to improve steadily and to better define my professional goals.'
        } },
        { title: { fr: 'Et maintenant ?', en: 'What comes next' }, text: {
          fr: 'Je termine donc cette première année avec beaucoup de satisfaction et d’enthousiasme pour la suite de mon parcours. Les connaissances acquises et les expériences vécues ont confirmé mon intérêt pour la science des données et me donnent envie d’approfondir davantage mes compétences lors des prochaines années du BUT.',
          en: 'I therefore end this first year with great satisfaction and enthusiasm for what comes next. The knowledge gained and the experiences lived have confirmed my interest in data science and make me want to deepen my skills further in the coming years of the programme.'
        } }
      ]
    },
    { id: 'but2', label: { fr: 'BUT 2', en: 'Year 2' }, upcoming: true }
  ]
};

/* ════════════════════════════════════════════════════════════════════
   TEXTES DE L'INTERFACE
   ════════════════════════════════════════════════════════════════════ */
window.UI = {
  fr: {
    navHome: 'Accueil', navAbout: 'À propos', navProjects: 'Projets', navReview: 'Bilan', navContact: 'Contact',
    skip: 'Aller au contenu', menu: 'Menu', close: 'Fermer',
    langSwitch: 'Switch to English', themeDark: 'Passer en mode sombre', themeLight: 'Passer en mode clair',
    heroBadge: 'Étudiant en science des données',
    heroCta: 'Voir mes projets', heroCv: 'Mon CV',
    years: 'ans', butYear: 'BUT SD · {n}',
    stickerPlace: 'Niort ↔ Bordeaux',
    statProjects: 'projets réalisés', statSkills: 'compétences du BUT', statTools: 'outils utilisés',
    aboutTitle: 'À propos de moi', aboutPath: 'Mon parcours',
    featuredTitle: 'Projets à la une', featuredAll: 'Explorer les {n} projets',
    toolsBand: 'Les outils que j’utilise',
    reviewKicker: 'Bilan', reviewRead: 'Lire le bilan complet', reviewHide: 'Replier le bilan', reviewSoon: 'Le bilan de deuxième année arrivera à la fin de l’année.',
    contactTitle: 'Une question ? Écrivez-moi.', contactKicker: 'Contact', copy: 'Copier l’adresse', copied: 'Adresse copiée',
    cvTitle: 'Curriculum Vitæ', cvSub: 'PDF · à consulter en ligne ou à télécharger', cvSoon: 'Mon CV sera bientôt disponible.',
    preview: 'Aperçu', download: 'Télécharger', open: 'Ouvrir',
    allTitle: 'Tous mes projets', allIntro: 'Chaque projet présente sa démarche, les compétences du BUT mobilisées et les fichiers rendus.',
    search: 'Rechercher un projet, un outil…', filterSkill: 'Compétence', filterYear: 'Année', all: 'Tous',
    found: '{n} projet trouvé', foundPlural: '{n} projets trouvés', noResult: 'Aucun projet ne correspond à votre recherche.', reset: 'Réinitialiser les filtres',
    upcomingYear: 'Les projets de deuxième année arrivent au fil de l’année.',
    back: 'Tous les projets', prev: 'Précédent', next: 'Suivant', nextProject: 'Projet suivant', prevProject: 'Projet précédent',
    project: 'Projet', semester: 'Semestre', date: 'Date', tools: 'Outils', files: 'Fichiers du projet', filesHint: 'Les PDF peuvent être consultés directement.',
    theProject: 'Le projet', skillsTitle: 'Compétences mobilisées', skillsSub: 'Référentiel du BUT Science des Données — niveau 1', acLabel: 'Apprentissages critiques',
    gallery: 'En images', keyHint: 'Astuce : utilisez ← et → pour passer d’un projet à l’autre.',
    pdfFallback: 'Votre navigateur ne peut pas afficher ce PDF ici.', pdfOpenTab: 'Ouvrir dans un nouvel onglet',
    notFoundTitle: 'Cette page n’existe pas', notFoundText: 'Le lien est peut-être ancien, ou la page a changé d’adresse.', notFoundCta: 'Retour à l’accueil',
    top: 'Retour en haut', footerNav: 'Liens rapides',
    aboutBrief: 'En bref', aboutValues: 'Ce qui me caractérise', aboutSkills: 'Mes compétences du BUT', aboutSkillsSub: 'Nombre de projets où chaque compétence a été mobilisée',
    aboutTools: 'Ma boîte à outils', aboutToolsSub: 'Le chiffre indique dans combien de projets je l’ai utilisé', seeProjects: 'Voir ces projets', projectsN: '{n} projets', projectsOne: '1 projet',
    nfKicker: 'Erreur 404', nfTitle: 'Cette page est une valeur aberrante.', nfText: 'Elle s’est éloignée de toutes les autres : le lien est peut-être ancien, ou la page a changé d’adresse.', nfHere: 'Vous êtes ici', nfHome: 'Retour à l’accueil', nfProjects: 'Voir les projets', nfOr: 'Ou bien direction :',
    ordinal: ['première année', 'deuxième année', 'troisième année'], ordinalShort: ['1ère année', '2ème année', '3ème année']
  },
  en: {
    navHome: 'Home', navAbout: 'About', navProjects: 'Projects', navReview: 'Review', navContact: 'Contact',
    skip: 'Skip to content', menu: 'Menu', close: 'Close',
    langSwitch: 'Passer en français', themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode',
    heroBadge: 'Data science student',
    heroCta: 'See my projects', heroCv: 'My resume',
    years: 'years old', butYear: 'Data Science · {n}',
    stickerPlace: 'Niort ↔ Bordeaux',
    statProjects: 'projects completed', statSkills: 'programme competencies', statTools: 'tools used',
    aboutTitle: 'About me', aboutPath: 'My path',
    featuredTitle: 'Featured projects', featuredAll: 'Explore all {n} projects',
    toolsBand: 'The tools I use',
    reviewKicker: 'Review', reviewRead: 'Read the full review', reviewHide: 'Collapse the review', reviewSoon: 'The second-year review will be published at the end of the year.',
    contactTitle: 'A question? Write to me.', contactKicker: 'Contact', copy: 'Copy address', copied: 'Address copied',
    cvTitle: 'Resume', cvSub: 'PDF · view online or download', cvSoon: 'My resume will be available soon.',
    preview: 'Preview', download: 'Download', open: 'Open',
    allTitle: 'All my projects', allIntro: 'Each project presents its approach, the programme competencies involved and the files submitted.',
    search: 'Search a project, a tool…', filterSkill: 'Competency', filterYear: 'Year', all: 'All',
    found: '{n} project found', foundPlural: '{n} projects found', noResult: 'No project matches your search.', reset: 'Reset filters',
    upcomingYear: 'Second-year projects will be added throughout the year.',
    back: 'All projects', prev: 'Previous', next: 'Next', nextProject: 'Next project', prevProject: 'Previous project',
    project: 'Project', semester: 'Semester', date: 'Date', tools: 'Tools', files: 'Project files', filesHint: 'PDF files can be viewed directly.',
    theProject: 'The project', skillsTitle: 'Competencies involved', skillsSub: 'Data Science programme framework — level 1', acLabel: 'Key learning outcomes',
    gallery: 'In pictures', keyHint: 'Tip: use ← and → to move between projects.',
    pdfFallback: 'Your browser cannot display this PDF here.', pdfOpenTab: 'Open in a new tab',
    notFoundTitle: 'This page doesn’t exist', notFoundText: 'The link may be outdated, or the page has moved.', notFoundCta: 'Back to home',
    top: 'Back to top', footerNav: 'Quick links',
    aboutBrief: 'At a glance', aboutValues: 'What defines me', aboutSkills: 'My programme competencies', aboutSkillsSub: 'Number of projects in which each competency was used',
    aboutTools: 'My toolbox', aboutToolsSub: 'The number shows in how many projects I used it', seeProjects: 'See these projects', projectsN: '{n} projects', projectsOne: '1 project',
    nfKicker: 'Error 404', nfTitle: 'This page is an outlier.', nfText: 'It has drifted away from everything else: the link may be outdated, or the page has moved.', nfHere: 'You are here', nfHome: 'Back to home', nfProjects: 'See the projects', nfOr: 'Or head to:',
    ordinal: ['first', 'second', 'third'], ordinalShort: ['Year 1', 'Year 2', 'Year 3']
  }
};

/* ════════════════════════════════════════════════════════════════════
   MODÈLE POUR AJOUTER UN PROJET (copier-coller dans PROJECTS)
   {
     slug: 'mon-nouveau-projet',          // adresse : #/projets/mon-nouveau-projet
     featured: false,                     // true = affiché sur l'accueil
     date: '2026-11-20', but: 2, semester: 3,
     thumb: 'assets/img/projets/mon-nouveau-projet.jpg',
     title: { fr: '…', en: '…' },
     short: { fr: '…', en: '…' },
     facts: [ { k: { fr: 'Équipe', en: 'Team' }, v: { fr: 'Binôme', en: 'Pair' } } ],
     tools: ['Python', 'R'],
     long: { fr: `## Contexte\n…`, en: `## Context\n…` },
     competences: [ { id: 'C1', acs: ['AC11.01'], proof: { fr: '…', en: '…' } } ],
     files: [ { type: 'PDF', path: 'assets/files/…/rapport.pdf', name: { fr: 'Rapport', en: 'Report' } } ]
   }
   ════════════════════════════════════════════════════════════════════ */
