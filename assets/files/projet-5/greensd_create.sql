DROP DATABASE IF EXISTS greensd;
CREATE DATABASE greensd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greensd;

CREATE TABLE Partenaire(
   nomPartenaire VARCHAR(50),
   ville         VARCHAR(50),
   PRIMARY KEY(nomPartenaire)
) ENGINE=InnoDB;

CREATE TABLE Livreur(
   IdLivreur     INT AUTO_INCREMENT,
   nomLivreur    VARCHAR(50) NOT NULL,
   prenomLivreur VARCHAR(50) NOT NULL,
   dateEmbauche  DATE,
   PRIMARY KEY(IdLivreur)
) ENGINE=InnoDB;

CREATE TABLE entree(
   IdEntree       INT AUTO_INCREMENT,
   date_entree    DATE        NOT NULL,
   quantite_colis INT         NOT NULL,
   nomPartenaire  VARCHAR(50) NOT NULL,
   PRIMARY KEY(IdEntree),
   FOREIGN KEY(nomPartenaire) REFERENCES Partenaire(nomPartenaire)
) ENGINE=InnoDB;

CREATE TABLE TypeVehicule(
   IdType    INT AUTO_INCREMENT,
   LibelType VARCHAR(50),
   PRIMARY KEY(IdType)
) ENGINE=InnoDB;

CREATE TABLE Pollution(
   IdType   INT,
   annee    INT,
   CO2_g_km DOUBLE NOT NULL,
   PRIMARY KEY(IdType, annee),
   FOREIGN KEY(IdType) REFERENCES TypeVehicule(IdType)
) ENGINE=InnoDB;

CREATE TABLE Vehicule(
   IdVeh     INT AUTO_INCREMENT,
   autonomie INT         NOT NULL,
   capacite  INT         NOT NULL,
   annee     VARCHAR(4)  NOT NULL,
   nbVeh     INT         NOT NULL,
   IdType    INT         NOT NULL,
   PRIMARY KEY(IdVeh),
   FOREIGN KEY(IdType) REFERENCES TypeVehicule(IdType)
) ENGINE=InnoDB;

CREATE TABLE Tournee(
   IdTournee      INT AUTO_INCREMENT,
   quantite_colis INT            NOT NULL,
   dateTour       DATE,
   distance       DECIMAL(15,2)  NOT NULL,
   IdLivreur      INT            NOT NULL,
   IdVeh          INT            NOT NULL,
   PRIMARY KEY(IdTournee),
   FOREIGN KEY(IdLivreur) REFERENCES Livreur(IdLivreur),
   FOREIGN KEY(IdVeh)     REFERENCES Vehicule(IdVeh)
) ENGINE=InnoDB;

CREATE TABLE Livraison(
   IdLivra        INT AUTO_INCREMENT,
   client         VARCHAR(50),
   poids_total    DECIMAL(15,2),
   ville_client   VARCHAR(50),
   quantite_colis INT           NOT NULL,
   code_postal    VARCHAR(5),
   rue            VARCHAR(50),
   IdTournee      INT           NOT NULL,
   PRIMARY KEY(IdLivra),
   FOREIGN KEY(IdTournee) REFERENCES Tournee(IdTournee)
) ENGINE=InnoDB;

CREATE TABLE appartenir(
   IdTournee  INT,
   IdEntree   INT,
   Provenance VARCHAR(50),
   PRIMARY KEY(IdTournee, IdEntree),
   FOREIGN KEY(IdTournee) REFERENCES Tournee(IdTournee),
   FOREIGN KEY(IdEntree)  REFERENCES entrer(IdEntree)
) ENGINE=InnoDB;
