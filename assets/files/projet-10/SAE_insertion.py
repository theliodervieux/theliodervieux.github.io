"""
process_myco.py
Outil de mise à jour du fichier résultats PCR Mycoplasmes.

Usage :
    python process_myco.py --source ./fichiers_a_traiter --resultats resultats.xlsx
    python process_myco.py --source ./fichiers_a_traiter  (crée un nouveau fichier)

Options supplémentaires :
    --verification    Affiche df_all (tableau intermédiaire) pour contrôle avant export
"""

import argparse
import re
import sys
import unicodedata
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from openpyxl import load_workbook
from openpyxl.drawing.image import Image

import pandas as pd

# ── Constantes ────────────────────────────────────────────────────────────────

# Germes de la famille mycoïdes : si absent dans un fichier source,
# la valeur de M. mycoïdes capri est copiée
FAMILLE_MYCOIDES = {"M. Capricolum", "M. putrefaciens"}

# Mois français (sans accents) -> numéro
MOIS_FR = {
    "janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
    "juin": 6, "juillet": 7, "aout": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12,
}


# ── Fonctions utilitaires ─────────────────────────────────────────────────────

def mois_vers_serie(mois: int) -> int:
    """Série 1=fév-avr, 2=juin-juil, 3=reste de l'année."""
    if mois in (2, 3, 4):
        return 1
    elif mois in (6, 7):
        return 2
    else:
        return 3



def col_source_vers_suffix(col: str) -> str:
    """
    Transforme le nom de colonne source en suffixe pour le fichier résultat.
      'M. mycoïdes capri' -> 'M mycoïdes capri'
      'M. Capricolum'     -> 'M capricolum'
    """
    sans_point = re.sub(r"M\.\s+", "M ", col, count=1)
    return sans_point[0] + sans_point[1:].lower()


def construire_col_resultat(annee: int, serie: int, suffix: str) -> str:
    """Ex : '2026_serie1.PCR M mycoïdes capri'"""
    return f"{annee}_serie{serie}.PCR {suffix}"


