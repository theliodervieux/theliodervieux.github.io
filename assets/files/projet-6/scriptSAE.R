setwd("Z:/SAÉ - Statistique Inférentielle")
library(sampling) #Importation de la librairie

#Importation du jeu de données
commune <- read.csv2("population_francaise_communes_table.csv") 
#Filtre pour ne garder que les communes de Nouvelle-Aquitaine ainsi que les colonnes qui nous intéressent
donnees<- commune[commune$X.1 == "Nouvelle-Aquitaine",c("X.2", "X.6", "X.9")]
head(donnees) #Affichage des 6 premières lignes


U <- donnees[,c("X.6"), drop = FALSE]
head(U)
N <- nrow(U)
N

# Nombre d'habitant
T <- sum(as.numeric(donnees$X.9))
head(T)


# on garde les resultats dans ce tableau
resultats <- data.frame(
  pop_totale = numeric(),
  pop_estimee = numeric(),
  IDC = character(),
  marge = numeric()
)


for (i in 1:10) {
  
  # Tirage aleatoire simple d’un echantillon de taille n=100
  n<-100
  E<-sample(U[[1]], n)
  head(E)
  
  donnees1 <- donnees[donnees$X.6 %in% E, ]
  head(donnees1)
  
  
  # moyenne d’\’echantillon
  xbar= mean(as.numeric(donnees1$X.9))
  xbar
  # IDC de \mu
  idcmoy = t.test(as.numeric(donnees1$X.9))$conf.int
  idcmoy
  
  # Nbre d’habitants total estim\’e
  T_est = N*xbar
  T_est
  
  # IDC de T
  idcT = idcmoy*N
  idcT
  # marge d’erreur
  marge=(idcT[2]-idcT[1])/2
  marge
  
  
  # ajout des résultats dans le tableau resultats
  resultats[i, ] <- c(
    T,
    round(T_est,2),
    paste("[", round(idcT[1],2), "/", round(idcT[2]),2,"]"),
    round(marge,2)
  )
  
}


write.csv2(resultats,"resultats.csv")




#Partie 1.2


donnees$X.9 <- as.integer(donnees$X.9) # Transtypage du nombre d'habitants en nombre entier
datastrat = donnees[order(donnees$X.9), ] # Tri du dataframe par ordre croissant du nombre d'habitants
datastrat$strate <- ceiling(seq_len(nrow(datastrat)) / (nrow(datastrat) / 4)) # Création des 4 strates correspondant aux 4 quartiles
head(datastrat) #Affichage des 6 premières lignes
Nh=table(datastrat$strate)
# effectif des strates
Nh
N=sum(Nh)
N
# Poids des strates
gh=round(Nh/N,3)
gh



# on garde les resultats dans ce tableau
resultatsStrates <- data.frame(
  pop_totale = numeric(),
  pop_estimee = numeric(),
  IDC = character(),
  marge = numeric()
)



for (i in 1:10) {
  # Tirage d’un echantillon stratifi\’e de taille 100
  n=100
  nh=round(c(n*Nh[1]/N, n*Nh[2]/N, n*Nh[3]/N, n*Nh[4]/N))
  nh
  # taux de sondage ds les strates
  fh=nh/Nh
  # sondage strat (sans remise dans les strates)
  st = strata(datastrat, stratanames = c("strate"), size = nh, method = "srswr")
  data1=getdata(datastrat, st)
  head(data1)
  #Définition des échantillons
  ech1=data1[data1$strate==1, ]
  ech2=data1[data1$strate==2, ]
  ech3=data1[data1$strate==3, ]
  ech4=data1[data1$strate==4, ]
  # Moyennes des 4 sous-echantillons
  m1=mean(ech1$X.9)
  m2=mean(ech2$X.9)
  m3=mean(ech3$X.9)
  m4=mean(ech4$X.9)
  # Variances des 4 sous-echantillons
  var1=var(ech1$X.9)
  var2=var(ech2$X.9)
  var3=var(ech3$X.9)
  var4=var(ech4$X.9)
  # Moyenne des 4 echant reunis
  Xbarst= (Nh[1]*m1 + Nh[2]*m2 + Nh[3]*m3 + Nh[4]*m4)/N
  # estimation de la variance de Xbarst
  varXbarst= ((gh[1])^2)*(1-fh[1])*var1/(nh[1]) + ((gh[2])^2)*(1-fh[2])*var2/(nh[2]) +
    ((gh[3])^2)*(1-fh[3])*var3/(nh[3]) + ((gh[4])^2)*(1-fh[4])*var4/(nh[4])
  # idc pour mu \‘a 95%
  alpha=0.05
  binf = Xbarst- qnorm(1-alpha/2)*sqrt(varXbarst)
  bsup = Xbarst + qnorm(1-alpha/2)*sqrt(varXbarst)
  idcmoy=c(binf, bsup)
  # estimation du total T
  T_est= N*Xbarst
  T_est
  # estimation par IDC du total T
  binf = idcmoy[1]*N
  bsup= idcmoy[2]*N
  idcT=c(binf, bsup)
  idcT
  # marge d’erreur
  marge=(idcT[2]-idcT[1])/2
  marge
  
  
  # ajout des résultats dans le tableau resultats
  resultatsStrates[i, ] <- c(
    T,
    round(T_est,2),
    paste("[", round(idcT[1],2), "/", round(idcT[2]),2,"]"),
    round(marge,2)
  )
  
}



