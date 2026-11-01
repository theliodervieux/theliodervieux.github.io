"""
labvision.py
Interface graphique LabVision pour l'analyse PCR Mycoplasmes.

Dépendances : customtkinter, pandas, matplotlib, seaborn, openpyxl, pillow
Lancer     : python labvision.py
"""

import os
import sys
import subprocess
import threading
from pathlib import Path

import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
from datetime import datetime

import pandas as pd
import matplotlib
matplotlib.use("Agg")   # moteur non-interactif — évite les conflits avec tkinter
import matplotlib.pyplot as plt

# PIL sous alias pour ne pas entrer en conflit avec openpyxl.drawing.image
from PIL import Image as PILImage, ImageTk

# SAE_insertion.py doit être dans le même dossier
try:
    from SAE_insertion import process_data_from_tkinter
except ImportError:
    import tkinter as _tk
    _tk.Tk().withdraw()
    messagebox.showerror(
        "Erreur d'import",
        "Fichier 'SAE_insertion.py' introuvable.\n"
        "Placez-le dans le même dossier que LabVision.py."
    )
    sys.exit(1)


# ── Configuration ──────────────────────────────────────────────────────────────

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

COLORS = {
    "bg":      "#445162",
    "sidebar": "#2F5D9F",
    "card":    "#5B6775",
    "accent":  "#3B82F6",
    "hover":   "#4B74B8",
    "text":    "#F9FAFB",
    "sub":     "#E5E7EB",
    "success": "#22C55E",
    "error":   "#EF4444",
    "warn":    "#F59E0B",
}

# Dossier de travail = dossier du script
BASE_DIR = Path(__file__).parent

SIDEBAR_W = 270   # ← largeur sidebar augmentée (était 220, trop étroit)


# ── État global ────────────────────────────────────────────────────────────────

class AppState:
    fichier_resultats: Path | None = None   # chemin du resultats.xlsx produit / chargé
    fichiers_source:   list        = []     # fichiers xls/xlsx à traiter
    fichier_base:      str | None  = None   # resultats.xlsx existant (optionnel)
    traitement_ok:     bool        = False  # True si données prêtes à visualiser

state = AppState()


# ── Helpers UI ─────────────────────────────────────────────────────────────────

def ouvrir_fichier(chemin: Path):
    """Ouvre un fichier avec l'application par défaut du système (cross-platform)."""
    if chemin is None or not chemin.exists():
        messagebox.showerror("Erreur", f"Fichier introuvable :\n{chemin}")
        return
    if sys.platform == "win32":
        os.startfile(str(chemin))
    elif sys.platform == "darwin":
        subprocess.run(["open", str(chemin)])
    else:
        subprocess.run(["xdg-open", str(chemin)])


def carte(parent, **kw) -> ctk.CTkFrame:
    return ctk.CTkFrame(parent, fg_color=COLORS["card"], corner_radius=12, **kw)


def titre(parent, texte: str, taille: int = 22) -> ctk.CTkLabel:
    return ctk.CTkLabel(parent, text=texte,
                        font=("Segoe UI", taille, "bold"),
                        text_color=COLORS["text"])


def sous_titre(parent, texte: str, wrap: int = 700) -> ctk.CTkLabel:
    return ctk.CTkLabel(parent, text=texte,
                        text_color=COLORS["sub"], wraplength=wrap)


def bouton(parent, texte: str, cmd, couleur=None, **kw) -> ctk.CTkButton:
    return ctk.CTkButton(parent, text=texte, command=cmd,
                         fg_color=couleur or COLORS["accent"],
                         hover_color=COLORS["hover"],
                         corner_radius=8,
                         font=("Segoe UI", 13), **kw)


# ── Application principale ─────────────────────────────────────────────────────

