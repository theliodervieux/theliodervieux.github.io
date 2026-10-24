# Chargement des 2 fichiers csv
train   <- read.csv2("train.csv")
to_pred <- read.csv2("to_predict.csv")

# Conversion de la surface en numérique
to_pred$Surface.reelle.bati <- as.numeric(to_pred$Surface.reelle.bati)
train$Surface.reelle.bati   <- as.numeric(train$Surface.reelle.bati)

# Mise en majuscules pour éviter les erreurs de comparaison
train$Commune   <- toupper(train$Commune)
to_pred$Commune <- toupper(to_pred$Commune)

# Nettoyage des données train
train <- train[!is.na(train$Surface.reelle.bati) &
                 !is.na(train$Valeur.fonciere), ]

# Création de la fonction de segmentation :
# 1 : Chauray / Appartement
# 2 : Chauray / Maison
# 3 : Niort / Appartement
# 4 : Niort / Maison
# 5 : Hors Niort et Chauray / Appartement
# 6 : Maison / autres communes

seg <- function(type, commune, code_postal) {
  ifelse(commune == "CHAURAY" & type == "Appartement", 1L,
         ifelse(commune == "CHAURAY" & type == "Maison",      2L,
                ifelse(commune == "NIORT"   & type == "Appartement", 3L,
                       ifelse(commune == "NIORT"   & type == "Maison",      4L,
                              ifelse(!(commune %in% c("NIORT", "CHAURAY")) & type == "Appartement", 5L,
                                     6L)))))
}

# Application segmentation
train$segment   <- seg(train$Type.local,   train$Commune,   train$Code.postal)
to_pred$segment <- seg(to_pred$Type.local, to_pred$Commune, to_pred$Code.postal)

# Calcul des coefficients a et b
calc_ab <- function(x, y) {
  covariance <- mean(x*y) - mean(x)*mean(y)
  variancex  <- mean(x^2) - mean(x)^2
  
  # Sécurité si variance nulle
  if (variancex == 0) {
    return(c(a = 0, b = mean(y)))
  }
  
  a <- covariance / variancex
  b <- mean(y) - a * mean(x)
  
  return(c(a = a, b = b))
}

# Liste des segments
segments <- sort(unique(train$segment))

# Stockage des coefficients
coeffs <- list()

# Calcul pour chaque segment
for (s in segments) {
  data_seg <- train[train$segment == s, ]
  
  x <- data_seg$Surface.reelle.bati
  y <- data_seg$Valeur.fonciere
  
  coeffs[[as.character(s)]] <- calc_ab(x, y)
}

# 5. Calcul des prédictions
to_pred$Valeur.fonciere <- NA

for (s in segments) {
  idx <- which(to_pred$segment == s)
  
  a <- coeffs[[as.character(s)]]["a"]
  b <- coeffs[[as.character(s)]]["b"]
  
  to_pred$Valeur.fonciere[idx] <-
    to_pred$Surface.reelle.bati[idx] * a + b
}

# Création du fichier final avec id et prédiction du prix
sortie <- to_pred[, c("id", "Valeur.fonciere")]

# Écriture du fichier CSV
write.csv2(sortie, file = "prediction.csv", row.names = FALSE)
