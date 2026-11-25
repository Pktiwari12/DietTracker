import os
import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

NUTRIENT_COLS = [
    "energy_kcal",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "calcium_mg",
    "iron_mg",
    "vit_c_mg",
]


def normalize_query(q: str) -> str:
    q = re.sub(r"\([^)]*\)", " ", str(q or "").lower())
    q = re.sub(r"[^a-z0-9\s]", " ", q)
    return re.sub(r"\s+", " ", q).strip()


class NutritionEngine:
    def __init__(
        self,
        csv_path: str,
        embedding_model: str = "all-MiniLM-L6-v2",
        emb_threshold: float = 0.62,
    ):
        self.csv_path = csv_path
        self.emb_threshold = emb_threshold
        self.db = pd.read_csv(csv_path).copy()
        self.db["canon_lower"] = self.db["canonical_name"].fillna("").astype(str).str.lower().str.strip()
        self.db["syn_lower"] = self.db["synonyms"].fillna("").astype(str).str.lower().str.strip()
        self.db["combined_text"] = (
            self.db["canonical_name"].fillna("").astype(str)
            + " | "
            + self.db["synonyms"].fillna("").astype(str)
        )

        # Load SentenceTransformer for semantic fallback (all-MiniLM-L6-v2)
        self.embedder = None
        self.emb_matrix = None
        try:
            from sentence_transformers import SentenceTransformer

            self.embedder = SentenceTransformer(embedding_model)
            self.emb_matrix = self.embedder.encode(
                self.db["combined_text"].astype(str).tolist(),
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        except Exception as exc:
            # Exact canonical, exact synonym, and word-boundary matching still work without embeddings
            print(f"[NutritionEngine] Warning: SentenceTransformer unavailable ({exc}). Using lexical matching only.")

    def search_foods(self, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        q = normalize_query(query)
        cols = [
            "food_id",
            "canonical_name",
            "source",
            "default_unit_name",
            "default_unit_grams",
            *NUTRIENT_COLS,
        ]
        avail_cols = [c for c in cols if c in self.db.columns]
        if not q:
            return self.db[avail_cols].head(limit).to_dict(orient="records")
        mask = (
            self.db["canon_lower"].str.contains(re.escape(q), na=False)
            | self.db["syn_lower"].str.contains(re.escape(q), na=False)
        )
        return self.db.loc[mask, avail_cols].head(limit).to_dict(orient="records")

    def find_best_row(self, query: str) -> Tuple[Optional[pd.Series], float, str]:
        norm_q = normalize_query(query)
        if not norm_q:
            return None, 0.0, "empty"

        exact_c = self.db[self.db["canon_lower"] == norm_q]
        if not exact_c.empty:
            return exact_c.iloc[0], 1.0, "exact_canonical"

        syn_matches = []
        for idx, syn_str in enumerate(self.db["syn_lower"]):
            syn_list = [s.strip() for s in syn_str.split("|") if s.strip()]
            if norm_q in syn_list:
                syn_matches.append(self.db.iloc[idx])
        if syn_matches:
            mdf = pd.DataFrame(syn_matches)
            mdf["_is_ref"] = mdf["food_id"].astype(str).str.startswith("REF_").astype(int)
            mdf["_len"] = mdf["canon_lower"].str.len()
            best = mdf.sort_values(["_is_ref", "_len"], ascending=[False, True]).iloc[0]
            return best, 0.96, "exact_synonym"

        pattern = r"(?<![a-z0-9])" + re.escape(norm_q) + r"(?![a-z0-9])"
        hits = self.db[
            self.db["canon_lower"].str.contains(pattern, regex=True, na=False)
            | self.db["syn_lower"].str.contains(pattern, regex=True, na=False)
        ]
        if not hits.empty:
            hcopy = hits.copy()
            hcopy["_is_ref"] = hcopy["food_id"].astype(str).str.startswith("REF_").astype(int)
            hcopy["_len"] = hcopy["canon_lower"].str.len()
            best_hit = hcopy.sort_values(["_is_ref", "_len"], ascending=[False, True]).iloc[0]
            return best_hit, 0.88, "word_match"

        if self.embedder is not None and self.emb_matrix is not None:
            q_emb = self.embedder.encode([norm_q], normalize_embeddings=True, show_progress_bar=False)[0]
            sims = np.dot(self.emb_matrix, q_emb)
            idx = int(np.argmax(sims))
            best_sim = float(sims[idx])
            if best_sim >= self.emb_threshold:
                return self.db.iloc[idx], best_sim, "semantic"
            return None, best_sim, "unmatched"

        return None, 0.0, "unmatched"

    def calculate_nutrients(
        self,
        detected_output: Dict[str, Any],
        delete_names: Optional[List[str]] = None,
        rename_map: Optional[Dict[str, str]] = None,
        add_items: Optional[List[Dict[str, Any]]] = None,
        user_quantities: Optional[Dict[str, Dict[str, Any]]] = None,
        fallback_grams: float = 100.0,
    ) -> Dict[str, Any]:
        deleted = {normalize_query(x) for x in (delete_names or [])}
        renames = {normalize_query(k): v for k, v in (rename_map or {}).items()}
        qty_map = {normalize_query(k): v for k, v in (user_quantities or {}).items()}

        working_entries: List[Tuple[str, str, bool]] = []  # (label, confidence, is_topping)
        for item in detected_output.get("items", []):
            raw_name = str(item.get("name", "")).strip()
            conf = str(item.get("confidence", "high")).lower()
            if not raw_name:
                continue
            nk = normalize_query(raw_name)
            if nk in deleted:
                continue
            working_entries.append((renames.get(nk, raw_name), conf, False))

            for top in item.get("visible_toppings", []):
                tname = str(top).strip()
                if not tname:
                    continue
                tnk = normalize_query(tname)
                if tnk in deleted:
                    continue
                working_entries.append((renames.get(tnk, tname), conf, True))

        extra_qty_map = dict(qty_map)
        for added in (add_items or []):
            aname = str(added.get("name", "")).strip()
            if not aname:
                continue
            working_entries.append((aname, "high", False))
            if "quantity" in added:
                extra_qty_map[normalize_query(aname)] = {
                    "quantity": added["quantity"],
                    "unit_type": added.get("unit_type", "grams"),
                }

        totals = {c: 0.0 for c in NUTRIENT_COLS}
        items_detail: List[Dict[str, Any]] = []
        seen = set()

        for label, conf, is_topping in working_entries:
            key = normalize_query(label)
            if not key or key in seen:
                continue
            seen.add(key)

            row, sim, method = self.find_best_row(label)
            if row is None:
                items_detail.append({
                    "input_name": label,
                    "matched_name": None,
                    "confidence": conf,
                    "is_topping": is_topping,
                    "status": "unmatched",
                    "best_sim": round(sim, 2),
                })
                continue

            u_name = str(row.get("default_unit_name", "serving / bowl"))
            u_grams = float(row.get("default_unit_grams", 150.0) or 150.0)
            q_spec = extra_qty_map.get(key)

            if q_spec is not None:
                qty_val = float(q_spec.get("quantity", fallback_grams))
                u_type = str(q_spec.get("unit_type", "grams")).lower()
                if u_type in ("grams", "g", "gram"):
                    grams = qty_val
                    weight_label = f"{grams:.1f}g"
                else:
                    grams = qty_val * u_grams
                    weight_label = f"{qty_val:g} x {u_name} ({grams:.1f}g)"
            else:
                # Default to 1 default unit if topping or fallback_grams
                if is_topping:
                    grams = u_grams
                    weight_label = f"1 x {u_name} ({grams:.1f}g)"
                else:
                    grams = float(fallback_grams)
                    weight_label = f"{grams:.1f}g (default)"

            scale = grams / 100.0
            nutr = {c: round(float(row.get(c, 0.0) or 0.0) * scale, 2) for c in NUTRIENT_COLS}
            for c in NUTRIENT_COLS:
                totals[c] += float(row.get(c, 0.0) or 0.0) * scale

            items_detail.append({
                "input_name": label,
                "matched_name": row["canonical_name"],
                "food_id": str(row["food_id"]),
                "source": str(row["source"]),
                "match_method": method,
                "confidence": conf,
                "is_topping": is_topping,
                "status": "matched",
                "weight_label": weight_label,
                "grams_used": round(grams, 2),
                "default_unit_name": u_name,
                "default_unit_grams": u_grams,
                **nutr,
            })

        return {
            "totals": {k: round(v, 2) for k, v in totals.items()},
            "items": items_detail,
        }


_engine_instance: Optional[NutritionEngine] = None


def get_nutrition_engine(csv_path: str) -> NutritionEngine:
    global _engine_instance
    if _engine_instance is None or _engine_instance.csv_path != csv_path:
        if not os.path.exists(csv_path):
            raise FileNotFoundError(
                f"master_nutrition.csv not found at {csv_path}. Place it in DietTracker/backend/data/master_nutrition.csv"
            )
        _engine_instance = NutritionEngine(csv_path=csv_path)
    return _engine_instance
