import pandas
import unicodedata
import re
partenaire = pandas.read_csv("partenaire.csv", encoding='latin1', header = 0, sep = ";")
tournee = pandas.read_csv("tournee.csv",dtype = str,  encoding='latin1', header = 0, sep = ";")
livraison = pandas.read_csv("livraison.csv", encoding='latin1', header = 0, sep = ";")
entree = pandas.read_csv("entree.csv", encoding='latin1', header = 0, sep = ";")

vehicule_livreur = pandas.read_csv("vehicule_livreur.csv", encoding='latin1', header = 0, sep = ";")
livreur = vehicule_livreur.drop(columns =["typeVeh","autonomie","capacite", "nb Vehicule"])
vehicule = vehicule_livreur.drop(columns =["nomLivreur","prenomLivreur","dateEmbauche"])
del vehicule_livreur

def controleSaisieVehicule(df: pandas.DataFrame, colonne: str) -> pandas.DataFrame:
    df[colonne] = df[colonne].str.replace(r'\s*', '', regex=True)
    df[colonne] = df[colonne].str.replace(r'utilitaire\s*electrique', 'Utilitaire Electrique', flags=re.IGNORECASE, regex=True)
    df[colonne] = df[colonne].str.replace(r'triporteur', 'Triporteur', flags=re.IGNORECASE, regex=True)
    df[colonne] = df[colonne].str.replace(r'velo\s*\-?\s*cargo', 'Velo Cargo', flags=re.IGNORECASE, regex=True)
    df[colonne] = df[colonne].str.replace(r'utilitaireelec', 'Utilitaire Electrique', flags=re.IGNORECASE, regex=True)
    return df
def TranstyperInt(valeurATranstyper):
    try:
        return int(valeurATranstyper)
    except (ValueError, TypeError):
        return None
def premiersNettoyages(df: pandas.DataFrame) -> pandas.DataFrame:
    """
    Nettoie un DataFrame en appliquant sur chaque cellule string :
    - Suppression des espaces en début/fin
    - Remplacement des '_' par ' ' et 'and' par '&'
    - Suppression des accents
    - Mise en majuscule de chaque début de mot (Title Case)
    Puis supprime les doublons.
    """

    def uniformer(val):
        if not isinstance(val, str):
            return val
        
        val = val.strip()                                  # Espaces début/fin
        val = val.replace("_", " ")                        # _ → espace
        val = val.replace(" and ", "&")                  # and → &
        val = unicodedata.normalize("NFD", val)            # Décompose les accents
        val = "".join(c for c in val if unicodedata.category(c) != "Mn")
        val = val.title()                                 # Majuscule chaque mot
        
        return val

    df = df.map(uniformer)   # Applique sur chaque cellule
    df = df.drop_duplicates()    # Supprime les doublons
    return df
def split_adresse(adresse):
    """
    Tente de décomposer une adresse en (rue, cp, ville).
    Retourne (adresse_originale, None, None) si la décomposition est impossible.
    """
    if not isinstance(adresse, str):
        return None, None, None

    # Nettoyage : retire virgules, tirets, espaces multiples
    adresse_clean = re.sub(r'[,\-]', ' ', adresse)
    adresse_clean = re.sub(r' +', ' ', adresse_clean).strip()

    # Cherche un code postal (5 chiffres)
    cp_match = re.search(r'\b(\d{5})\b', adresse_clean)

    if cp_match:
        cp = cp_match.group(1)
        # Ce qui est avant le CP = rue, ce qui est après = ville
        avant_cp = adresse_clean[:cp_match.start()].strip()
        apres_cp = adresse_clean[cp_match.end():].strip()

        rue  = avant_cp.title() if avant_cp else None
        ville = apres_cp.title() if apres_cp else None
        return rue, cp, ville
    else:
        # Pas de CP trouvé — on garde l'adresse brute dans "rue", ville/cp à None
        return adresse_clean.title(), None, None

#---------------------------------------------PARTENAIRE-------------------------------------------------------------------
partenaire['ville'] = partenaire['ville'].str.strip()
partenaire['nomPartenaire'] = partenaire['nomPartenaire'].str.strip()

partenaire['ville'] = partenaire['ville'].apply(lambda v: v.title() if isinstance(v, str) else v)
partenaire['nomPartenaire'] = partenaire['nomPartenaire'].apply(
    lambda v: ''.join(c for c in unicodedata.normalize('NFD', v) if unicodedata.category(c) != 'Mn').title()
    if isinstance(v, str) else v)
partenaire = partenaire.drop_duplicates()

#---------------------------------------------LIVRAISON--------------------------------------------------------------------

livraison = premiersNettoyages(livraison)