class LabVision(ctk.CTk):

    def __init__(self):
        super().__init__()

        # Stockage des PhotoImage pour éviter le garbage-collector
        # (cause du bug "pages grises")
        self._images: list = []

        # ── Fenêtre ────────────────────────────────────────────────────────────
        self.title("LabVision")
        self.configure(fg_color=COLORS["bg"])

        # Logo barre des tâches — appelé via after() pour que la fenêtre
        # soit pleinement initialisée, sinon iconbitmap est ignoré sur Windows
        ico = BASE_DIR / "logo.ico"
        if ico.exists():
            self.after(100, lambda: self._set_icon(ico))

        # Plein écran
        self.update_idletasks()
        w = self.winfo_screenwidth()
        h = self.winfo_screenheight()
        self.geometry(f"{w}x{h}+0+0")
        self.after(100, lambda: self.state("zoomed"))
        # ── Grille principale : sidebar | contenu ──────────────────────────────
        self.grid_columnconfigure(0, minsize=SIDEBAR_W)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._construire_sidebar()
        self._construire_zone_principale()

        self.show_page("home")

    def _set_icon(self, ico: Path):
        """Applique l'icône après initialisation complète de la fenêtre."""
        try:
            self.iconbitmap(str(ico))
        except Exception:
            # Fallback PIL si iconbitmap échoue (Linux / certaines configs Windows)
            try:
                img = PILImage.open(str(ico))
                photo = ImageTk.PhotoImage(img)
                self.wm_iconphoto(True, photo)
                self._icon_ref = photo   # garder la référence
            except Exception:
                pass

    # ── Sidebar ────────────────────────────────────────────────────────────────

    def _construire_sidebar(self):
        self.sidebar = ctk.CTkFrame(self, width=SIDEBAR_W, fg_color=COLORS["sidebar"])
        self.sidebar.grid(row=0, column=0, sticky="ns")
        self.sidebar.grid_propagate(False)

        # Logo
        logo_path = BASE_DIR / "logo.png"
        if logo_path.exists():
            try:
                ratio = PILImage.open(str(logo_path)).size   # (w, h)
                target_w = SIDEBAR_W - 40
                target_h = int(target_w * ratio[1] / ratio[0])
                target_h = min(target_h, 80)
                img = PILImage.open(str(logo_path)).resize((target_w, target_h), PILImage.LANCZOS)
                self._logo_img = ImageTk.PhotoImage(img)
                logo_frame = ctk.CTkFrame(self.sidebar, fg_color="#6F8FB8", corner_radius=8)
                logo_frame.pack(pady=(24, 16), padx=16, fill="x")
                tk.Label(logo_frame, image=self._logo_img,
                         bg="#6F8FB8", borderwidth=0).pack(pady=10)
            except Exception:
                titre(self.sidebar, "LabVision", 16).pack(pady=20)
        else:
            titre(self.sidebar, "LabVision", 16).pack(pady=20)

        # Boutons de navigation
        self._nav_buttons: dict[str, ctk.CTkButton] = {}
        pages = [
            ("home",      "🏠  Accueil"),
            ("import",    "📥  Import"),
            ("visu",      "📄  Données"),
            ("dashboard", "📊  Tableau de bord"),
        ]
        for key, label in pages:
            btn = ctk.CTkButton(
                self.sidebar, text=label,
                fg_color="#3E6FB0", text_color="white",
                hover_color=COLORS["hover"],
                height=50, corner_radius=10,
                anchor="w", font=("Segoe UI", 13),
                command=lambda k=key: self.show_page(k)
            )
            btn.pack(fill="x", padx=16, pady=6)
            self._nav_buttons[key] = btn

    # ── Zone principale ────────────────────────────────────────────────────────

    def _construire_zone_principale(self):
        zone = ctk.CTkFrame(self, fg_color=COLORS["bg"])
        zone.grid(row=0, column=1, sticky="nsew")
        zone.grid_rowconfigure(1, weight=1)
        zone.grid_columnconfigure(0, weight=1)

        # Header fixe
        self.header = ctk.CTkFrame(zone, height=56, fg_color="#6B7280", corner_radius=0)
        self.header.grid(row=0, column=0, sticky="ew")
        self.header.grid_propagate(False)

        self.header_title = ctk.CTkLabel(
            self.header, text="Accueil",
            font=("Segoe UI", 18, "bold"),
            text_color=COLORS["text"]
        )
        self.header_title.pack(side="left", padx=20)

        ctk.CTkLabel(self.header,
                     text=datetime.now().strftime("%d/%m/%Y"),
                     text_color=COLORS["sub"]).pack(side="right", padx=20)

        # Zone de contenu scrollable
        self.content = ctk.CTkScrollableFrame(zone, fg_color=COLORS["bg"])
        self.content.grid(row=1, column=0, sticky="nsew")

    # ── Navigation ─────────────────────────────────────────────────────────────

    def show_page(self, key: str):
        # Vider la liste des images AVANT de détruire les widgets
        # Ceci évite que les PhotoImage soient libérés pendant que
        # d'anciens tk.Label existent encore (cause des pages grises)
        self._images.clear()

        for w in self.content.winfo_children():
            w.destroy()
        self.update_idletasks()

        for k, btn in self._nav_buttons.items():
            btn.configure(fg_color="#1E3A8A" if k == key else "#3E6FB0")

        pages = {
            "home":      ("🏠  Accueil",            self._page_home),
            "import":    ("📥  Import données",      self._page_import),
            "visu":      ("📄  Visualiser données",  self._page_visu),
            "dashboard": ("📊  Tableau de bord",     self._page_dashboard),
        }
        label, fn = pages[key]
        self.header_title.configure(text=label)
        fn()

    # ── Page Accueil ───────────────────────────────────────────────────────────

    def _page_home(self):
        c = self.content

        titre(c, "Bienvenue sur LabVision", 26).pack(pady=(40, 8))
        sous_titre(c, "Application de suivi et d'analyse des données PCR Mycoplasmes").pack(pady=(0, 30))

        infos = [
            ("📥  Import",
             "Chargez vos fichiers Excel source et lancez le traitement.\n"
             "Vous pouvez aussi charger uniquement un fichier résultats existant pour le visualiser."),
            ("📄  Visualiser",
             "Consultez les données du fichier résultat : liste des exploitations et valeurs par série."),
            ("📊  Tableau de bord",
             "Affichez les graphiques et KPI générés, et ouvrez le fichier Excel complet."),
        ]
        for icone_titre, desc in infos:
            f = carte(c)
            f.pack(fill="x", padx=60, pady=8)
            ctk.CTkLabel(f, text=icone_titre,
                         font=("Segoe UI", 14, "bold"),
                         text_color=COLORS["text"]).pack(anchor="w", padx=20, pady=(14, 2))
            ctk.CTkLabel(f, text=desc,
                         text_color=COLORS["sub"], wraplength=800).pack(anchor="w", padx=20, pady=(0, 14))

    # ── Page Import ────────────────────────────────────────────────────────────

    def _page_import(self):
        c = self.content

        titre(c, "📥  Import des données", 22).pack(pady=(30, 20))

        # ── Bloc 1 : fichiers source (optionnel si base fournie) ──────────────
        f1 = carte(c)
        f1.pack(fill="x", padx=40, pady=8)

        ctk.CTkLabel(f1, text="Fichiers source à traiter  (optionnel si base déjà traitée)",
                     font=("Segoe UI", 14, "bold"),
                     text_color=COLORS["text"]).pack(anchor="w", padx=20, pady=(14, 4))
        ctk.CTkLabel(f1,
                     text="Sélectionnez un ou plusieurs fichiers .xls/.xlsx contenant les données PCR brutes.",
                     text_color=COLORS["sub"], wraplength=800).pack(anchor="w", padx=20)

        self._lbl_source = ctk.CTkLabel(
            f1, text="Aucun fichier sélectionné",
            text_color=COLORS["warn"], wraplength=750
        )
        self._lbl_source.pack(anchor="w", padx=20, pady=4)

        row_src = ctk.CTkFrame(f1, fg_color="transparent")
        row_src.pack(anchor="w", padx=20, pady=(0, 14))
        bouton(row_src, "📂  Choisir fichiers source", self._choisir_sources).pack(side="left", padx=(0, 10))
        bouton(row_src, "✖  Effacer", self._effacer_sources, couleur=COLORS["card"]).pack(side="left")

        # ── Bloc 2 : fichier résultats existant ───────────────────────────────
        f2 = carte(c)
        f2.pack(fill="x", padx=40, pady=8)

        ctk.CTkLabel(f2, text="Fichier résultats existant",
                     font=("Segoe UI", 14, "bold"),
                     text_color=COLORS["text"]).pack(anchor="w", padx=20, pady=(14, 4))
        ctk.CTkLabel(f2,
                     text="Chargez un resultats.xlsx déjà produit pour le visualiser directement "
                          "ou y ajouter de nouvelles données.",
                     text_color=COLORS["sub"], wraplength=800).pack(anchor="w", padx=20)

        self._lbl_base = ctk.CTkLabel(
            f2, text="Aucun fichier base sélectionné",
            text_color=COLORS["sub"]
        )
        self._lbl_base.pack(anchor="w", padx=20, pady=4)

        row_base = ctk.CTkFrame(f2, fg_color="transparent")
        row_base.pack(anchor="w", padx=20, pady=(0, 14))
        bouton(row_base, "📂  Choisir base existante", self._choisir_base).pack(side="left", padx=(0, 10))
        bouton(row_base, "✖  Effacer", self._effacer_base, couleur=COLORS["card"]).pack(side="left")

        # ── Bloc 3 : dossier de sortie ────────────────────────────────────────
        f3 = carte(c)
        f3.pack(fill="x", padx=40, pady=8)

        ctk.CTkLabel(f3, text="Dossier de sauvegarde",
                     font=("Segoe UI", 14, "bold"),
                     text_color=COLORS["text"]).pack(anchor="w", padx=20, pady=(14, 4))
        ctk.CTkLabel(f3,
                     text="Dossier où sera enregistré le fichier résultats.xlsx "
                          "(ignoré si une base existante est sélectionnée).",
                     text_color=COLORS["sub"], wraplength=800).pack(anchor="w", padx=20)

        self._lbl_dossier = ctk.CTkLabel(
            f3, text=f"Par défaut : {BASE_DIR}",
            text_color=COLORS["sub"], wraplength=750
        )
        self._lbl_dossier.pack(anchor="w", padx=20, pady=4)
        self._dossier_sortie = BASE_DIR

        bouton(f3, "📁  Choisir dossier", self._choisir_dossier).pack(
            anchor="w", padx=20, pady=(0, 14)
        )

        # ── Séparateur + boutons d'action ─────────────────────────────────────
        sep = ctk.CTkFrame(c, fg_color=COLORS["card"], height=2)
        sep.pack(fill="x", padx=40, pady=(16, 0))

        self._progress = ctk.CTkProgressBar(c, width=600)
        self._progress.set(0)
        self._progress.pack(pady=(20, 6))

        self._lbl_progress = ctk.CTkLabel(c, text="", text_color=COLORS["sub"])
        self._lbl_progress.pack()

        row_action = ctk.CTkFrame(c, fg_color="transparent")
        row_action.pack(pady=16)

        bouton(row_action, "✅  Lancer le traitement",
               self._lancer_traitement,
               couleur=COLORS["success"], height=44, width=240).pack(side="left", padx=10)

        bouton(row_action, "👁  Visualiser base sans retraiter",
               self._charger_base_seule,
               couleur=COLORS["accent"], height=44, width=240).pack(side="left", padx=10)

    # ── Actions Import ─────────────────────────────────────────────────────────

    def _choisir_sources(self):
        fichiers = filedialog.askopenfilenames(
            title="Fichiers source",
            filetypes=[("Excel", "*.xls *.xlsx")]
        )
        if not fichiers:
            return
        state.fichiers_source = list(fichiers)
        noms = "\n".join(Path(f).name for f in fichiers)
        self._lbl_source.configure(
            text=f"✅  {len(fichiers)} fichier(s) :\n{noms}",
            text_color=COLORS["success"]
        )

    def _effacer_sources(self):
        state.fichiers_source = []
        self._lbl_source.configure(
            text="Aucun fichier sélectionné",
            text_color=COLORS["warn"]
        )

    def _choisir_base(self):
        f = filedialog.askopenfilename(
            title="Fichier résultats existant",
            filetypes=[("Excel", "*.xlsx")]
        )
        if not f:
            return
        state.fichier_base = f
        self._lbl_base.configure(
            text=f"✅  {Path(f).name}",
            text_color=COLORS["success"]
        )

    def _effacer_base(self):
        state.fichier_base = None
        self._lbl_base.configure(
            text="Aucun fichier base sélectionné",
            text_color=COLORS["sub"]
        )

    def _choisir_dossier(self):
        d = filedialog.askdirectory(title="Dossier de sauvegarde")
        if not d:
            return
        self._dossier_sortie = Path(d)
        self._lbl_dossier.configure(text=str(self._dossier_sortie))

    def _charger_base_seule(self):
        """
        Charge un fichier résultats existant pour visualisation SANS
        relancer le traitement. Résout le bug "pas possible de visualiser
        sans traiter de nouveaux fichiers".
        """
        if not state.fichier_base:
            messagebox.showerror(
                "Erreur",
                "Sélectionnez d'abord un fichier résultats existant (bloc 2)."
            )
            return
        chemin = Path(state.fichier_base)
        if not chemin.exists():
            messagebox.showerror("Erreur", f"Fichier introuvable :\n{chemin}")
            return

        state.fichier_resultats = chemin
        state.traitement_ok = True
        messagebox.showinfo(
            "Fichier chargé",
            f"Base chargée avec succès :\n{chemin.name}\n\n"
            "Vous pouvez maintenant utiliser les onglets\n"
            "« Données » et « Tableau de bord »."
        )
        self.show_page("visu")

    def _lancer_traitement(self):
        if not state.fichiers_source:
            messagebox.showerror(
                "Erreur",
                "Sélectionnez au moins un fichier source à traiter.\n\n"
                "Si vous voulez juste visualiser une base existante,\n"
                "utilisez le bouton « Visualiser base sans retraiter »."
            )
            return

        # Chemin de sortie
        if state.fichier_base:
            chemin_sortie = Path(state.fichier_base)
        else:
            chemin_sortie = self._dossier_sortie / "resultats.xlsx"

        self._progress.set(0)
        self._lbl_progress.configure(text="Traitement en cours...", text_color=COLORS["sub"])
        self.update_idletasks()

        def run():
            try:
                self.after(0, lambda: self._set_progress(0.15, "Chargement des fichiers source..."))
                # Copier la base existante vers chemin_sortie pour ne pas perdre les anciennes données
                if state.fichier_base:
                    import shutil
                    base_chemin = Path(state.fichier_base)
                    if base_chemin.exists() and base_chemin.resolve() != chemin_sortie.resolve():
                        shutil.copy2(str(base_chemin), str(chemin_sortie))
                process_data_from_tkinter(state.fichiers_source, str(chemin_sortie))
                state.fichier_resultats = chemin_sortie
                state.traitement_ok = True
                self.after(0, lambda: self._set_progress(1.0, "✅  Traitement terminé !"))
                self.after(0, lambda: messagebox.showinfo(
                    "Succès",
                    f"Traitement terminé.\nFichier enregistré :\n{chemin_sortie}"
                ))
            except Exception as e:
                state.traitement_ok = False
                msg = str(e)
                self.after(0, lambda: self._set_progress(0, f"❌  Erreur : {msg}"))
                self.after(0, lambda: messagebox.showerror("Erreur lors du traitement", msg))

        threading.Thread(target=run, daemon=True).start()

    def _set_progress(self, valeur: float, texte: str):
        self._progress.set(valeur)
        self._lbl_progress.configure(
            text=texte,
            text_color=COLORS["success"] if valeur == 1.0 else COLORS["sub"]
        )
        self.update_idletasks()

    # ── Page Visualisation ─────────────────────────────────────────────────────

    def _page_visu(self):
        c = self.content

        titre(c, "📄  Visualisation des données", 22).pack(pady=(30, 10))

        if not state.traitement_ok or state.fichier_resultats is None:
            f = carte(c)
            f.pack(padx=40, pady=20, fill="x")
            ctk.CTkLabel(f,
                text="⚠️  Aucune donnée disponible.\n\n"
                     "• Chargez et traitez des fichiers source (onglet Import),\n"
                     "• ou chargez directement un fichier résultats existant\n"
                     "  via « Visualiser base sans retraiter ».",
                text_color=COLORS["warn"], font=("Segoe UI", 13),
                justify="left"
            ).pack(pady=30, padx=20)
            return

        try:
            xls = pd.ExcelFile(str(state.fichier_resultats))
            feuilles = [s for s in xls.sheet_names if s.lower() not in ("dashboard",)]
        except Exception as e:
            ctk.CTkLabel(c, text=f"❌  Impossible de lire le fichier :\n{e}",
                         text_color=COLORS["error"]).pack(pady=20)
            return

        sous_titre(c,
            f"Fichier : {state.fichier_resultats.name}   |   {len(feuilles)} feuille(s)"
        ).pack(pady=(0, 12))

        # Sélecteur de feuille
        row_sel = ctk.CTkFrame(c, fg_color="transparent")
        row_sel.pack(pady=6)
        ctk.CTkLabel(row_sel, text="Feuille :", text_color=COLORS["text"]).pack(side="left", padx=(0, 10))
        self._var_feuille = ctk.StringVar(value=feuilles[0])
        ctk.CTkOptionMenu(
            row_sel, values=feuilles,
            variable=self._var_feuille,
            command=lambda _: self._afficher_feuille()
        ).pack(side="left")

        # Zone tableau
        self._frame_tableau = ctk.CTkFrame(c, fg_color=COLORS["card"], corner_radius=10)
        self._frame_tableau.pack(fill="x", padx=40, pady=12)

        self._afficher_feuille()

    def _afficher_feuille(self):
        for w in self._frame_tableau.winfo_children():
            w.destroy()

        feuille = self._var_feuille.get()
        try:
            df = pd.read_excel(str(state.fichier_resultats), sheet_name=feuille)
        except Exception as e:
            ctk.CTkLabel(self._frame_tableau, text=f"Erreur : {e}",
                         text_color=COLORS["error"]).pack(pady=10)
            return

        # Résumé
        info = carte(self._frame_tableau)
        info.pack(fill="x", padx=10, pady=(10, 4))
        ctk.CTkLabel(info,
            text=f"Feuille : {feuille}   |   {len(df)} exploitations   |   {len(df.columns)-1} série(s)",
            text_color=COLORS["sub"]
        ).pack(padx=16, pady=8)

        # Zone scrollable horizontalement et verticalement
        canvas_frame = tk.Frame(self._frame_tableau, bg=COLORS["card"])
        canvas_frame.pack(fill="both", expand=True, padx=10, pady=4)

        canvas = tk.Canvas(canvas_frame, bg=COLORS["card"], highlightthickness=0, height=400)
        scrollbar_y = tk.Scrollbar(canvas_frame, orient="vertical", command=canvas.yview)
        scrollbar_x = tk.Scrollbar(canvas_frame, orient="horizontal", command=canvas.xview)

        frame_grid = tk.Frame(canvas, bg=COLORS["card"])
        frame_grid.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=frame_grid, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar_y.set, xscrollcommand=scrollbar_x.set)

        scrollbar_y.pack(side="right", fill="y")
        scrollbar_x.pack(side="bottom", fill="x")
        canvas.pack(side="left", fill="both", expand=True)

        # Calcul largeur colonnes
        col_widths = []
        for col in df.columns:
            max_w = max(len(str(col)), df[col].astype(str).map(len).max() if len(df) > 0 else 0)
            col_widths.append(min(max_w + 2, 30))

        # En-têtes
        for j, col in enumerate(df.columns):
            tk.Label(
                frame_grid, text=str(col),
                bg="#3B4A5A", fg="white",
                font=("Segoe UI", 9, "bold"),
                width=col_widths[j], anchor="w",
                relief="ridge", padx=4
            ).grid(row=0, column=j, sticky="nsew", padx=1, pady=1)

        # Données (50 lignes max, valeurs propres sans notation scientifique)
        for i, (_, row) in enumerate(df.head(50).iterrows()):
            bg = COLORS["card"] if i % 2 == 0 else "#4A5568"
            for j, val in enumerate(row):
                if pd.isna(val):
                    texte = ""
                    couleur = "white"
                elif isinstance(val, float) and val == int(val):
                    texte = str(int(val))
                    couleur = "#EF4444" if float(val) < 40 else "white"
                elif isinstance(val, float):
                    texte = f"{val:.2f}"
                    couleur = "#EF4444" if float(val) < 40 else "white"
                else:
                    texte = str(val)
                    couleur = "white"

                tk.Label(
                    frame_grid, text=texte,
                    bg=bg, fg=couleur,
                    font=("Segoe UI", 9),
                    width=col_widths[j], anchor="w", padx=4
                ).grid(row=i + 1, column=j, sticky="nsew", padx=1, pady=1)

        if len(df) > 50:
            ctk.CTkLabel(
                self._frame_tableau,
                text="(Affichage limité à 50 lignes — ouvrez Excel pour la vue complète)",
                text_color=COLORS["sub"], font=("Segoe UI", 10)
            ).pack(pady=4)

        bouton(
            self._frame_tableau, "📂  Ouvrir dans Excel",
            lambda: ouvrir_fichier(state.fichier_resultats)
        ).pack(pady=12)

    # ── Page Tableau de bord ───────────────────────────────────────────────────

    def _page_dashboard(self):
        c = self.content

        titre(c, "📊  Tableau de bord", 22).pack(pady=(30, 10))

        if not state.traitement_ok or state.fichier_resultats is None:
            f = carte(c)
            f.pack(padx=40, pady=20, fill="x")
            ctk.CTkLabel(f,
                text="⚠️  Aucune donnée disponible.\n\n"
                     "• Chargez et traitez des fichiers source (onglet Import),\n"
                     "• ou chargez directement un fichier résultats existant\n"
                     "  via « Visualiser base sans retraiter ».",
                text_color=COLORS["warn"], font=("Segoe UI", 13),
                justify="left"
            ).pack(pady=30, padx=20)
            return

        sous_titre(c, f"Fichier : {state.fichier_resultats}").pack(pady=(0, 16))

        # ── Aperçu des graphiques ──────────────────────────────────────────────
        graphiques = [
            ("graph1.png", "Évolution PCR négatives"),
            ("graph2.png", "Répartition des catégories (scoring)"),
            ("graph3.png", "Proportion des catégories"),
            ("graph4.png", "Heatmap — intensité des négatifs"),
        ]

        nb_affiches = 0
        for nom_png, titre_graph in graphiques:
            chemin_png = BASE_DIR / nom_png
            if not chemin_png.exists():
                continue
            try:
                img_pil = PILImage.open(str(chemin_png))
                img_pil.thumbnail((600, 380), PILImage.LANCZOS)

                # Créer le PhotoImage et le stocker dans self._images
                # pour éviter qu'il soit garbage-collecté quand on change de page
                img_tk = ImageTk.PhotoImage(img_pil)
                self._images.append(img_tk)   # ← FIX BUG pages grises

                f = carte(c)
                f.pack(fill="x", padx=40, pady=8)

                ctk.CTkLabel(f, text=titre_graph,
                             font=("Segoe UI", 13, "bold"),
                             text_color=COLORS["text"]).pack(anchor="w", padx=16, pady=(10, 4))

                lbl = tk.Label(f, image=img_tk, bg=COLORS["card"], borderwidth=0)
                lbl.pack(padx=16, pady=(0, 12))

                nb_affiches += 1
            except Exception:
                pass

        if nb_affiches == 0:
            ctk.CTkLabel(c,
                text="Les graphiques seront disponibles après le prochain traitement\n"
                     "(les fichiers graph1.png … graph5.png sont générés à côté du script).",
                text_color=COLORS["sub"]
            ).pack(pady=10)

        # ── Boutons d'action ───────────────────────────────────────────────────
        row_btn = ctk.CTkFrame(c, fg_color="transparent")
        row_btn.pack(pady=20)

        bouton(
            row_btn, "📂  Ouvrir dans Excel",
            lambda: ouvrir_fichier(state.fichier_resultats),
            height=42
        ).pack(side="left", padx=10)




# ── Lancement ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app = LabVision()
    app.mainloop()