write.csv2(resultatsStrates,"resultatsStrates.csv")

#--------------------------------------------------------------------------------------------------------------------

#MEME TRUC MAIS AVEC 8 STRATES (PAS COMPLET ET PAS SUR QUE CA FONCTIONNE) 

#--------------------------------------------------------------------------------------------------------------------


datastrat = donnees[order(donnees$X.9), ]
datastrat$strate <- ceiling(seq_len(nrow(datastrat)) / (nrow(datastrat) / 8)) #Division en 8 strates contre 4 auparavant
Nh=table(datastrat$strate)
# effectif des strates
N=sum(Nh)
# Poids des strates
gh=round(Nh/N,3)

# on garde les resultats dans ce tableau
resultatsStrates <- data.frame(
  pop_totale = numeric(),
  pop_estimee = numeric(),
  IDC = character(),
  marge = numeric()
)

for (i in 1:10) {
  # Tirage d’un echantillon stratifi\’e de taille 100
  n=100
  nh=round(c(n*Nh[1]/N, n*Nh[2]/N, n*Nh[3]/N, n*Nh[4]/N, n*Nh[5]/N, n*Nh[6]/N, n*Nh[7]/N, n*Nh[8]/N))
  # taux de sondage ds les strates
  fh=nh/Nh
  # sondage strat (sans remise dans les strates)
  st = strata(datastrat, stratanames = c("strate"), size = nh, method = "srswr")
  data1=getdata(datastrat, st)
  head(data1)
  #Définition des échantillons
  ech1=data1[data1$strate==1, ]
  ech2=data1[data1$strate==2, ]
  ech3=data1[data1$strate==3, ]
  ech4=data1[data1$strate==4, ]
  ech1=data1[data1$strate==5, ]
  ech2=data1[data1$strate==6, ]
  ech3=data1[data1$strate==7, ]
  ech4=data1[data1$strate==8, ]
  # Moyennes des 8 sous-echantillons
  m1=mean(ech1$X.9)
  m2=mean(ech2$X.9)
  m3=mean(ech3$X.9)
  m4=mean(ech4$X.9)
  m1=mean(ech5$X.9)
  m2=mean(ech6$X.9)
  m3=mean(ech7$X.9)
  m4=mean(ech8$X.9)
  # Variances des 8 sous-echantillons
  var1=var(ech1$X.9)
  var2=var(ech2$X.9)
  var3=var(ech3$X.9)
  var4=var(ech4$X.9)
  var1=var(ech5$X.9)
  var2=var(ech6$X.9)
  var3=var(ech7$X.9)
  var4=var(ech8$X.9)
  # Moyenne des 8 echant reunis
  Xbarst= (Nh[1]*m1 + Nh[2]*m2 + Nh[3]*m3 + Nh[4]*m4 + Nh[5]*m5 + Nh[6]*m6 + Nh[7]*m7 + Nh[8]*m8)/N
  
  #JE ME SUIS ARRETE LA POUR LES 8 STRATES ET J'AI TESTE AUCUNE LIGNE POUR SAVOIR SI SA FONCTIONNAIT MAIS NORMALEMENT CA DEVRAIT ETRE BON
  
  
  # estimation de la variance de Xbarst
  varXbarst= ((gh[1])^2)*(1-fh[1])*var1/(nh[1]) + ((gh[2])^2)*(1-fh[2])*var2/(nh[2]) +
    ((gh[3])^2)*(1-fh[3])*var3/(nh[3]) + ((gh[4])^2)*(1-fh[4])*var4/(nh[4])
  # idc pour mu \‘a 95%
  alpha=0.05
  binf = Xbarst- qnorm(1-alpha/2)*sqrt(varXbarst)
  bsup = Xbarst + qnorm(1-alpha/2)*sqrt(varXbarst)
  idcmoy=c(binf, bsup)
  # estimation du total T
  T_est= N*Xbarst
  T_est
  # estimation par IDC du total T
  binf = idcmoy[1]*N
  bsup= idcmoy[2]*N
  idcT=c(binf, bsup)
  idcT
  # marge d’erreur
  marge=(idcT[2]-idcT[1])/2
  marge
  
  
  # ajout des résultats dans le tableau resultats
  resultatsStrates[i, ] <- c(
    T,
    round(T_est,2),
    paste("[", round(idcT[1],2), "/", round(idcT[2]),2,"]"),
    round(marge,2)
  )
  
}



