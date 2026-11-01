import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk
import mysql.connector
from mysql.connector import Error
import csv
import os

# ============================================================
#                   CONNEXION BASE DE DONNÉES
# ============================================================

def creer_connexion():
    connexion = None
    try:
        connexion = mysql.connector.connect(
            host='localhost',
            port=3306,
            user='root',
            password='',
            database='greensd',
            charset='utf8mb4'
        )
        if connexion.is_connected():
            print("✅ Connexion à la base de données 'greensd' réussie !")
            return connexion
    except Error as e:
        messagebox.showerror("Erreur de connexion",
                             f"Impossible de se connecter :\n{e}")
        return None


def fermer_connexion(connexion):
    if connexion and connexion.is_connected():
        connexion.close()
        print("🔒 Connexion fermée.")


# ============================================================
#                   INTERFACE GRAPHIQUE
# ============================================================

class ApplicationGreenSD:

    def __init__(self, root):
        self.root = root
        self.root.title("GreenSD - Gestion des livraisons")
        self.root.geometry("1100x650")
        self.root.resizable(True, True)

        self.couleur_principale = "#2E7D32"
        self.couleur_secondaire = "#A5D6A7"
        self.couleur_fond       = "#F1F8E9"
        self.root.configure(bg=self.couleur_fond)

        self.connexion = creer_connexion()

        # Stockage images anti garbage-collector
        self.logo        = None
        self._images_csv = {}

        # Données internes
        self._colonnes_table_courante   = []
        self._donnees_table_courante    = []
        self._tri_sens                  = {}
        self._lignes_csv_brutes         = []
        self._entetes_csv_brutes        = []
        self._config_csv_actuel         = None

        # Pagination CSV
        self._page_csv              = 0
        self._lignes_par_page       = 50
        self._lignes_csv_filtrees   = []

        # Pagination Tables BDD
        self._page_table                = 0
        self._lignes_par_page_table     = 50
        self._lignes_table_filtrees     = []

        # Référence CRUD courante (pour raccourcis clavier)
        self._crud_tv_courant           = None
        self._crud_nom_table_courant    = None
        self._crud_colonnes_courantes   = []
        self._crud_callback_refresh     = None

        self._creer_entete()
        self._creer_barre_statut()
        self._creer_onglets()
        self._bind_raccourcis_globaux()          # ← raccourcis clavier

        self.root.protocol("WM_DELETE_WINDOW", self._fermeture_application)

    # --------------------------------------------------------
    #   RACCOURCIS CLAVIER GLOBAUX
    # --------------------------------------------------------

    def _bind_raccourcis_globaux(self):
        """Lie les raccourcis clavier à la fenêtre principale."""

        # F5 — Rafraîchir selon l'onglet actif
        self.root.bind("<F5>", self._raccourci_rafraichir)

        # Suppr — Supprimer la ligne sélectionnée dans le CRUD
        self.root.bind("<Delete>", self._raccourci_supprimer)

        # Echap — Vider la recherche de l'onglet actif
        self.root.bind("<Escape>", self._raccourci_echap)

        # Ctrl+E — Exporter l'onglet actif
        self.root.bind("<Control-e>", self._raccourci_exporter)

        # Ctrl+N — Ajouter une ligne (CRUD)
        self.root.bind("<Control-n>", self._raccourci_ajouter)

        # F1 — Afficher l'aide des raccourcis
        self.root.bind("<F1>", self._afficher_aide_raccourcis)

    def _onglet_actif(self):
        """Retourne l'index de l'onglet actuellement visible."""
        return self.notebook.index(self.notebook.select())

    def _raccourci_rafraichir(self, event=None):
        onglet = self._onglet_actif()
        if onglet == 2:   # Tables BDD
            self._charger_liste_tables()
            if self._crud_nom_table_courant:
                self._charger_donnees_table(self._crud_nom_table_courant)
        elif onglet == 3: # CRUD
            if self._crud_callback_refresh:
                self._crud_callback_refresh()
        elif onglet == 1: # CSV
            if self._config_csv_actuel:
                self._afficher_csv(self._config_csv_actuel)

    def _raccourci_supprimer(self, event=None):
        """Supprime la ligne sélectionnée si on est dans l'onglet CRUD."""
        # On vérifie que le focus n'est pas dans un champ de saisie
        widget_focus = self.root.focus_get()
        if isinstance(widget_focus, tk.Entry):
            return

        if self._onglet_actif() == 3 and self._crud_tv_courant:
            tv  = self._crud_tv_courant
            sel = tv.selection()
            if not sel:
                return
            if not messagebox.askyesno("Supprimer",
                                       "Supprimer la ligne sélectionnée ?"):
                return
            valeurs = tv.item(sel[0])["values"]
            try:
                cursor = self.connexion.cursor()
                cond   = " AND ".join(
                    [f"`{c}` = %s" for c in self._crud_colonnes_courantes])
                cursor.execute(
                    f"DELETE FROM `{self._crud_nom_table_courant}` "
                    f"WHERE {cond} LIMIT 1", valeurs)
                self.connexion.commit()
                cursor.close()
                if self._crud_callback_refresh:
                    self._crud_callback_refresh()
            except Exception as e:
                messagebox.showerror("Erreur", str(e))

    def _raccourci_echap(self, event=None):
        """Vide la barre de recherche de l'onglet actif."""
        onglet = self._onglet_actif()
        if onglet == 1 and hasattr(self, "var_recherche_csv"):
            self.var_recherche_csv.set("")
        elif onglet == 2 and hasattr(self, "var_recherche_table"):
            self.var_recherche_table.set("")

    def _raccourci_exporter(self, event=None):
        """Ctrl+E : exporte selon l'onglet actif."""
        onglet = self._onglet_actif()
        if onglet == 1:
            self._exporter_csv()
        elif onglet == 2:
            self._exporter_table_csv()

    def _raccourci_ajouter(self, event=None):
        """Ctrl+N : ouvre le formulaire d'ajout dans le CRUD."""
        if self._onglet_actif() == 3 and self._crud_nom_table_courant:
            self._ouvrir_formulaire(
                self._crud_nom_table_courant,
                self._crud_colonnes_courantes,
                self._crud_tv_courant,
                None, "ajouter")

    def _afficher_aide_raccourcis(self, event=None):
        """F1 : fenêtre d'aide récapitulant tous les raccourcis."""
        aide = tk.Toplevel(self.root)
        aide.title("Raccourcis clavier — GreenSD")
        aide.geometry("400x320")
        aide.configure(bg=self.couleur_fond)
        aide.resizable(False, False)
        aide.grab_set()

        tk.Label(aide, text="⌨️ Raccourcis clavier",
                 font=("Helvetica", 14, "bold"),
                 bg=self.couleur_fond,
                 fg=self.couleur_principale).pack(pady=(15, 10))

        raccourcis = [
            ("F5",        "Rafraîchir l'onglet actif"),
            ("Suppr",     "Supprimer la ligne sélectionnée (CRUD)"),
            ("Échap",     "Vider la recherche"),
            ("Ctrl + E",  "Exporter en CSV (CSV / Tables BDD)"),
            ("Ctrl + N",  "Ajouter une ligne (CRUD)"),
            ("Double-clic", "Modifier la ligne (CRUD)"),
            ("F1",        "Afficher cette aide"),
        ]

        frame_liste = tk.Frame(aide, bg=self.couleur_fond)
        frame_liste.pack(fill=tk.BOTH, expand=True, padx=20)

        for i, (touche, desc) in enumerate(raccourcis):
            bg = "#F1F8E9" if i % 2 == 0 else "white"
            row = tk.Frame(frame_liste, bg=bg)
            row.pack(fill=tk.X, pady=1)
            tk.Label(row, text=touche, width=14,
                     font=("Courier", 10, "bold"),
                     bg=bg, fg=self.couleur_principale,
                     anchor=tk.W).pack(side=tk.LEFT, padx=8, pady=3)
            tk.Label(row, text=desc,
                     font=("Helvetica", 10),
                     bg=bg, fg="#333",
                     anchor=tk.W).pack(side=tk.LEFT)

        tk.Button(aide, text="Fermer",
                  bg=self.couleur_principale, fg="white",
                  relief=tk.FLAT, font=("Helvetica", 10, "bold"),
                  command=aide.destroy).pack(pady=12)

    # --------------------------------------------------------
    #   EN-TÊTE
    # --------------------------------------------------------

    def _creer_entete(self):
        frame_entete = tk.Frame(self.root, bg=self.couleur_principale, height=80)
        frame_entete.pack(fill=tk.X, side=tk.TOP)
        frame_entete.pack_propagate(False)

        if os.path.exists("logo.png"):
            try:
                img       = Image.open("logo.png").convert("RGBA")
                img       = img.resize((60, 60), Image.LANCZOS)
                self.logo = ImageTk.PhotoImage(img)
                lbl       = tk.Label(frame_entete,
                                     image=self.logo,
                                     bg=self.couleur_principale)
                lbl.image = self.logo
                lbl.pack(side=tk.LEFT, padx=15)
            except Exception as e:
                print(f"⚠️ Logo non chargé : {e}")

        tk.Label(frame_entete,
                 text="GreenSD — Gestion des livraisons",
                 font=("Helvetica", 20, "bold"),
                 bg=self.couleur_principale,
                 fg="white").pack(side=tk.LEFT, padx=10)

        # Bouton aide raccourcis dans l'en-tête
        tk.Button(frame_entete,
                  text="⌨️ F1 — Aide",
                  font=("Helvetica", 9),
                  bg=self.couleur_secondaire,
                  fg="#1B5E20",
                  relief=tk.FLAT,
                  padx=8,
                  command=self._afficher_aide_raccourcis).pack(
                      side=tk.RIGHT, padx=15, pady=20)

    # --------------------------------------------------------
    #   ONGLETS
    # --------------------------------------------------------

    def _creer_onglets(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TNotebook",
                        background=self.couleur_fond,
                        borderwidth=0)
        style.configure("TNotebook.Tab",
                        background=self.couleur_secondaire,
                        foreground="#1B5E20",
                        font=("Helvetica", 11, "bold"),
                        padding=[12, 6])
        style.map("TNotebook.Tab",
                  background=[("selected", self.couleur_principale)],
                  foreground=[("selected", "white")])

        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        frame_accueil = tk.Frame(self.notebook, bg=self.couleur_fond)
        self.notebook.add(frame_accueil, text="🏠 Accueil")
        self._construire_onglet_accueil(frame_accueil)

        frame_csv = tk.Frame(self.notebook, bg=self.couleur_fond)
        self.notebook.add(frame_csv, text="📂 Fichiers CSV")
        self._construire_onglet_csv(frame_csv)

        frame_tables = tk.Frame(self.notebook, bg=self.couleur_fond)
        self.notebook.add(frame_tables, text="🗄️ Tables BDD")
        self._construire_onglet_tables(frame_tables)

        frame_crud = tk.Frame(self.notebook, bg=self.couleur_fond)
        self.notebook.add(frame_crud, text="⚙️ CRUD")
        self._creer_onglet_crud(frame_crud)

    # --------------------------------------------------------
    #   ONGLET ACCUEIL
    # --------------------------------------------------------

    def _construire_onglet_accueil(self, parent):
        tk.Label(parent,
                 text="Bienvenue dans GreenSD",
                 font=("Helvetica", 22, "bold"),
                 bg=self.couleur_fond,
                 fg=self.couleur_principale).pack(pady=40)

        tk.Label(parent,
                 text="Sélectionnez un onglet pour commencer.",
                 font=("Helvetica", 13),
                 bg=self.couleur_fond,
                 fg="#555").pack()

        if self.connexion and self.connexion.is_connected():
            statut_txt   = "✅ Connecté à la base de données 'greensd'"
            statut_color = self.couleur_principale
        else:
            statut_txt   = "❌ Non connecté à la base de données"
            statut_color = "#C62828"

        tk.Label(parent,
                 text=statut_txt,
                 font=("Helvetica", 11, "italic"),
                 bg=self.couleur_fond,
                 fg=statut_color).pack(pady=20)

        tk.Label(parent,
                 text="💡 Appuyez sur F1 pour voir les raccourcis clavier",
                 font=("Helvetica", 10),
                 bg=self.couleur_fond,
                 fg="#888").pack()

    # --------------------------------------------------------
    #   ONGLET CSV
    # --------------------------------------------------------

    def _construire_onglet_csv(self, parent):
        self.configs_csv = [
            {"nom": "Entrée",             "fichier": "entree.csv",           "logo": "logoCSV1.webp"},
            {"nom": "Livraison",          "fichier": "livraison.csv",        "logo": "logoCSV2.webp"},
            {"nom": "Partenaire",         "fichier": "partenaire.csv",       "logo": "logoCSV3.webp"},
            {"nom": "Tournée",            "fichier": "tournee.csv",          "logo": "logoCSV4.webp"},
            {"nom": "Véhicule & Livreur", "fichier": "vehicule_livreur.csv", "logo": "logoCSV5.webp"},
        ]

        frame_gauche = tk.Frame(parent, bg=self.couleur_secondaire, width=220)
        frame_gauche.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 5))
        frame_gauche.pack_propagate(False)

        tk.Label(frame_gauche,
                 text="📁 Fichiers disponibles",
                 font=("Helvetica", 12, "bold"),
                 bg=self.couleur_secondaire,
                 fg="#1B5E20").pack(pady=15)

        for config in self.configs_csv:
            self._creer_bouton_csv(frame_gauche, config)

        frame_droit = tk.Frame(parent, bg=self.couleur_fond)
        frame_droit.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        frame_titre = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_titre.pack(fill=tk.X, padx=10, pady=(10, 0))

        self.label_titre_csv = tk.Label(frame_titre,
                                        text="Sélectionnez un fichier CSV",
                                        font=("Helvetica", 13, "bold"),
                                        bg=self.couleur_fond,
                                        fg=self.couleur_principale)
        self.label_titre_csv.pack(side=tk.LEFT)

        self.label_compteur = tk.Label(frame_titre, text="",
                                       font=("Helvetica", 10),
                                       bg=self.couleur_fond, fg="#555")
        self.label_compteur.pack(side=tk.RIGHT)

        frame_recherche = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_recherche.pack(fill=tk.X, padx=10, pady=5)

        tk.Label(frame_recherche, text="🔍 Recherche :",
                 font=("Helvetica", 10),
                 bg=self.couleur_fond).pack(side=tk.LEFT)

        self.var_recherche_csv = tk.StringVar()
        self.var_recherche_csv.trace_add("write", self._filtrer_csv)

        tk.Entry(frame_recherche,
                 textvariable=self.var_recherche_csv,
                 font=("Helvetica", 10),
                 width=30).pack(side=tk.LEFT, padx=5)

        tk.Button(frame_recherche, text="✖",
                  font=("Helvetica", 10),
                  bg="#FFCDD2", fg="#B71C1C", relief=tk.FLAT,
                  command=lambda: self.var_recherche_csv.set("")).pack(side=tk.LEFT)

        tk.Button(frame_recherche, text="💾 Exporter CSV",
                  font=("Helvetica", 10, "bold"),
                  bg=self.couleur_principale, fg="white",
                  relief=tk.FLAT, padx=8,
                  command=self._exporter_csv).pack(side=tk.RIGHT, padx=(5, 0))

        frame_tableau = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_tableau.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        scroll_y = ttk.Scrollbar(frame_tableau, orient=tk.VERTICAL)
        scroll_x = ttk.Scrollbar(frame_tableau, orient=tk.HORIZONTAL)

        self.tableau_csv = ttk.Treeview(frame_tableau,
                                        yscrollcommand=scroll_y.set,
                                        xscrollcommand=scroll_x.set,
                                        selectmode="browse")
        scroll_y.config(command=self.tableau_csv.yview)
        scroll_x.config(command=self.tableau_csv.xview)
        scroll_y.pack(side=tk.RIGHT,  fill=tk.Y)
        scroll_x.pack(side=tk.BOTTOM, fill=tk.X)
        self.tableau_csv.pack(fill=tk.BOTH, expand=True)

        self._frame_pagination_csv = tk.Frame(frame_droit, bg=self.couleur_fond)
        self._frame_pagination_csv.pack(fill=tk.X, padx=10, pady=(0, 5))
        self._construire_barre_pagination_csv()

    def _construire_barre_pagination_csv(self):
        f = self._frame_pagination_csv
        for w in f.winfo_children():
            w.destroy()

        for txt, cmd in [("⏮ Début", self._csv_premiere_page),
                         ("◀ Préc",  self._csv_page_precedente)]:
            tk.Button(f, text=txt, bg=self.couleur_secondaire, fg="#1B5E20",
                      relief=tk.FLAT, font=("Helvetica", 9),
                      command=cmd).pack(side=tk.LEFT, padx=2)

        self.label_page_csv = tk.Label(f, text="Page 1 / 1",
                                       font=("Helvetica", 9),
                                       bg=self.couleur_fond, fg="#333")
        self.label_page_csv.pack(side=tk.LEFT, padx=8)

        for txt, cmd in [("Suiv ▶", self._csv_page_suivante),
                         ("Fin ⏭",  self._csv_derniere_page)]:
            tk.Button(f, text=txt, bg=self.couleur_secondaire, fg="#1B5E20",
                      relief=tk.FLAT, font=("Helvetica", 9),
                      command=cmd).pack(side=tk.LEFT, padx=2)

        tk.Label(f, text="  Lignes/page :",
                 font=("Helvetica", 9),
                 bg=self.couleur_fond).pack(side=tk.LEFT, padx=(15, 2))

        self.var_lpp_csv = tk.StringVar(value=str(self._lignes_par_page))
        cb = ttk.Combobox(f, textvariable=self.var_lpp_csv,
                          values=["10", "25", "50", "100", "200"],
                          width=5, state="readonly")
        cb.pack(side=tk.LEFT)
        cb.bind("<<ComboboxSelected>>", self._changer_lpp_csv)

    def _nb_pages_csv(self):
        total = len(self._lignes_csv_filtrees)
        return max(1, -(-total // self._lignes_par_page))

    def _rafraichir_page_csv(self):
        debut = self._page_csv * self._lignes_par_page
        fin   = debut + self._lignes_par_page
        page  = self._lignes_csv_filtrees[debut:fin]
        self._afficher_lignes_csv(self._entetes_csv_brutes, page)
        nb = self._nb_pages_csv()
        self.label_page_csv.config(text=f"Page {self._page_csv + 1} / {nb}")
        total = len(self._lignes_csv_filtrees)
        self.label_compteur.config(
            text=f"{total} ligne(s) — {debut + 1}–{min(fin, total)}"
                 if total else "0 ligne")

    def _csv_premiere_page(self):
        self._page_csv = 0;  self._rafraichir_page_csv()

    def _csv_derniere_page(self):
        self._page_csv = self._nb_pages_csv() - 1;  self._rafraichir_page_csv()

    def _csv_page_precedente(self):
        if self._page_csv > 0:
            self._page_csv -= 1;  self._rafraichir_page_csv()

    def _csv_page_suivante(self):
        if self._page_csv < self._nb_pages_csv() - 1:
            self._page_csv += 1;  self._rafraichir_page_csv()

    def _changer_lpp_csv(self, event=None):
        self._lignes_par_page = int(self.var_lpp_csv.get())
        self._page_csv = 0;  self._rafraichir_page_csv()

    def _exporter_csv(self):
        if not self._entetes_csv_brutes:
            messagebox.showwarning("Export", "Aucune donnée à exporter.")
            return
        chemin = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("Fichiers CSV", "*.csv")],
            title="Enregistrer l'export CSV",
            initialfile=self._config_csv_actuel["fichier"]
                        if self._config_csv_actuel else "export.csv")
        if not chemin:
            return
        try:
            with open(chemin, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f, delimiter=";")
                writer.writerow(self._entetes_csv_brutes)
                writer.writerows(self._lignes_csv_filtrees)
            messagebox.showinfo("Export réussi",
                                f"✅ {len(self._lignes_csv_filtrees)} ligne(s) "
                                f"exportée(s) vers :\n{chemin}")
        except Exception as e:
            messagebox.showerror("Erreur export", str(e))

    def _creer_bouton_csv(self, parent, config):
        frame_btn = tk.Frame(parent, bg=self.couleur_fond, cursor="hand2")
        frame_btn.pack(fill=tk.X, padx=5, pady=4)

        if os.path.exists(config["logo"]):
            try:
                img   = Image.open(config["logo"])
                img   = img.resize((32, 32), Image.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self._images_csv[config["fichier"]] = photo
                lbl       = tk.Label(frame_btn, image=photo, bg=self.couleur_fond)
                lbl.image = photo
                lbl.pack(side=tk.LEFT, padx=(5, 8))
            except Exception as e:
                print(f"⚠️ Logo introuvable : {config['logo']} — {e}")

        btn = tk.Button(
            frame_btn, text=config["nom"],
            font=("Helvetica", 11),
            bg=self.couleur_secondaire, fg="#1B5E20",
            activebackground=self.couleur_principale,
            activeforeground="white",
            relief=tk.FLAT, bd=0, padx=10, pady=6,
            cursor="hand2", anchor=tk.W,
            command=lambda c=config: self._afficher_csv(c))
        btn.pack(side=tk.LEFT, fill=tk.X, expand=True)
        btn.bind("<Enter>", lambda e, b=btn: b.config(
            bg=self.couleur_principale, fg="white"))
        btn.bind("<Leave>", lambda e, b=btn: b.config(
            bg=self.couleur_secondaire, fg="#1B5E20"))

    def _afficher_csv(self, config):
        fichier = config["fichier"]
        self._config_csv_actuel = config

        if not os.path.exists(fichier):
            messagebox.showwarning("Fichier introuvable",
                                   f"Le fichier '{fichier}' est introuvable.")
            return
        try:
            with open(fichier, encoding="latin-1") as f:
                lecteur = csv.reader(f, delimiter=';')
                lignes  = list(lecteur)
            if not lignes:
                messagebox.showinfo("Fichier vide",
                                    f"'{fichier}' ne contient aucune donnée.")
                return
            self._entetes_csv_brutes = lignes[0]
            self._lignes_csv_brutes  = [list(l) for l in lignes[1:]]
            self.var_recherche_csv.set("")
            self._page_csv            = 0
            self._lignes_csv_filtrees = self._lignes_csv_brutes[:]
            self._rafraichir_page_csv()
            self.label_titre_csv.config(text=f"📄 {config['nom']} — {fichier}")
        except Exception as e:
            messagebox.showerror("Erreur de lecture",
                                 f"Impossible de lire '{fichier}' :\n{e}")

    def _afficher_lignes_csv(self, en_tetes, lignes):
        self.tableau_csv.delete(*self.tableau_csv.get_children())
        self.tableau_csv["columns"] = en_tetes
        self.tableau_csv["show"]    = "headings"
        for col in en_tetes:
            self.tableau_csv.heading(col, text=col)
            self.tableau_csv.column(col, width=150, anchor=tk.W, minwidth=80)
        for i, ligne in enumerate(lignes):
            while len(ligne) < len(en_tetes):
                ligne.append("")
            tag = "pair" if i % 2 == 0 else "impair"
            self.tableau_csv.insert("", tk.END, values=ligne, tags=(tag,))
        self.tableau_csv.tag_configure("pair",   background="#F1F8E9")
        self.tableau_csv.tag_configure("impair", background="white")

    def _filtrer_csv(self, *args):
        terme = self.var_recherche_csv.get().lower().strip()
        if not self._lignes_csv_brutes:
            return
        self._lignes_csv_filtrees = [
            l for l in self._lignes_csv_brutes
            if not terme or any(terme in str(v).lower() for v in l)]
        self._page_csv = 0
        self._rafraichir_page_csv()

    # --------------------------------------------------------
    #   ONGLET TABLES BDD
    # --------------------------------------------------------

    def _construire_onglet_tables(self, parent):
        frame_gauche = tk.Frame(parent, bg=self.couleur_secondaire, width=200)
        frame_gauche.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 5))
        frame_gauche.pack_propagate(False)

        tk.Label(frame_gauche, text="🗄️ Tables",
                 font=("Helvetica", 12, "bold"),
                 bg=self.couleur_secondaire,
                 fg="#1B5E20").pack(pady=15)

        tk.Button(frame_gauche, text="🔄 Rafraîchir (F5)",
                  font=("Helvetica", 9),
                  bg=self.couleur_principale, fg="white",
                  relief=tk.FLAT,
                  command=self._charger_liste_tables).pack(pady=5, padx=10)

        frame_liste = tk.Frame(frame_gauche, bg=self.couleur_secondaire)
        frame_liste.pack(fill=tk.BOTH, expand=True)

        scroll_liste = ttk.Scrollbar(frame_liste, orient=tk.VERTICAL)
        self.liste_tables = tk.Listbox(
            frame_liste,
            font=("Helvetica", 10),
            bg="white", fg="#1B5E20",
            selectbackground=self.couleur_principale,
            selectforeground="white",
            relief=tk.FLAT,
            yscrollcommand=scroll_liste.set)
        scroll_liste.config(command=self.liste_tables.yview)
        scroll_liste.pack(side=tk.RIGHT, fill=tk.Y)
        self.liste_tables.pack(fill=tk.BOTH, expand=True)
        self.liste_tables.bind("<<ListboxSelect>>", self._on_table_selectionnee)

        # Panneau droit
        frame_droit = tk.Frame(parent, bg=self.couleur_fond)
        frame_droit.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        frame_titre = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_titre.pack(fill=tk.X, padx=10, pady=(10, 0))

        self.label_titre_table = tk.Label(frame_titre,
                                          text="Sélectionnez une table",
                                          font=("Helvetica", 13, "bold"),
                                          bg=self.couleur_fond,
                                          fg=self.couleur_principale)
        self.label_titre_table.pack(side=tk.LEFT)

        self.label_nb_lignes_table = tk.Label(frame_titre, text="",
                                              font=("Helvetica", 10),
                                              bg=self.couleur_fond, fg="#555")
        self.label_nb_lignes_table.pack(side=tk.RIGHT)

        # Recherche + Export
        frame_rech = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_rech.pack(fill=tk.X, padx=10, pady=5)

        tk.Label(frame_rech, text="🔍 Recherche :",
                 font=("Helvetica", 10),
                 bg=self.couleur_fond).pack(side=tk.LEFT)

        self.var_recherche_table = tk.StringVar()
        self.var_recherche_table.trace_add("write", self._filtrer_table)

        tk.Entry(frame_rech, textvariable=self.var_recherche_table,
                 font=("Helvetica", 10), width=30).pack(side=tk.LEFT, padx=5)

        tk.Button(frame_rech, text="✖",
                  bg="#FFCDD2", fg="#B71C1C",
                  relief=tk.FLAT, font=("Helvetica", 10),
                  command=lambda: self.var_recherche_table.set("")).pack(side=tk.LEFT)

        tk.Button(frame_rech, text="💾 Exporter CSV  Ctrl+E",
                  font=("Helvetica", 10, "bold"),
                  bg=self.couleur_principale, fg="white",
                  relief=tk.FLAT, padx=8,
                  command=self._exporter_table_csv).pack(side=tk.RIGHT)

        # Tableau
        frame_tableau = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_tableau.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        sv_y = ttk.Scrollbar(frame_tableau, orient=tk.VERTICAL)
        sv_x = ttk.Scrollbar(frame_tableau, orient=tk.HORIZONTAL)

        self.tableau_table = ttk.Treeview(frame_tableau,
                                          yscrollcommand=sv_y.set,
                                          xscrollcommand=sv_x.set,
                                          selectmode="browse")
        sv_y.config(command=self.tableau_table.yview)
        sv_x.config(command=self.tableau_table.xview)
        sv_y.pack(side=tk.RIGHT,  fill=tk.Y)
        sv_x.pack(side=tk.BOTTOM, fill=tk.X)
        self.tableau_table.pack(fill=tk.BOTH, expand=True)

        # Pagination Tables
        self._frame_pagination_table = tk.Frame(frame_droit, bg=self.couleur_fond)
        self._frame_pagination_table.pack(fill=tk.X, padx=10, pady=(0, 5))
        self._construire_barre_pagination_table()

        self._charger_liste_tables()

    def _construire_barre_pagination_table(self):
        f = self._frame_pagination_table
        for w in f.winfo_children():
            w.destroy()

        for txt, cmd in [("⏮ Début", self._table_premiere_page),
                         ("◀ Préc",  self._table_page_precedente)]:
            tk.Button(f, text=txt, bg=self.couleur_secondaire, fg="#1B5E20",
                      relief=tk.FLAT, font=("Helvetica", 9),
                      command=cmd).pack(side=tk.LEFT, padx=2)

        self.label_page_table = tk.Label(f, text="Page 1 / 1",
                                         font=("Helvetica", 9),
                                         bg=self.couleur_fond, fg="#333")
        self.label_page_table.pack(side=tk.LEFT, padx=8)

        for txt, cmd in [("Suiv ▶", self._table_page_suivante),
                         ("Fin ⏭",  self._table_derniere_page)]:
            tk.Button(f, text=txt, bg=self.couleur_secondaire, fg="#1B5E20",
                      relief=tk.FLAT, font=("Helvetica", 9),
                      command=cmd).pack(side=tk.LEFT, padx=2)

        tk.Label(f, text="  Lignes/page :",
                 font=("Helvetica", 9),
                 bg=self.couleur_fond).pack(side=tk.LEFT, padx=(15, 2))

        self.var_lpp_table = tk.StringVar(value=str(self._lignes_par_page_table))
        cb = ttk.Combobox(f, textvariable=self.var_lpp_table,
                          values=["10", "25", "50", "100", "200"],
                          width=5, state="readonly")
        cb.pack(side=tk.LEFT)
        cb.bind("<<ComboboxSelected>>", self._changer_lpp_table)

    def _nb_pages_table(self):
        total = len(self._lignes_table_filtrees)
        return max(1, -(-total // self._lignes_par_page_table))

    def _rafraichir_page_table(self):
        debut = self._page_table * self._lignes_par_page_table
        fin   = debut + self._lignes_par_page_table
        page  = self._lignes_table_filtrees[debut:fin]
        self._afficher_donnees_tableau(self._colonnes_table_courante, page)
        nb    = self._nb_pages_table()
        total = len(self._lignes_table_filtrees)
        self.label_page_table.config(text=f"Page {self._page_table + 1} / {nb}")
        self.label_nb_lignes_table.config(
            text=f"{total} ligne(s) — {debut + 1}–{min(fin, total)}"
                 if total else "0 ligne")

    def _table_premiere_page(self):
        self._page_table = 0;  self._rafraichir_page_table()

    def _table_derniere_page(self):
        self._page_table = self._nb_pages_table() - 1;  self._rafraichir_page_table()

    def _table_page_precedente(self):
        if self._page_table > 0:
            self._page_table -= 1;  self._rafraichir_page_table()

    def _table_page_suivante(self):
        if self._page_table < self._nb_pages_table() - 1:
            self._page_table += 1;  self._rafraichir_page_table()

    def _changer_lpp_table(self, event=None):
        self._lignes_par_page_table = int(self.var_lpp_table.get())
        self._page_table = 0;  self._rafraichir_page_table()

    def _exporter_table_csv(self):
        if not self._colonnes_table_courante:
            messagebox.showwarning("Export", "Aucune table chargée.")
            return
        chemin = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("Fichiers CSV", "*.csv")],
            title="Enregistrer l'export de la table",
            initialfile="export_table.csv")
        if not chemin:
            return
        try:
            with open(chemin, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f, delimiter=";")
                writer.writerow(self._colonnes_table_courante)
                for ligne in self._lignes_table_filtrees:
                    writer.writerow(
                        [str(v) if v is not None else "" for v in ligne])
            messagebox.showinfo("Export réussi",
                                f"✅ {len(self._lignes_table_filtrees)} ligne(s) "
                                f"exportée(s) vers :\n{chemin}")
        except Exception as e:
            messagebox.showerror("Erreur export", str(e))

    def _charger_liste_tables(self):
        self.liste_tables.delete(0, tk.END)
        if not self.connexion or not self.connexion.is_connected():
            messagebox.showerror("Erreur", "Pas de connexion.")
            return
        try:
            curseur = self.connexion.cursor()
            curseur.execute("SHOW TABLES")
            tables = [row[0] for row in curseur.fetchall()]
            curseur.close()
            for table in tables:
                self.liste_tables.insert(tk.END, table)
        except Error as e:
            messagebox.showerror("Erreur SQL", str(e))

    def _on_table_selectionnee(self, event):
        selection = self.liste_tables.curselection()
        if not selection:
            return
        nom_table = self.liste_tables.get(selection[0])
        self._charger_donnees_table(nom_table)

    def _charger_donnees_table(self, nom_table):
        if not self.connexion or not self.connexion.is_connected():
            messagebox.showerror("Erreur", "Pas de connexion.")
            return
        try:
            curseur = self.connexion.cursor()
            curseur.execute(f"SELECT * FROM `{nom_table}`")
            lignes   = curseur.fetchall()
            colonnes = [desc[0] for desc in curseur.description]
            curseur.close()
            self._colonnes_table_courante = colonnes
            self._donnees_table_courante  = lignes
            self._lignes_table_filtrees   = list(lignes)
            self._tri_sens                = {}
            self._page_table              = 0
            self.var_recherche_table.set("")
            self._rafraichir_page_table()
            self.label_titre_table.config(
                text=f"🗄️ {nom_table} — {len(colonnes)} colonne(s)")
        except Error as e:
            messagebox.showerror("Erreur SQL", str(e))

    def _afficher_donnees_tableau(self, colonnes, lignes):
        self.tableau_table.delete(*self.tableau_table.get_children())
        self.tableau_table["columns"] = colonnes
        self.tableau_table["show"]    = "headings"
        for i, col in enumerate(colonnes):
            self.tableau_table.heading(col, text=col,
                command=lambda c=i: self._trier_colonne_table(c))
            self.tableau_table.column(col, width=130, anchor=tk.W, minwidth=60)
        for idx, ligne in enumerate(lignes):
            tag = "pair" if idx % 2 == 0 else "impair"
            self.tableau_table.insert("", tk.END,
                values=[str(v) if v is not None else "" for v in ligne],
                tags=(tag,))
        self.tableau_table.tag_configure("pair",   background="#F1F8E9")
        self.tableau_table.tag_configure("impair", background="white")

    def _filtrer_table(self, *args):
        terme = self.var_recherche_table.get().lower().strip()
        if not self._donnees_table_courante:
            return
        self._lignes_table_filtrees = [
            l for l in self._donnees_table_courante
            if not terme or any(terme in str(v).lower() for v in l)]
        self._page_table = 0
        self._rafraichir_page_table()

    def _trier_colonne_table(self, index_col):
        sens_actuel = self._tri_sens.get(index_col, False)
        self._tri_sens[index_col] = not sens_actuel

        def cle_tri(r):
            val = r[index_col]
            if val is None: return (2, 0)
            try:    return (0, float(val))
            except: return (1, str(val).lower())

        self._lignes_table_filtrees = sorted(
            self._lignes_table_filtrees, key=cle_tri, reverse=sens_actuel)
        self._page_table = 0
        self._rafraichir_page_table()

    # --------------------------------------------------------
    #   ONGLET CRUD
    # --------------------------------------------------------

    def _creer_onglet_crud(self, parent):
        conteneur = tk.Frame(parent, bg=self.couleur_fond)
        conteneur.pack(fill=tk.BOTH, expand=True)

        sidebar = tk.Frame(conteneur, bg="#1e2a1e", width=180)
        sidebar.pack(side=tk.LEFT, fill=tk.Y, padx=(10, 0), pady=10)
        sidebar.pack_propagate(False)

        tk.Label(sidebar, text="Tables", bg="#1e2a1e", fg="white",
                 font=("Helvetica", 12, "bold")).pack(pady=(15, 5))

        # Raccourcis rappel dans sidebar
        tk.Label(sidebar,
                 text="Ctrl+N  Ajouter\nSuppr   Supprimer\nF5      Rafraîchir",
                 bg="#1e2a1e", fg="#A5D6A7",
                 font=("Courier", 8),
                 justify=tk.LEFT).pack(pady=(0, 10), padx=8)

        self.table_selectionnee_crud  = tk.StringVar()
        self.boutons_tables_crud      = []

        zone_droite = tk.Frame(conteneur, bg=self.couleur_fond)
        zone_droite.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        def charger_tables():
            for w in self.boutons_tables_crud:
                w.destroy()
            self.boutons_tables_crud.clear()
            try:
                cursor = self.connexion.cursor()
                cursor.execute("SHOW TABLES")
                tables = [row[0] for row in cursor.fetchall()]
                cursor.close()
                for table in tables:
                    btn = tk.Button(
                        sidebar, text=table,
                        bg="#2e7d32", fg="white",
                        relief=tk.FLAT, cursor="hand2",
                        font=("Helvetica", 10),
                        command=lambda t=table: selectionner_table(t))
                    btn.pack(fill=tk.X, padx=8, pady=3)
                    self.boutons_tables_crud.append(btn)
            except Exception as e:
                messagebox.showerror("Erreur", str(e))

        def selectionner_table(nom_table):
            self.table_selectionnee_crud.set(nom_table)
            charger_contenu_table(nom_table)

        def charger_contenu_table(nom_table):
            for w in zone_droite.winfo_children():
                w.destroy()

            tk.Label(zone_droite, text=f"Table : {nom_table}",
                     font=("Helvetica", 13, "bold"),
                     bg=self.couleur_fond,
                     fg=self.couleur_principale).pack(anchor=tk.W, padx=10, pady=5)

            try:
                cursor = self.connexion.cursor()
                cursor.execute(f"SELECT * FROM `{nom_table}`")
                lignes   = cursor.fetchall()
                colonnes = [d[0] for d in cursor.description]
                cursor.close()
            except Exception as e:
                messagebox.showerror("Erreur", str(e))
                return

            # Mettre à jour les refs globales pour les raccourcis clavier
            self._crud_nom_table_courant  = nom_table
            self._crud_colonnes_courantes = colonnes
            self._crud_callback_refresh   = lambda: charger_contenu_table(nom_table)

            # Tableau
            frame_tv = tk.Frame(zone_droite, bg=self.couleur_fond)
            frame_tv.pack(fill=tk.BOTH, expand=True, padx=10)

            sv_y = ttk.Scrollbar(frame_tv, orient=tk.VERTICAL)
            sv_x = ttk.Scrollbar(frame_tv, orient=tk.HORIZONTAL)
            tv = ttk.Treeview(frame_tv, columns=colonnes, show="headings",
                              yscrollcommand=sv_y.set,
                              xscrollcommand=sv_x.set,
                              selectmode="browse")
            sv_y.config(command=tv.yview)
            sv_x.config(command=tv.xview)
            sv_y.pack(side=tk.RIGHT,  fill=tk.Y)
            sv_x.pack(side=tk.BOTTOM, fill=tk.X)
            tv.pack(fill=tk.BOTH, expand=True)

            for col in colonnes:
                tv.heading(col, text=col)
                tv.column(col, width=120, minwidth=60, anchor=tk.W)

            def remplir_tableau(donnees):
                tv.delete(*tv.get_children())
                for idx, ligne in enumerate(donnees):
                    tag = "pair" if idx % 2 == 0 else "impair"
                    tv.insert("", tk.END,
                              values=[str(v) if v is not None else "" for v in ligne],
                              tags=(tag,))

            remplir_tableau(lignes)
            tv.tag_configure("pair",   background="#F1F8E9")
            tv.tag_configure("impair", background="white")

            # Mettre à jour ref TV pour raccourcis
            self._crud_tv_courant = tv

            # ── Double-clic pour modifier ──────────────────────────
            def on_double_clic(event):
                sel = tv.selection()
                if not sel:
                    return
                valeurs = tv.item(sel[0])["values"]
                self._ouvrir_formulaire(
                    nom_table, colonnes, tv, valeurs, "modifier",
                    callback_refresh=lambda: charger_contenu_table(nom_table))

            tv.bind("<Double-1>", on_double_clic)
            # ──────────────────────────────────────────────────────

            # Barre de recherche CRUD
            frame_rech = tk.Frame(zone_droite, bg=self.couleur_fond)
            frame_rech.pack(fill=tk.X, padx=10, pady=(0, 3))

            tk.Label(frame_rech, text="🔍",
                     bg=self.couleur_fond,
                     font=("Helvetica", 10)).pack(side=tk.LEFT)

            var_rech = tk.StringVar()
            entry_rech = tk.Entry(frame_rech, textvariable=var_rech,
                                  font=("Helvetica", 10), width=30)
            entry_rech.pack(side=tk.LEFT, padx=5)

            lbl_nb = tk.Label(frame_rech,
                              text=f"{len(lignes)} ligne(s)",
                              font=("Helvetica", 9),
                              bg=self.couleur_fond, fg="#555")
            lbl_nb.pack(side=tk.LEFT, padx=5)

            tk.Button(frame_rech, text="✖",
                      bg="#FFCDD2", fg="#B71C1C",
                      relief=tk.FLAT,
                      command=lambda: var_rech.set("")).pack(side=tk.LEFT)

            def filtrer_crud(*args):
                terme = var_rech.get().lower().strip()
                filtrees = [
                    l for l in lignes
                    if not terme or any(terme in str(v).lower() for v in l)]
                remplir_tableau(filtrees)
                lbl_nb.config(text=f"{len(filtrees)} ligne(s)")

            var_rech.trace_add("write", filtrer_crud)

            # Boutons CRUD
            frame_actions = tk.Frame(zone_droite, bg=self.couleur_fond)
            frame_actions.pack(fill=tk.X, padx=10, pady=5)

            def ajouter():
                self._ouvrir_formulaire(
                    nom_table, colonnes, tv, None, "ajouter",
                    callback_refresh=lambda: charger_contenu_table(nom_table))

            def modifier():
                sel = tv.selection()
                if not sel:
                    messagebox.showwarning("Modifier", "Sélectionnez une ligne.")
                    return
                valeurs = tv.item(sel[0])["values"]
                self._ouvrir_formulaire(
                    nom_table, colonnes, tv, valeurs, "modifier",
                    callback_refresh=lambda: charger_contenu_table(nom_table))

            def supprimer():
                sel = tv.selection()
                if not sel:
                    messagebox.showwarning("Supprimer", "Sélectionnez une ligne.")
                    return
                if not messagebox.askyesno("Confirmer", "Supprimer cette ligne ?"):
                    return
                valeurs = tv.item(sel[0])["values"]
                try:
                    cursor = self.connexion.cursor()
                    cond   = " AND ".join(
                        [f"`{c}` = %s" for c in colonnes])
                    cursor.execute(
                        f"DELETE FROM `{nom_table}` WHERE {cond} LIMIT 1",
                        valeurs)
                    self.connexion.commit()
                    cursor.close()
                    charger_contenu_table(nom_table)
                except Exception as e:
                    messagebox.showerror("Erreur", str(e))

            def exporter_crud():
                chemin = filedialog.asksaveasfilename(
                    defaultextension=".csv",
                    filetypes=[("CSV", "*.csv")],
                    initialfile=f"{nom_table}_export.csv",
                    title="Exporter la table")
                if not chemin:
                    return
                try:
                    cursor = self.connexion.cursor()
                    cursor.execute(f"SELECT * FROM `{nom_table}`")
                    rows = cursor.fetchall()
                    cols = [d[0] for d in cursor.description]
                    cursor.close()
                    with open(chemin, "w", newline="",
                              encoding="utf-8-sig") as f:
                        writer = csv.writer(f, delimiter=";")
                        writer.writerow(cols)
                        for r in rows:
                            writer.writerow(
                                [str(v) if v is not None else "" for v in r])
                    messagebox.showinfo("Export réussi",
                                        f"✅ {len(rows)} ligne(s) exportée(s).")
                except Exception as e:
                    messagebox.showerror("Erreur export", str(e))

            for txt, cmd, couleur, raccourci in [
                ("➕ Ajouter  Ctrl+N",   ajouter,      "#388E3C", None),
                ("✏️ Modifier  ⮐",       modifier,     "#1976D2", None),
                ("🗑️ Supprimer  Suppr",  supprimer,    "#C62828", None),
                ("💾 Export CSV",         exporter_crud,"#6A1B9A", None),
                ("🔄 Rafraîchir  F5",    lambda: charger_contenu_table(nom_table),
                                                        "#455A64", None),
            ]:
                tk.Button(frame_actions, text=txt,
                          font=("Helvetica", 10, "bold"),
                          bg=couleur, fg="white",
                          relief=tk.FLAT, padx=10, pady=5,
                          command=cmd).pack(side=tk.LEFT, padx=4)

        charger_tables()

    def _ouvrir_formulaire(self, nom_table, colonnes, tv,
                           valeurs, mode, callback_refresh=None):
        fenetre = tk.Toplevel(self.root)
        fenetre.title("Ajouter" if mode == "ajouter" else "Modifier la ligne")
        fenetre.geometry("420x520")
        fenetre.configure(bg=self.couleur_fond)
        fenetre.grab_set()

        # En-tête formulaire
        couleur_header = "#388E3C" if mode == "ajouter" else "#1976D2"
        header = tk.Frame(fenetre, bg=couleur_header, height=50)
        header.pack(fill=tk.X)
        header.pack_propagate(False)

        icone = "➕" if mode == "ajouter" else "✏️"
        tk.Label(header,
                 text=f"{icone}  {'Ajouter' if mode == 'ajouter' else 'Modifier'} — {nom_table}",
                 font=("Helvetica", 13, "bold"),
                 bg=couleur_header, fg="white").pack(
                     side=tk.LEFT, padx=15, pady=10)

        # Si double-clic / modifier : afficher un rappel
        if mode == "modifier":
            tk.Label(fenetre,
                     text="💡 Double-clic sur une ligne pour modifier rapidement",
                     font=("Helvetica", 8, "italic"),
                     bg=self.couleur_fond, fg="#888").pack(anchor=tk.W, padx=15, pady=(5, 0))

        # Zone scrollable pour les champs
        canvas = tk.Canvas(fenetre, bg=self.couleur_fond, highlightthickness=0)
        scroll = ttk.Scrollbar(fenetre, orient=tk.VERTICAL,
                               command=canvas.yview)
        canvas.configure(yscrollcommand=scroll.set)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        canvas.pack(fill=tk.BOTH, expand=True, padx=15, pady=10)

        frame_champs = tk.Frame(canvas, bg=self.couleur_fond)
        canvas.create_window((0, 0), window=frame_champs, anchor=tk.NW)

        entries = {}
        for i, col in enumerate(colonnes):
            bg = "#F1F8E9" if i % 2 == 0 else "white"
            row = tk.Frame(frame_champs, bg=bg)
            row.pack(fill=tk.X, pady=2)

            tk.Label(row, text=col, width=18,
                     font=("Helvetica", 10, "bold"),
                     bg=bg, fg="#1B5E20",
                     anchor=tk.W).pack(side=tk.LEFT, padx=(5, 0), pady=5)

            var = tk.StringVar(
                value=str(valeurs[i]) if valeurs and i < len(valeurs) else "")
            e = tk.Entry(row, textvariable=var,
                         font=("Helvetica", 10), width=25,
                         relief=tk.SOLID, bd=1)
            e.pack(side=tk.LEFT, pady=5, padx=5)
            entries[col] = var

            # Focus automatique sur le 1er champ
            if i == 0:
                e.focus_set()

        frame_champs.update_idletasks()
        canvas.configure(scrollregion=canvas.bbox("all"))

        def valider(event=None):
            nouvelles_valeurs = [entries[c].get() for c in colonnes]
            try:
                cursor = self.connexion.cursor()
                if mode == "ajouter":
                    placeholders = ", ".join(["%s"] * len(colonnes))
                    cols_str     = ", ".join([f"`{c}`" for c in colonnes])
                    cursor.execute(
                        f"INSERT INTO `{nom_table}` ({cols_str}) "
                        f"VALUES ({placeholders})",
                        nouvelles_valeurs)
                else:
                    set_clause = ", ".join([f"`{c}` = %s" for c in colonnes])
                    cond       = " AND ".join([f"`{c}` = %s" for c in colonnes])
                    cursor.execute(
                        f"UPDATE `{nom_table}` "
                        f"SET {set_clause} WHERE {cond} LIMIT 1",
                        nouvelles_valeurs + list(valeurs))
                self.connexion.commit()
                cursor.close()
                fenetre.destroy()
                messagebox.showinfo("Succès", "✅ Opération effectuée avec succès.")
                # Rafraîchir le tableau
                if callback_refresh:
                    callback_refresh()
            except Exception as e:
                messagebox.showerror("Erreur SQL", str(e))

        # Entrée clavier pour valider
        fenetre.bind("<Return>", valider)

        # Boutons Valider / Annuler
        frame_btns = tk.Frame(fenetre, bg=self.couleur_fond)
        frame_btns.pack(fill=tk.X, padx=15, pady=(0, 12))

        tk.Button(frame_btns,
                  text="✅ Valider",
                  font=("Helvetica", 11, "bold"),
                  bg=couleur_header, fg="white",
                  relief=tk.FLAT, padx=15, pady=6,
                  command=valider).pack(side=tk.LEFT, padx=(0, 8))

        tk.Button(frame_btns,
                  text="❌ Annuler",
                  font=("Helvetica", 11, "bold"),
                  bg="#BDBDBD", fg="#212121",
                  relief=tk.FLAT, padx=15, pady=6,
                  command=fenetre.destroy).pack(side=tk.LEFT)

    # --------------------------------------------------------
    #   ONGLET TABLES BDD
    # --------------------------------------------------------

    def _construire_onglet_tables(self, parent):
        frame_gauche = tk.Frame(parent, bg=self.couleur_secondaire, width=200)
        frame_gauche.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 5))
        frame_gauche.pack_propagate(False)

        tk.Label(frame_gauche,
                 text="🗄️ Tables disponibles",
                 font=("Helvetica", 12, "bold"),
                 bg=self.couleur_secondaire,
                 fg="#1B5E20").pack(pady=15)

        frame_liste = tk.Frame(frame_gauche, bg=self.couleur_secondaire)
        frame_liste.pack(fill=tk.BOTH, expand=True)

        scroll_liste = ttk.Scrollbar(frame_liste, orient=tk.VERTICAL)
        self.liste_tables = tk.Listbox(
            frame_liste,
            yscrollcommand=scroll_liste.set,
            font=("Helvetica", 11),
            bg="white", fg="#1B5E20",
            selectbackground=self.couleur_principale,
            selectforeground="white",
            relief=tk.FLAT, bd=0,
            activestyle="none")
        scroll_liste.config(command=self.liste_tables.yview)
        scroll_liste.pack(side=tk.RIGHT, fill=tk.Y)
        self.liste_tables.pack(fill=tk.BOTH, expand=True)
        self.liste_tables.bind("<<ListboxSelect>>", self._on_table_selectionnee)

        frame_droit = tk.Frame(parent, bg=self.couleur_fond)
        frame_droit.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        frame_titre = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_titre.pack(fill=tk.X, padx=10, pady=(10, 0))

        self.label_titre_table = tk.Label(
            frame_titre,
            text="Sélectionnez une table",
            font=("Helvetica", 13, "bold"),
            bg=self.couleur_fond,
            fg=self.couleur_principale)
        self.label_titre_table.pack(side=tk.LEFT)

        self.label_nb_lignes_table = tk.Label(
            frame_titre, text="",
            font=("Helvetica", 10),
            bg=self.couleur_fond, fg="#555")
        self.label_nb_lignes_table.pack(side=tk.RIGHT)

        frame_recherche = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_recherche.pack(fill=tk.X, padx=10, pady=5)

        tk.Label(frame_recherche, text="🔍 Recherche :",
                 font=("Helvetica", 10),
                 bg=self.couleur_fond).pack(side=tk.LEFT)

        self.var_recherche_table = tk.StringVar()
        self.var_recherche_table.trace_add("write", self._filtrer_table)

        tk.Entry(frame_recherche,
                 textvariable=self.var_recherche_table,
                 font=("Helvetica", 10),
                 width=30).pack(side=tk.LEFT, padx=5)

        tk.Button(frame_recherche, text="✖",
                  bg="#FFCDD2", fg="#B71C1C", relief=tk.FLAT,
                  command=lambda: self.var_recherche_table.set("")).pack(side=tk.LEFT)

        tk.Button(frame_recherche,
                  text="💾 Exporter CSV",
                  font=("Helvetica", 10, "bold"),
                  bg=self.couleur_principale, fg="white",
                  relief=tk.FLAT, padx=8,
                  command=self._exporter_table_csv).pack(side=tk.RIGHT, padx=(5, 0))

        tk.Button(frame_recherche,
                  text="🔄 Rafraîchir F5",
                  font=("Helvetica", 10),
                  bg=self.couleur_secondaire, fg="#1B5E20",
                  relief=tk.FLAT, padx=8,
                  command=self._charger_liste_tables).pack(side=tk.RIGHT, padx=5)

        frame_tableau = tk.Frame(frame_droit, bg=self.couleur_fond)
        frame_tableau.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        sv_y = ttk.Scrollbar(frame_tableau, orient=tk.VERTICAL)
        sv_x = ttk.Scrollbar(frame_tableau, orient=tk.HORIZONTAL)

        self.tableau_table = ttk.Treeview(
            frame_tableau,
            yscrollcommand=sv_y.set,
            xscrollcommand=sv_x.set,
            selectmode="browse")
        sv_y.config(command=self.tableau_table.yview)
        sv_x.config(command=self.tableau_table.xview)
        sv_y.pack(side=tk.RIGHT,  fill=tk.Y)
        sv_x.pack(side=tk.BOTTOM, fill=tk.X)
        self.tableau_table.pack(fill=tk.BOTH, expand=True)

        self._frame_pagination_table = tk.Frame(frame_droit, bg=self.couleur_fond)
        self._frame_pagination_table.pack(fill=tk.X, padx=10, pady=(0, 5))
        self._construire_barre_pagination_table()

        self._charger_liste_tables()

    def _construire_barre_pagination_table(self):
        f = self._frame_pagination_table
        for w in f.winfo_children():
            w.destroy()

        for txt, cmd in [("⏮ Début", self._table_premiere_page),
                         ("◀ Préc",  self._table_page_precedente)]:
            tk.Button(f, text=txt, bg=self.couleur_secondaire, fg="#1B5E20",
                      relief=tk.FLAT, font=("Helvetica", 9),
                      command=cmd).pack(side=tk.LEFT, padx=2)

        self.label_page_table = tk.Label(f, text="Page 1 / 1",
                                         font=("Helvetica", 9),
                                         bg=self.couleur_fond, fg="#333")
        self.label_page_table.pack(side=tk.LEFT, padx=8)

        for txt, cmd in [("Suiv ▶", self._table_page_suivante),
                         ("Fin ⏭",  self._table_derniere_page)]:
            tk.Button(f, text=txt, bg=self.couleur_secondaire, fg="#1B5E20",
                      relief=tk.FLAT, font=("Helvetica", 9),
                      command=cmd).pack(side=tk.LEFT, padx=2)

        tk.Label(f, text="  Lignes/page :",
                 font=("Helvetica", 9),
                 bg=self.couleur_fond).pack(side=tk.LEFT, padx=(15, 2))

        self.var_lpp_table = tk.StringVar(value=str(self._lignes_par_page_table))
        cb = ttk.Combobox(f, textvariable=self.var_lpp_table,
                          values=["10", "25", "50", "100", "200"],
                          width=5, state="readonly")
        cb.pack(side=tk.LEFT)
        cb.bind("<<ComboboxSelected>>", self._changer_lpp_table)

    # --------------------------------------------------------
    #   MÉTHODES CSV (boutons / affichage / filtrage)
    # --------------------------------------------------------

    def _creer_bouton_csv(self, parent, config):
        frame_btn = tk.Frame(parent, bg=self.couleur_secondaire)
        frame_btn.pack(fill=tk.X, padx=8, pady=3)

        if config["logo"] and os.path.exists(config["logo"]):
            try:
                img = Image.open(config["logo"]).convert("RGBA")
                img = img.resize((32, 32), Image.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self._images_csv[config["nom"]] = photo
                tk.Label(frame_btn, image=photo,
                         bg=self.couleur_secondaire).pack(side=tk.LEFT, padx=4)
            except Exception:
                pass

        tk.Button(frame_btn,
                  text=config["nom"],
                  font=("Helvetica", 10, "bold"),
                  bg=self.couleur_principale, fg="white",
                  relief=tk.FLAT, cursor="hand2",
                  command=lambda c=config: self._afficher_csv(c)).pack(
                      side=tk.LEFT, fill=tk.X, expand=True, pady=3)

    def _afficher_csv(self, config):
        self._config_csv_actuel = config
        chemin = config["fichier"]
        if not os.path.exists(chemin):
            messagebox.showerror("Fichier introuvable",
                                 f"Le fichier '{chemin}' est introuvable.")
            return
        try:
            with open(chemin, newline="", encoding="latin-1") as f:
                reader = csv.reader(f, delimiter=";")
                lignes = list(reader)
            if not lignes:
                messagebox.showinfo("Fichier vide", "Ce fichier CSV est vide.")
                return
            entetes = lignes[0]
            donnees = lignes[1:]
            self._entetes_csv_brutes     = entetes
            self._lignes_csv_brutes      = donnees
            self._lignes_csv_filtrees    = list(donnees)
            self._page_csv               = 0
            self.var_recherche_csv.set("")
            self.label_titre_csv.config(text=f"📄 {config['nom']}")
            self._configurer_colonnes_csv(entetes)
            self._rafraichir_page_csv()
        except Exception as e:
            messagebox.showerror("Erreur lecture CSV", str(e))

    def _configurer_colonnes_csv(self, entetes):
        self.tableau_csv["columns"] = entetes
        self.tableau_csv["show"]    = "headings"
        for i, col in enumerate(entetes):
            self.tableau_csv.heading(
                col, text=col,
                command=lambda c=i: self._trier_colonne_csv(c))
            self.tableau_csv.column(col, width=130, anchor=tk.W, minwidth=60)

    def _afficher_lignes_csv(self, entetes, lignes):
        self.tableau_csv.delete(*self.tableau_csv.get_children())
        for idx, ligne in enumerate(lignes):
            tag = "pair" if idx % 2 == 0 else "impair"
            self.tableau_csv.insert("", tk.END, values=ligne, tags=(tag,))
        self.tableau_csv.tag_configure("pair",   background="#F1F8E9")
        self.tableau_csv.tag_configure("impair", background="white")

    def _filtrer_csv(self, *args):
        terme = self.var_recherche_csv.get().lower().strip()
        self._lignes_csv_filtrees = [
            l for l in self._lignes_csv_brutes
            if not terme or any(terme in str(v).lower() for v in l)]
        self._page_csv = 0
        self._rafraichir_page_csv()

    def _trier_colonne_csv(self, index_col):
        sens = self._tri_sens.get(f"csv_{index_col}", False)
        self._tri_sens[f"csv_{index_col}"] = not sens

        def cle(r):
            val = r[index_col] if index_col < len(r) else ""
            try:    return (0, float(val))
            except: return (1, str(val).lower())

        self._lignes_csv_filtrees = sorted(
            self._lignes_csv_filtrees, key=cle, reverse=sens)
        self._page_csv = 0
        self._rafraichir_page_csv()

    def _exporter_csv(self):
        if not self._lignes_csv_filtrees:
            messagebox.showwarning("Export", "Aucune donnée à exporter.")
            return
        chemin = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV", "*.csv")],
            title="Enregistrer l'export",
            initialfile="export.csv")
        if not chemin:
            return
        try:
            with open(chemin, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f, delimiter=";")
                writer.writerow(self._entetes_csv_brutes)
                writer.writerows(self._lignes_csv_filtrees)
            messagebox.showinfo("Export réussi",
                                f"✅ {len(self._lignes_csv_filtrees)} "
                                f"ligne(s) exportée(s).")
        except Exception as e:
            messagebox.showerror("Erreur export", str(e))

    # --------------------------------------------------------
    #   BARRE DE STATUT
    # --------------------------------------------------------

    def _creer_barre_statut(self):
        frame_statut = tk.Frame(self.root, bg="#BDBDBD", height=25)
        frame_statut.pack(fill=tk.X, side=tk.BOTTOM)
        frame_statut.pack_propagate(False)

        tk.Label(frame_statut, text="Prêt  |  F1 : Raccourcis",
                 font=("Helvetica", 9),
                 bg="#BDBDBD", fg="#212121",
                 anchor=tk.W).pack(side=tk.LEFT, padx=10)

        tk.Label(frame_statut, text="GreenSD v1.0",
                 font=("Helvetica", 9),
                 bg="#BDBDBD", fg="#212121").pack(side=tk.RIGHT, padx=10)

    # --------------------------------------------------------
    #   FERMETURE PROPRE
    # --------------------------------------------------------

    def _fermeture_application(self):
        if messagebox.askokcancel("Quitter",
                                  "Voulez-vous vraiment quitter GreenSD ?"):
            fermer_connexion(self.connexion)
            self.root.destroy()


# ============================================================
#                        MAIN
# ============================================================

if __name__ == "__main__":
    root = tk.Tk()
    app  = ApplicationGreenSD(root)
    root.mainloop()