"Enleve kg puis transtype en int"
livraison["poids total"] = livraison["poids total"].apply(
    lambda v: v.replace("Kg", "").replace("kg", "") if isinstance(v, str) else v)
        
livraison["poids total"] = livraison["poids total"].apply(TranstyperInt)
livraison  = controleSaisieVehicule(livraison, "véhicule")
livraison["ville_client"] = livraison["ville_client"].apply(
    lambda val: "La Rochelle" if isinstance(val, str) and re.search(r'la.*rochelle', val, flags=re.IGNORECASE) else val
)

livraison[["rue", "CP", "ville"]] = livraison["adresse_complete"].apply(
    lambda val: pandas.Series(split_adresse(val))
)

livraison = livraison.drop(columns=["adresse_complete"])
livraison = livraison.drop_duplicates()
livraison = livraison.drop(columns=["date_sortie"])
#---------------------------------------------ENTREE------------------------------------------------------------------------
entree = premiersNettoyages(entree)
entree["date_entree"] = pandas.to_datetime(entree["date_entree"], format="%d/%m/%Y").dt.strftime("%Y/%m/%d")


#---------------------------------------------VEHICULE----------------------------------------------------------------------
vehicule = vehicule.dropna()
vehicule   = controleSaisieVehicule(vehicule, "typeVeh")
#---------------------------------------------LIVREUR-----------------------------------------------------------------------
livreur = livreur.dropna()  # Supprime les lignes avec données manquantes

# title() et suppression des accents sur les colonnes str
for col in ["nomLivreur", "prenomLivreur"]:
    livreur[col] = livreur[col].apply(lambda val: val.strip().title() if isinstance(val, str) else val)
    livreur[col] = livreur[col].apply(lambda val: ''.join(
        c for c in unicodedata.normalize('NFD', val) if unicodedata.category(c) != 'Mn'
    ) if isinstance(val, str) else val)

livreur["dateEmbauche"] = pandas.to_datetime(livreur["dateEmbauche"], dayfirst=True).dt.strftime("%Y/%m/%d")
#---------------------------------------------TOURNEE--------------------------------------------------------
tournee["autonomie"] = tournee["autonomie"].apply(TranstyperInt)
tournee["capacite"]  = tournee["capacite"].apply(TranstyperInt)
tournee    = controleSaisieVehicule(tournee, "vehicule")

import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    "host":     "localhost",
    "user":     "root",
    "password": "",
    "database": "greensd",
    "port":     3306,
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

# ─────────────────────────────────────────────────────────────────────────────
#  PARTENAIRE
# ─────────────────────────────────────────────────────────────────────────────
def inserer_partenaire(df):
    conn   = get_connection()
    cursor = conn.cursor()
    ok, skip = 0, 0
    for _, row in df.iterrows():
        try:
            cursor.execute(
                "INSERT IGNORE INTO Partenaire (nomPartenaire, ville) VALUES (%s, %s)",
                (row["nomPartenaire"], row["ville"])
            )
            ok += 1 if cursor.rowcount > 0 else 0
            skip += 1 if cursor.rowcount == 0 else 0
        except Error as e:
            print(f"  [Partenaire] Erreur : {e}")
    conn.commit(); cursor.close(); conn.close()
    print(f"  [Partenaire] {ok} insérés, {skip} doublons ignorés.")

# ─────────────────────────────────────────────────────────────────────────────
#  LIVREUR
# ─────────────────────────────────────────────────────────────────────────────
def inserer_livreur(df):
    conn   = get_connection()
    cursor = conn.cursor()
    ok, skip = 0, 0
    for _, row in df.iterrows():
        try:
            # Vérifie si le livreur existe déjà
            cursor.execute(
                """SELECT COUNT(*) FROM Livreur 
                   WHERE nomLivreur = %s AND prenomLivreur = %s AND dateEmbauche = %s""",
                (
                    row["nomLivreur"],
                    row["prenomLivreur"],
                    row["dateEmbauche"] if pandas.notna(row["dateEmbauche"]) else None,
                )
            )
            if cursor.fetchone()[0] > 0:
                skip += 1
                continue

            cursor.execute(
                """INSERT INTO Livreur
                   (IdLivreur, nomLivreur, prenomLivreur, dateEmbauche)
                   VALUES (NULL, %s, %s, %s)""",
                (
                    row["nomLivreur"],
                    row["prenomLivreur"],
                    row["dateEmbauche"] if pandas.notna(row["dateEmbauche"]) else None,
                )
            )
            ok += 1
        except Error as e:
            print(f"  [Livreur] Erreur : {e}")
    conn.commit(); cursor.close(); conn.close()
    print(f"  [Livreur] {ok} insérés, {skip} doublons ignorés.")
