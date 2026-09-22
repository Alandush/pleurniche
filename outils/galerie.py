"""Met à jour la galerie de la page « Nos tatouages ».

Un navigateur ne peut pas lire le contenu d'un dossier : la page s'appuie donc
sur images/tatouages/galerie.json, que ce script régénère à partir des images
réellement présentes dans le dossier.

    python outils/galerie.py

- Chaque image du dossier (webp, jpg, jpeg, png, avif, gif) apparaît dans la page.
- Une image supprimée du dossier disparaît de la page.
- Les champs « alt » et « type » déjà saisis dans galerie.json sont conservés.
- Chaque image a un type : "cadre" (dessin encadré) ou "tatouage" (photo sur peau).
  Une nouvelle image dont le nom contient « cadre » devient un cadre, les autres
  des tatouages ; corriger au besoin le champ « type » dans galerie.json.
- La page dispose les images en damier : chaque colonne alterne cadre et
  tatouage (dans l'ordre des noms de fichiers au sein de chaque type). S'il y a
  plus d'images d'un type, le surplus complète la fin de la galerie.
"""

import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "images" / "tatouages"
MANIFESTE = DOSSIER / "galerie.json"
EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}
TYPES = ("cadre", "tatouage")


def cle_tri(chemin):
    """Tri naturel : les nombres sont comparés comme des nombres."""
    return [int(m) if m.isdigit() else m.lower() for m in re.split(r"(\d+)", chemin.name)]


def lire_manifeste():
    if not MANIFESTE.exists():
        return {}
    try:
        donnees = json.loads(MANIFESTE.read_text(encoding="utf-8"))
        return {e["fichier"]: e for e in donnees.get("images", [])}
    except (ValueError, KeyError, TypeError):
        print("galerie.json illisible : il est recréé (les alt existants sont perdus).")
        return {}


def main():
    if not DOSSIER.is_dir():
        sys.exit(f"Dossier introuvable : {DOSSIER}")

    anciens = lire_manifeste()
    fichiers = sorted(
        (p for p in DOSSIER.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONS),
        key=cle_tri,
    )
    images, devines = [], []
    for p in fichiers:
        ancien = anciens.get(p.name, {})
        type_ = ancien.get("type")
        if type_ not in TYPES:
            type_ = "cadre" if "cadre" in p.stem.lower() else "tatouage"
            devines.append(f"{p.name} → {type_}")
        images.append({"fichier": p.name, "type": type_, "alt": ancien.get("alt", "")})

    # L'alternance cadre / tatouage est faite par la page (js/galerie.js) :
    # le fichier reste simplement dans l'ordre des noms.
    cadres = [i for i in images if i["type"] == "cadre"]
    tatouages = [i for i in images if i["type"] == "tatouage"]

    MANIFESTE.write_text(
        json.dumps({"images": images}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    presents = {i["fichier"] for i in images}
    ajoutes = [f for f in presents if f not in anciens]
    retires = [f for f in anciens if f not in presents]
    sans_alt = [i["fichier"] for i in images if not i["alt"]]

    print(f"{len(images)} image(s) dans la galerie : {len(cadres)} cadre(s), {len(tatouages)} tatouage(s).")
    if ajoutes:
        print(f"  + ajoutée(s) : {', '.join(sorted(ajoutes))}")
    if retires:
        print(f"  - retirée(s) : {', '.join(sorted(retires))}")
    if devines:
        print("  type attribué d'après le nom (à vérifier dans galerie.json) :")
        for ligne in devines:
            print(f"    {ligne}")
    if sans_alt:
        print(f"  {len(sans_alt)} sans texte alternatif (à compléter dans galerie.json).")


if __name__ == "__main__":
    main()
