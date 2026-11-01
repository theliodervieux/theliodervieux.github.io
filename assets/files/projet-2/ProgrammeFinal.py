#Importation des outils nécessaires
import json
import csv
from datetime import datetime


#Chargement du fichier JSON et gestion d'erreur
try:
    f = open("concentrations-polluants-dans-lair-ambiant.json", "r", encoding="utf-8")
    contenu = json.load(f)
except FileNotFoundError:
    print("Fichier JSON introuvable")
    contenu = []  #On est obligé de définir contenu même si le fichier est introuvable puisqu'on l'utilise plus tard

#Création du fichier CSV et ouverture d'un flux d'écriture
fichierCSV = open("FichierFinal.csv", "w", newline="", encoding="utf-8-sig")
ecritCSV = csv.writer(fichierCSV, delimiter=";")

#Éc‰riture des titres des colonnes
ecritCSV.writerow([
    "Nom_Station",
    "Latitude",
    "Longitude",
    "Date de début du prélèvement",
    "Date de fin du prélèvement",
    "Nom_Polluant",
    "Valeur",
    "Unité"
])
    
#On parcourt l'ensemble des données du fichier JSON,
#on récupère les données puis les écrit dans le fichier CSV (ligne par ligne)
for unElement in contenu:
    fields = unElement.get("fields", {})
    
    try:
        nomStation = fields["nom_station"]
        latitude = fields["y_wgs84"]
        longitude = fields["x_wgs84"]
        dateD = fields["date_debut"]
        dateF = fields["date_fin"]
        nomPollutant = fields["nom_poll"]
        valeur = fields["valeur"]
        unite = fields["unite"]
    
        #Conversion de la date de début au format français
        try:
            dateIntermediaire1 = datetime.strptime(dateD, "%Y-%m-%d")
            dateDebutFR = dateIntermediaire1.strftime("%d/%m/%Y")
        except ValueError:
            dateDebutFR = dateD
        #Conversion de la date de fin au format français
        try:
            dateInter2 = datetime.strptime(dateF, "%Y-%m-%d")
            dateFinFR = dateInter2.strftime("%d/%m/%Y")
        except ValueError:
            dateFinFR = dateF
    
        #É‰criture de la ligne dans le fichier CSV
        ecritCSV.writerow([nomStation, latitude, longitude, dateDebutFR, dateFinFR, nomPollutant, valeur, unite])
    
    except KeyError:
        #On ignore les lignes incomplètes
        continue
f.close()
fichierCSV.close()