write.csv2(resultatsStrates,"resultatsStrates.csv")










# ============================================================
#  Partie 2 – Questions 4, 5 et 6
# ============================================================

# Import des données
Sport <- read.csv2("EnqueteSportEtudiant2024_table.csv")
head(Sport)
Sport <- Sport[Sport$sport == 'Oui' | Sport$sport == 'Non', ]  #Supprime les lignes sans valeurs pour la variable 'sport'
Sport <- Sport[Sport$niveau == 'BUT1' | Sport$niveau == 'BUT2' |Sport$niveau == 'BUT3' |Sport$niveau == 'Licence Pro', ] #Supprime les lignes sans valeurs pour la variable 'niveau'
Sport2 <- Sport[Sport$bourse == 'Oui' | Sport$bourse == 'Non', ] #Création d'un nouveau dataframe sans les réponses manquantes pour la bourse (obligé de créer un nouveau df car top de ligne supprimées ce qui baise pour les autres variables)
# ============================================================
# QUESTION 4 – Tableaux croisés de "sport" avec d'autres variables
# ============================================================

# On croise "sport" avec chaque variable qualitative qui nous intéresse
table(Sport$sport, Sport$sexe)  
table(Sport$sport, Sport$niveau)
table(Sport2$sport, Sport2$bourse)
table(Sport$sport, Sport$fumer)


# ============================================================
# QUESTION 5 – Test du khi-deux + tableau des p-valeurs
# ============================================================

# On effectue le test du khi-deux pour chaque variable
# H0 : les deux variables sont indépendantes
# Si p-valeur < 0.05, on rejette H0 → liaison significative

test1 <- chisq.test(table(Sport$sport, Sport$sexe))
test2 <- chisq.test(table(Sport$sport, Sport$niveau))
test3 <- chisq.test(table(Sport2$sport, Sport2$bourse))
test4 <- chisq.test(table(Sport$sport, Sport$fumer))

# On regroupe les p-valeurs dans un tableau lisible
tableau_pval <- data.frame(
  Variable = c("sexe", "niveau", "bourse", "fumer"),
  p_valeur = round(c(test1$p.value, test2$p.value, test3$p.value,
                     test4$p.value), 4)
)

# Affichage du tableau
tableau_pval

# Les liaisons significatives sont celles avec p_valeur < 0.05


# ============================================================
# QUESTION 6 – V de Cramér pour mesurer l'intensité de la liaison
# ============================================================

# Formule du V de Cramér : V = sqrt( chi2 / (n * min(p-1, q-1)) )
# Plus V est proche de 1, plus la liaison est forte

# --- Variable : sexe ---
tab <- table(Sport$sport, Sport$sexe)
n <- sum(tab)
p <- nrow(tab)
q <- ncol(tab)
m <- min(p - 1, q - 1)
V_sexe <- sqrt(test1$statistic / (n * m))

# --- Variable : niveau ---
tab <- table(Sport$sport, Sport$niveau)
n <- sum(tab) ; p <- nrow(tab) ; q <- ncol(tab) ; m <- min(p-1, q-1)
V_niveau <- sqrt(test2$statistic / (n * m))

# --- Variable : bourse ---
tab <- table(Sport2$sport, Sport2$bourse)
n <- sum(tab) ; p <- nrow(tab) ; q <- ncol(tab) ; m <- min(p-1, q-1)
V_bourse <- sqrt(test3$statistic / (n * m))

# --- Variable : fumer ---
tab <- table(Sport$sport, Sport$fumer)
n <- sum(tab) ; p <- nrow(tab) ; q <- ncol(tab) ; m <- min(p-1, q-1)
V_fumer <- sqrt(test4$statistic / (n * m))


# Tableau final avec p-valeurs ET V de Cramér
tableau_final <- data.frame(
  Variable = c("sexe", "niveau", "bourse", "fumer"),
  p_valeur = round(c(test1$p.value, test2$p.value, test3$p.value,
                     test4$p.value), 4),
  V_Cramer = round(c(V_sexe, V_niveau, V_bourse, V_fumer), 4)
)

# Affichage du tableau final
tableau_final

# La liaison la plus forte correspond à la variable avec le V de Cramér le plus élevé