# ─────────────────────────────────────────────────────────────────────────────
#  TYPEVEHICULE + VEHICULE
# ─────────────────────────────────────────────────────────────────────────────
def inserer_type_vehicule_et_vehicule(df):
    conn   = get_connection()
    cursor = conn.cursor()
    ok, skip = 0, 0
    for _, row in df.iterrows():
        try:
            # Récupère ou insère le type de véhicule
            cursor.execute("SELECT IdType FROM TypeVehicule WHERE LibelType = %s", (row["typeVeh"],))
            result = cursor.fetchone()
            if result:
                id_type = result[0]
            else:
                cursor.execute(
                    "INSERT INTO TypeVehicule (LibelType) VALUES (%s)", (row["typeVeh"],)
                )
                id_type = cursor.lastrowid
            
            cursor.execute(
                """SELECT COUNT(*) FROM Vehicule 
                   WHERE autonomie = %s AND capacite = %s AND nbVeh = %s AND IdType = %s""",
                (
                    TranstyperInt(row["autonomie"]),
                    TranstyperInt(row["capacite"]),
                    TranstyperInt(row["nb Vehicule"]),
                    id_type,
                )
            )
            if cursor.fetchone()[0] > 0:
                skip += 1
                continue
            
            cursor.execute(
                """INSERT INTO Vehicule (IdVeh, autonomie, capacite, nbVeh, IdType)
                   VALUES (NULL, %s, %s, %s, %s)""",
                (
                    TranstyperInt(row["autonomie"]),
                    TranstyperInt(row["capacite"]),
                    TranstyperInt(row["nb Vehicule"]),
                    id_type,
                )
            )

            ok += 1
        except Error as e:
            print(f"  [Vehicule] Erreur : {e}")

    conn.commit(); cursor.close(); conn.close()
    print(f"  [Vehicule] {ok} insérés, {skip} doublons ignorés.")


# ─────────────────────────────────────────────────────────────────────────────
#  ENTREE
# ─────────────────────────────────────────────────────────────────────────────
def inserer_entree(df):
    conn   = get_connection()
    cursor = conn.cursor()
    ok, skip = 0, 0
    for _, row in df.iterrows():
        try:
            cursor.execute(
                """SELECT COUNT(*) FROM entree
                   WHERE date_entree = %s AND quantite_colis = %s AND nomPartenaire = %s""",
                (
                    row["date_entree"] if pandas.notna(row["date_entree"]) else None,
                    TranstyperInt(row["quantite colis"]),
                    row["partenaire"],
                )
            )
            if cursor.fetchone()[0] > 0:
                skip += 1
                continue

            cursor.execute(
                """INSERT INTO entree
                   (IdEntree, date_entree, quantite_colis, nomPartenaire)
                   VALUES (NULL, %s, %s, %s)""",
                (
                    row["date_entree"] if pandas.notna(row["date_entree"]) else None,
                    TranstyperInt(row["quantite colis"]),
                    row["partenaire"],
                )
            )
            ok += 1
        except Error as e:
            print(f"  [Entree] Erreur : {e}")
    conn.commit(); cursor.close(); conn.close()
    print(f"  [Entree] {ok} insérées, {skip} doublons ignorés.")


# ─────────────────────────────────────────────────────────────────────────────
#  TOURNEE
# ─────────────────────────────────────────────────────────────────────────────
def inserer_tournee(df):
    """
    Pour chaque ligne de tournee.csv :
    - Résolution IdLivreur via colonne 'livreur' (prénom nom ou nom prénom)
    - Résolution IdVeh via colonne 'vehicule' (typeVeh)
    - Insertion dans Tournee
    """
    conn   = get_connection()
    cursor = conn.cursor()

    # Charge tous les livreurs en mémoire
    cursor.execute("SELECT IdLivreur, nomLivreur, prenomLivreur FROM Livreur")
    livreurs_db = cursor.fetchall()   # [(id, nom, prenom), ...]

    # Charge les véhicules via leur type
    cursor.execute("""
        SELECT v.IdVeh, t.LibelType
        FROM   Vehicule v
        JOIN   TypeVehicule t ON t.IdType = v.IdType
    """)
    vehicules_db = cursor.fetchall()  # [(idVeh, libelType), ...]

    def resoudre_livreur(val):
        """Cherche l'id livreur à partir d'une chaîne 'Prenom Nom' ou 'Nom Prenom'."""
        if not isinstance(val, str):
            return None
        val_clean = val.strip().title()
        parts = val_clean.split()
        for (id_l, nom, prenom) in livreurs_db:
            if set(parts) == {nom, prenom}:
                return id_l
        return None

    def resoudre_vehicule(val):
        """Retourne le premier IdVeh dont le type correspond."""
        if not isinstance(val, str):
            return None
        val_clean = val.strip().title()
        for (id_v, libel) in vehicules_db:
            if libel.strip().title() == val_clean:
                return id_v
        return None

    ok, err = 0, 0
    for _, row in df.iterrows():
        id_livreur = resoudre_livreur(row["livreur"])
        id_veh     = resoudre_vehicule(row["vehicule"])

        if id_livreur is None or id_veh is None:
            print(f"  [Tournee] Ligne {_} ignorée — livreur={row['livreur']} veh={row['vehicule']}")
            err += 1
            continue

        try:
            cursor.execute(
                """INSERT INTO Tournee
                   (IdTournee, quantite_colis, dateTour, distance, IdLivreur, IdVeh)
                   VALUES (NULL, %s, %s, %s, %s, %s)""",
                (
                    0,           # quantite_colis sera mis à jour après insertion livraisons
                    row["dateTour"] if pandas.notna(row["dateTour"]) else None,
                    0,           # distance non présente dans le CSV → valeur par défaut
                    id_livreur,
                    id_veh,
                )
            )
            ok += 1
        except Error as e:
            err += 1
            print(f"  [Tournee] Erreur : {e}")

    conn.commit(); cursor.close(); conn.close()
    print(f"  [Tournee] {ok} insérées, {err} erreurs/ignorées.")

