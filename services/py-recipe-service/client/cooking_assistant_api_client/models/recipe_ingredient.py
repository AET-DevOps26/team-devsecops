from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define

T = TypeVar("T", bound="RecipeIngredient")


@_attrs_define
class RecipeIngredient:
    """
    Attributes:
        quantity (float):
        unit (str): Unit of measurement (e.g. g, ml, cup, tbsp)
        name (str):
    """

    quantity: float
    unit: str
    name: str

    def to_dict(self) -> dict[str, Any]:
        quantity = self.quantity

        unit = self.unit

        name = self.name

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "quantity": quantity,
                "unit": unit,
                "name": name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        quantity = d.pop("quantity")

        unit = d.pop("unit")

        name = d.pop("name")

        recipe_ingredient = cls(
            quantity=quantity,
            unit=unit,
            name=name,
        )

        return recipe_ingredient
