from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="RecipeNutrients")


@_attrs_define
class RecipeNutrients:
    """
    Attributes:
        calories (int | Unset):
        protein (int | Unset):
        fat (int | Unset):
        carbs (int | Unset):
    """

    calories: int | Unset = UNSET
    protein: int | Unset = UNSET
    fat: int | Unset = UNSET
    carbs: int | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        calories = self.calories

        protein = self.protein

        fat = self.fat

        carbs = self.carbs

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if calories is not UNSET:
            field_dict["calories"] = calories
        if protein is not UNSET:
            field_dict["protein"] = protein
        if fat is not UNSET:
            field_dict["fat"] = fat
        if carbs is not UNSET:
            field_dict["carbs"] = carbs

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        calories = d.pop("calories", UNSET)

        protein = d.pop("protein", UNSET)

        fat = d.pop("fat", UNSET)

        carbs = d.pop("carbs", UNSET)

        recipe_nutrients = cls(
            calories=calories,
            protein=protein,
            fat=fat,
            carbs=carbs,
        )

        recipe_nutrients.additional_properties = d
        return recipe_nutrients

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