# ─────────────────────────────────────────────────────────────────────────────
#  LIVRAISON
# ─────────────────────────────────────────────────────────────────────────────
def inserer_livraison(df):
    """
    Résolution IdTournee via colonnes 'livreur' + 'véhicule' + date
    (on prend la tournée correspondante).
    """
    conn   = get_connection()
    cursor = conn.cursor()

    # Charge toutes les tournées avec leur livreur et véhicule
    cursor.execute("""
        SELECT t.IdTournee, l.nomLivreur, l.prenomLivreur, tv.LibelType, t.dateTour
        FROM   Tournee t
        JOIN   Livreur      l  ON l.IdLivreur = t.IdLivreur
        JOIN   Vehicule     v  ON v.IdVeh     = t.IdVeh
        JOIN   TypeVehicule tv ON tv.IdType   = v.IdType
    """)
    tournees_db = cursor.fetchall()
    # (IdTournee, nom, prenom, libelType, dateTour)

    def resoudre_tournee(livreur_val, veh_val):
        if not isinstance(livreur_val, str):
            return None
        parts = livreur_val.strip().title().split()
        veh_clean = veh_val.strip().title() if isinstance(veh_val, str) else ""
        for (id_t, nom, prenom, libel, _) in tournees_db:
            if set(parts) == {nom, prenom} and libel.strip().title() == veh_clean:
                return id_t
        return None

    ok, err = 0, 0
    for _, row in df.iterrows():
        id_tournee = resoudre_tournee(row["livreur"], row["véhicule"])
        if id_tournee is None:
            print(f"  [Livraison] Ligne {_} ignorée — tournée introuvable")
            err += 1
            continue
        try:
            poids = float(row["poids total"]) if pandas.notna(row["poids total"]) else None
            cursor.execute(
                """INSERT INTO Livraison
                   (IdLivra, client, poids_total, ville_client,
                    quantite_colis, code_postal, rue, IdTournee)
                   VALUES (NULL, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    row["client"],
                    poids,
                    row["ville_client"],
                    TranstyperInt(row["nb colis"]),
                    str(row["CP"])[:5] if pandas.notna(row["CP"]) else None,
                    row["rue"],
                    id_tournee,
                )
            )
            ok += 1
        except Error as e:
            err += 1
            print(f"  [Livraison] Erreur : {e}")

    conn.commit(); cursor.close(); conn.close()
    print(f"  [Livraison] {ok} insérées, {err} erreurs/ignorées.")

# ─────────────────────────────────────────────────────────────────────────────
#  ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────
def inserer_tous_les_csv():
    etapes = [
        ("Partenaire",              lambda: inserer_partenaire(partenaire)),
        ("Livreur",                 lambda: inserer_livreur(livreur)),
        ("TypeVehicule + Vehicule", lambda: inserer_type_vehicule_et_vehicule(vehicule)),
        ("Entree",                  lambda: inserer_entree(entree)),
        ("Tournee",                 lambda: inserer_tournee(tournee)),
        ("Livraison",               lambda: inserer_livraison(livraison)),
    ]
    for nom, fn in etapes:
        print(f"\n── {nom} ──────────────────────────────")
        try:
            fn()
        except Exception as e:
            print(f"  ✘ ERREUR fatale sur {nom} : {e}")
            raise

if __name__ == "__main__":
    inserer_tous_les_csv()