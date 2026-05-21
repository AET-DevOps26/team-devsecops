from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define

T = TypeVar("T", bound="RecipeNutrients")


@_attrs_define
class RecipeNutrients:
    """
    Attributes:
        calories (int):
        protein (int): Protein in grams
        fat (int): Fat in grams
        carbs (int): Carbohydrates in grams
    """

    calories: int
    protein: int
    fat: int
    carbs: int

    def to_dict(self) -> dict[str, Any]:
        calories = self.calories

        protein = self.protein

        fat = self.fat

        carbs = self.carbs

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "calories": calories,
                "protein": protein,
                "fat": fat,
                "carbs": carbs,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        calories = d.pop("calories")

        protein = d.pop("protein")

        fat = d.pop("fat")

        carbs = d.pop("carbs")

        recipe_nutrients = cls(
            calories=calories,
            protein=protein,
            fat=fat,
            carbs=carbs,
        )

        return recipe_nutrients