def normaliser_nom(s: str) -> str:
    """Enlève accents, espaces, points, met en minuscules — pour la comparaison floue."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[\s.\-_]", "", s.lower())


def trouver_feuille(resultats: dict, suffix: str):
    """
    Cherche dans les feuilles existantes celle qui correspond au germe.
    La comparaison est normalisée (accents, espaces, casse ignorés).
    """
    norm_suffix = normaliser_nom(suffix[1:])  # partie après le 'M'
    for nom in resultats:
        if norm_suffix in normaliser_nom(nom[1:]) or normaliser_nom(nom[1:]) in norm_suffix:
            return nom
    return None


def trier_colonnes(df: pd.DataFrame) -> pd.DataFrame:
    """Trie les colonnes PCR par ordre chronologique (année puis série)."""
    def cle_tri(c):
        m = re.search(r"(\d{4})_serie(\d+)", c)
        return (int(m.group(1)) * 10 + int(m.group(2))) if m else 0
    cols_pcr = sorted([c for c in df.columns if c != "N° EDE"], key=cle_tri)
    return df[["N° EDE"] + cols_pcr]


# ── Conversion des dates ──────────────────────────────────────────────────────

def convertir_dates(serie: pd.Series) -> pd.Series:
    """
    Convertit une colonne de dates pouvant contenir un mélange de :
    - Timestamps pandas ou datetime.datetime  -> to_datetime OK
    - Entiers serials Excel (ex: 45209)       -> convertis via origin='1899-12-30'
      (si traités directement par to_datetime ils donnent des dates en 1970)
    - Strings de dates                        -> to_datetime OK
    """
    serie = serie.copy().astype(object)

    # Identifier les entiers serials Excel : valeur numérique < 100 000
    valeurs_num = pd.to_numeric(serie, errors="coerce")
    masque_serial = valeurs_num.notna() & (valeurs_num < 100_000)

    if masque_serial.any():
        serie[masque_serial] = pd.to_datetime(
            valeurs_num[masque_serial].astype(int),
            unit="D",
            origin="1899-12-30",
        )

    return pd.to_datetime(serie, errors="coerce")


# ── Chargement d'un fichier source ───────────────────────────────────────────

def extraire_date_nom_fichier(nom: str):
    """Extrait (annee, mois) depuis le nom de fichier quand la colonne date est absente."""
    nom_norm = nom.lower()
    for src, dst in [("é","e"),("è","e"),("ê","e"),("û","u"),("ô","o"),("î","i"),("à","a")]:
        nom_norm = nom_norm.replace(src, dst)

    m = re.search(r"20\d{2}", nom_norm)
    if not m:
        raise ValueError(f"Année introuvable dans '{nom}'")
    annee = int(m.group())

    # Pour les noms avec tiret (mars-avril, juin-juillet, oct-nov) : prendre le premier mois
    mois = next((num for nm, num in MOIS_FR.items() if nm in nom_norm), None)
    if mois is None:
        raise ValueError(f"Mois introuvable dans '{nom}'")

    return annee, mois


def charger_fichier_source(chemin: Path):
    """
    Charge un fichier source .xls/.xlsx et retourne (df_nettoye, liste_cols_pcr).

    Gère automatiquement :
    - Header ligne 0 (fichier simple) ou 1 (avec ligne de méta-données mélanges)
    - Exclusion des colonnes de mélanges (seules les PCR individuelles sont gardées)
    - Renommage des suffixes pandas .1/.2 sur les colonnes dupliquées
    - N° EDE en float (ex: 86036066.0) -> converti en int puis str
    - Colonne date absente -> extraite depuis le nom de fichier
    - Dates serials Excel dans une colonne mixte -> corrigées
    - Remplacement 'neg' -> 40, conversion en float
    """
    engine = "xlrd" if chemin.suffix == ".xls" else "openpyxl"
    df_raw = pd.read_excel(str(chemin), header=None, engine=engine)
    row0 = [str(v) for v in df_raw.iloc[0].tolist()]
    a_ligne_meta = any("PCR" in v for v in row0)

    if a_ligne_meta:
        idx_individuel = next(
            (i for i, v in enumerate(row0) if "individuelles" in v.lower()), None
        )
        df = pd.read_excel(str(chemin), header=1, engine=engine)
        indices_pcr = (
            list(range(idx_individuel, len(df.columns)))
            if idx_individuel is not None
            else [i for i, c in enumerate(df.columns) if str(c).startswith("M.")]
        )
    else:
        df = pd.read_excel(str(chemin), header=0, engine=engine)
        indices_pcr = [i for i, c in enumerate(df.columns) if str(c).startswith("M.")]

    # Noms PCR nettoyés (.1/.2 pandas + double espace)
    noms_pcr = [re.sub(r"\.\d+$", "", df.columns[i]) for i in indices_pcr]
    noms_pcr = [re.sub(r"M\.\s+", "M. ", c) for c in noms_pcr]

    df = df.rename(columns={"Date prélvmt": "Date de prélèvement"})
    cols_all = df.columns.tolist()
    idx_date = cols_all.index("Date de prélèvement") if "Date de prélèvement" in cols_all else None
    idx_ede  = cols_all.index("N° EDE") if "N° EDE" in cols_all else None

    # Sélection positionnelle (évite les conflits de noms dupliqués)
    indices_base = [i for i in [idx_date, idx_ede] if i is not None]
    noms_base    = [cols_all[i] for i in indices_base]
    df_sel = df.iloc[:, indices_base + indices_pcr].copy()
    df_sel.columns = noms_base + noms_pcr

    # N° EDE : gérer float (86036066.0) et filtrer les lignes sans EDE valide
    df_sel["N° EDE"] = pd.to_numeric(df_sel["N° EDE"], errors="coerce")
    df_sel = df_sel[df_sel["N° EDE"].notna()]
    df_sel["N° EDE"] = df_sel["N° EDE"].astype(int).astype(str)

    # Colonne date
    if idx_date is None or df_sel["Date de prélèvement"].isna().all():
        annee, mois = extraire_date_nom_fichier(chemin.name)
        df_sel["Date de prélèvement"] = pd.Timestamp(year=annee, month=mois, day=1)
    else:
        df_sel["Date de prélèvement"] = convertir_dates(df_sel["Date de prélèvement"])

    # neg -> 40, conversion float
    df_sel = df_sel.replace("neg", 40)
    for col in noms_pcr:
        if col in df_sel.columns:
            df_sel[col] = pd.to_numeric(df_sel[col], errors="coerce")

    return df_sel, noms_pcr


# ── Chargement du fichier résultats ──────────────────────────────────────────

def trouver_col_ede(df: pd.DataFrame):
    """Retourne le nom exact de la colonne EDE dans df, quelle que soit sa casse."""
    import unicodedata
    def simplifier(s):
        s = unicodedata.normalize("NFD", str(s))
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        return re.sub(r"[\s.\-_]", "", s.lower())
    return next((c for c in df.columns if simplifier(c) == "nede" or "ede" in simplifier(c)), None)


def charger_resultats(chemin: Path) -> dict:
    """Charge toutes les feuilles du fichier résultats. Retourne {} si absent."""
    if not chemin.exists():
        return {}
    xls = pd.ExcelFile(str(chemin))
    resultats = {}
    for sheet in xls.sheet_names:
        if sheet.lower() == "scoring":
            continue
        df = pd.read_excel(str(chemin), sheet_name=sheet)
        ede_col = trouver_col_ede(df)
        if ede_col and ede_col != "N° EDE":
            df = df.rename(columns={ede_col: "N° EDE"})
        if "N° EDE" in df.columns:
            df["N° EDE"] = df["N° EDE"].astype(str)
        resultats[sheet] = df
    return resultats


# ── Fusion dans les résultats ─────────────────────────────────────────────────

def fusionner_germe(df_source: pd.DataFrame, col_pcr: str, resultats: dict) -> dict:
    """
    Met à jour la feuille correspondant à col_pcr dans resultats.
    - Crée la feuille si elle n'existe pas encore.
    - Ajoute la colonne année_serie si absente.
    - Écrase la valeur si EDE + colonne déjà présents.
    - Ajoute une ligne si l'EDE est nouveau.
    - Ignore les lignes sans valeur ou sans date valide.
    """
    suffix      = col_source_vers_suffix(col_pcr)
    nom_feuille = trouver_feuille(resultats, suffix)

    if nom_feuille is None:
        resultats[suffix] = pd.DataFrame(columns=["N° EDE"])
        nom_feuille = suffix

    df_dest = resultats[nom_feuille].copy()
    df_dest["N° EDE"] = df_dest["N° EDE"].astype(str)

    for _, row in df_source.iterrows():
        ede    = str(row["N° EDE"])
        valeur = row[col_pcr]
        date   = row["Date de prélèvement"]

        if pd.isna(date) or pd.isna(valeur):
            continue

        col_res = construire_col_resultat(date.year, mois_vers_serie(date.month), suffix)

        if col_res not in df_dest.columns:
            df_dest[col_res] = pd.NA

        masque = df_dest["N° EDE"] == ede
        if masque.any():
            df_dest.loc[masque, col_res] = valeur
        else:
            nouvelle = {"N° EDE": ede, col_res: valeur}
            df_dest = pd.concat([df_dest, pd.DataFrame([nouvelle])], ignore_index=True)

    resultats[nom_feuille] = trier_colonnes(df_dest)
    return resultats


# ── Feuille Scoring ───────────────────────────────────────────────────────────

def extraire_cle_tri(col: str):
    """Retourne (annee, serie) pour trier les colonnes PCR chronologiquement."""
    m = re.search(r"(\d{4})_serie(\d+)", col)
    return (int(m.group(1)), int(m.group(2))) if m else (0, 0)


# Ordre de gravité des notes (index = gravité, plus grand = plus grave)
GRAVITE_NOTE = {"I": 0, "A": 1, "C": 2, "E": 3, "D": 4, "G": 5, "F": 6, "H": 7, "B": 8}


def classifier_bacterie(valeurs_series: list) -> str:
    """
    Classe une bactérie selon ses valeurs sur les 6 dernières séries
    (ou moins si insuffisant), triées de la plus ancienne [0] à la plus récente [-1].

    Chaque élément de valeurs_series est la valeur Ct de la série (float, déjà filtré non-NaN).

    NEG = >= 40, POS = < 40, fort POS = < 35.
    """
    valeurs = valeurs_series  # déjà filtrées non-NaN par construire_scoring
    n = len(valeurs)

    if n == 0:
        return "I"

    dernier    = valeurs[-1]
    anterieurs = valeurs[:-1]

    nb_series      = n
    nb_pos         = sum(1 for v in valeurs if v < 40)
    nb_fort_pos    = sum(1 for v in valeurs if v < 35)
    tous_neg       = all(v >= 40 for v in valeurs)
    tous_pos       = all(v < 40  for v in valeurs)

    # A : toujours NEG — toutes les séries >= 40
    if tous_neg:
        return "A"

    # B : toujours POS — toutes les séries < 40
    if tous_pos:
        return "B"

    # C : nouveau POS — dernière série < 35, toutes les antérieures >= 40
    if (dernier < 35
            and anterieurs
            and all(v >= 40 for v in anterieurs)):
        return "C"

    # H : ancien POS — les 4 dernières séries toutes NEG, et au moins un POS avant
    if n >= 5:
        quatre_dernieres = valeurs[-4:]
        avant            = valeurs[:-4]
        if (all(v >= 40 for v in quatre_dernieres)
                and any(v < 40 for v in avant)):
            return "H"

    # D : fort POS récurrent — 3 à 5 séries POS parmi les 6, TOUTES fort POS (< 35)
    if 3 <= nb_pos <= 5 and nb_pos == nb_fort_pos:
        return "D"

    # E : autre POS récurrent — 3 à 5 séries POS, mais pas toutes fort POS
    if 3 <= nb_pos <= 5:
        return "E"

    # F : fort POS ponctuel — 1 à 2 séries POS, TOUTES fort POS (< 35)
    if 1 <= nb_pos <= 2 and nb_pos == nb_fort_pos:
        return "F"

    # G : autre POS ponctuel — 1 à 2 séries POS, mais pas toutes fort POS
    if 1 <= nb_pos <= 2:
        return "G"

    # I : statut non défini
    return "I"


def construire_scoring(resultats: dict) -> pd.DataFrame:
    """
    Construit la feuille 'scoring'.

    Logique :
    - Pour chaque n° EDE, on traite chaque bactérie (feuille) indépendamment.
    - Pour chaque bactérie, on prend les 6 dernières séries ayant une valeur non-NaN.
    - On classe chaque bactérie via classifier_bacterie().
    - On retient la bactérie avec la valeur Ct minimale.
    - En cas d'égalité de valeur min, on retient la note la plus grave selon
      l'ordre : I < A < C < E < D < G < F < H < B.

    Colonnes produites :
      n° EDE | valeur_min | bacterie_min | note
    """
    tous_edes = set()
    for df in resultats.values():
        if "N° EDE" in df.columns:
            tous_edes.update(df["N° EDE"].astype(str).tolist())
    tous_edes = sorted(tous_edes)

    lignes = []

    for ede in tous_edes:
        meilleure_note    = "I"
        meilleure_valmin  = float("nan")
        meilleure_bacterie = ""

        for nom_feuille, df in resultats.items():
            if "N° EDE" not in df.columns:
                continue
            df_ede = df[df["N° EDE"].astype(str) == ede]
            if df_ede.empty:
                continue

            # Colonnes PCR triées chronologiquement
            cols_pcr = sorted(
                [c for c in df.columns if c != "N° EDE"],
                key=extraire_cle_tri
            )

            # Garder uniquement les colonnes avec une valeur non-NaN pour cet EDE
            cols_avec_val = [
                c for c in cols_pcr
                if pd.notna(df_ede.iloc[0][c])
            ]

            # Prendre les 6 dernières séries de cette bactérie
            cols_6 = cols_avec_val[-6:]
            valeurs = [float(df_ede.iloc[0][c]) for c in cols_6]

            if not valeurs:
                continue

            note_bacterie = classifier_bacterie(valeurs)
            val_min_bacterie = min(valeurs)

            # On retient cette bactérie si :
            # 1. Sa valeur min est plus basse que la meilleure jusqu'ici, OU
            # 2. Sa valeur min est égale ET sa note est plus grave
            if (pd.isna(meilleure_valmin)
                    or val_min_bacterie < meilleure_valmin
                    or (val_min_bacterie == meilleure_valmin
                        and GRAVITE_NOTE.get(note_bacterie, 0)
                            > GRAVITE_NOTE.get(meilleure_note, 0))):
                meilleure_note     = note_bacterie
                meilleure_valmin   = val_min_bacterie
                meilleure_bacterie = nom_feuille

        ligne = {
            "N° EDE":      ede,
            "valeur_min":  meilleure_valmin,
            "bacterie":    meilleure_bacterie,
            "note":        meilleure_note,
        }
        lignes.append(ligne)

    df_scoring = pd.DataFrame(lignes)
    return df_scoring


# ── Point d'entrée ────────────────────────────────────────────────────────────

def process_data_from_tkinter(fichiers_source, chemin_resultats):

    resultats = charger_resultats(Path(chemin_resultats))

    for fichier in fichiers_source:
        fichier = Path(fichier)

        try:
            df, cols_pcr = charger_fichier_source(fichier)

            col_ref = next((c for c in cols_pcr if "myco" in c.lower()), None)

            for germe in FAMILLE_MYCOIDES:
                if germe not in cols_pcr and col_ref is not None:
                    df[germe] = df[col_ref]
                    cols_pcr.append(germe)

            for col_pcr in cols_pcr:
                resultats = fusionner_germe(df, col_pcr, resultats)

        except Exception as e:
            print(f"Erreur fichier {fichier} :", e)

    resultats_sans_scoring = {k: v for k, v in resultats.items() if k.lower() != "scoring"}
    df_scoring = construire_scoring(resultats_sans_scoring)

    with pd.ExcelWriter(str(chemin_resultats), engine="openpyxl") as writer:
        for nom_feuille, df in resultats_sans_scoring.items():
            df.to_excel(writer, sheet_name=nom_feuille, index=False)

        df_scoring.to_excel(writer, sheet_name="scoring", index=False)
        
    # ─── DASHBOARD COMPLET ─────────────────────

    # ✅ reconstruire les données propres à partir des fichiers
    dfs = []
    for f in fichiers_source:
        df_temp, _ = charger_fichier_source(Path(f))
        dfs.append(df_temp)

    df = pd.concat(dfs, ignore_index=True)

    # ✅ nettoyage minimal
    df = df.replace("neg", 40)

    df["Date de prélèvement"] = pd.to_datetime(df["Date de prélèvement"], errors="coerce")
    df = df.dropna(subset=["Date de prélèvement"])

    df["mois"] = df["Date de prélèvement"].dt.strftime("%Y-%m")

    colonnes = [c for c in df.columns if str(c).startswith("M.")]

    if colonnes:

        stats = df.groupby("mois")[colonnes] \
                  .apply(lambda x: (x == 40).sum()) \
                  .reset_index()

        # ───────────── GRAPH 1 : évolution négatifs ─────────────
        plt.figure(figsize=(8,5))
        for col in colonnes:
            if col in stats.columns:
                plt.plot(stats["mois"], stats[col], marker="o", label=col)

        plt.title("Evolution PCR négatives")
        plt.xticks(rotation=45)
        plt.legend()
        plt.tight_layout()
        plt.savefig("graph1.png")
        plt.close()

        # ───────────── GRAPH 2 : évolution catégories (scoring) ─────────────
        counts = df_scoring["note"].value_counts()

        plt.figure()
        counts.plot(kind="bar")
        plt.title("Répartition des catégories")
        plt.savefig("graph2.png")
        plt.close()

        # ───────────── GRAPH 3 : proportion catégories ─────────────
        plt.figure()
        counts.plot(kind="pie", autopct="%1.1f%%")
        plt.title("Proportion des catégories")
        plt.ylabel("")
        plt.savefig("graph3.png")
        plt.close()
        
        # ───────────── GRAPH 4 : évolution statut cheptels (%) ─────────────

        # ✅ fusion scoring + dates
        col_ede = "N° EDE"
        
        df_dates = df[[col_ede, "Date de prélèvement"]].drop_duplicates()
        df_dates["annee"] = pd.to_datetime(df_dates["Date de prélèvement"]).dt.year
        
        df_scoring_merge = df_scoring.merge(df_dates, on=col_ede, how="left")
        
        # ✅ classification
        def classer_statut(note):
            if note == "A":
                return "Sain"
            elif note in ["C", "E", "G"]:
                return "Intermédiaire"
            else:
                return "Problématique"
        
        df_scoring_merge["statut"] = df_scoring_merge["note"].apply(classer_statut)
        
        # ✅ groupement
        stats_statut = df_scoring_merge.groupby(["annee", "statut"]).size().unstack(fill_value=0)
        
        # ✅ ordre colonnes (important)
        stats_statut = stats_statut[["Sain", "Intermédiaire", "Problématique"]]
        
        # ✅ transformation en %
        total = stats_statut.sum(axis=1)
        stats_pct = stats_statut.div(total, axis=0) * 100
        
        # ✅ graphique
        plt.figure(figsize=(8,5))
        
        plt.stackplot(
            stats_pct.index,
            stats_pct["Sain"],
            stats_pct["Intermédiaire"],
            stats_pct["Problématique"],
            labels=["Sain", "Intermédiaire", "Problématique"],
            colors=["#4CAF50", "#FFA726", "#EF5350"]
        )
        
        # ✅ titres et axes
        plt.title("Évolution du statut sanitaire des cheptels dans le temps")
        plt.xlabel("Année")
        plt.ylabel("Répartition (%)")
        plt.ylim(0, 100)
        
        # ✅ légende
        plt.legend(loc="upper left")
        
        # ✅ mise en page
        plt.tight_layout()
        
        # ✅ sauvegarde
        plt.savefig("graph4.png")
        plt.close()

        # ───────────── KPI ─────────────

        total = len(df)
        negatifs = (df[colonnes] == 40).any(axis=1).sum()
        pourcentage_neg = round((negatifs / total) * 100, 1)

        
        col_ede = next((c for c in df.columns if "ede" in str(c).lower()), None)
        
        if col_ede is None:
            raise Exception(f"EDE introuvable : {df.columns}")
        
        nb_cheptels = df[col_ede].nunique()


        positifs = total - negatifs
        taux_pos = round((positifs / total) * 100, 1)

        freq = df[colonnes].apply(lambda x: (x < 40).sum())
        bact_max = freq.idxmax()

        # ───────────── insertion Excel ─────────────

        wb = load_workbook(str(chemin_resultats))

        if "Dashboard" in wb.sheetnames:
            del wb["Dashboard"]

        ws = wb.create_sheet("Dashboard")

        # ✅ images
        ws.add_image(Image("graph1.png"), "B2")
        ws.add_image(Image("graph2.png"), "B22")
        ws.add_image(Image("graph3.png"), "H2")
        ws.add_image(Image("graph4.png"), "H22")

        # ✅ KPI texte
        ws["B15"] = f"% négatifs : {pourcentage_neg}%"
        ws["B16"] = f"Nb cheptels : {nb_cheptels}"
        ws["B17"] = f"Taux positifs : {taux_pos}%"
        ws["B18"] = f"Bactérie dominante : {bact_max}"

        wb.save(str(chemin_resultats))