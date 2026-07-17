from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define

from ..types import UNSET, Unset

T = TypeVar("T", bound="RecipeIngredient")


@_attrs_define
class RecipeIngredient:
    """A measured ingredient has both quantity and unit ("200 g flour"); a counted one has a quantity only ("2 eggs"); one
    added to taste has neither ("salt"). A unit without a quantity is meaningless and is rejected by the recipe editor,
    though the contract tolerates it.

        Attributes:
            name (str):
            quantity (float | Unset): Amount of the ingredient. Omitted when the ingredient is added to taste.
            unit (str | Unset): Unit of measurement (e.g. g, ml, cup, tbsp). Omitted when the ingredient is counted as whole
                items rather than measured.
    """

    name: str
    quantity: float | Unset = UNSET
    unit: str | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        quantity = self.quantity

        unit = self.unit

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "name": name,
            }
        )
        if quantity is not UNSET:
            field_dict["quantity"] = quantity
        if unit is not UNSET:
            field_dict["unit"] = unit

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        name = d.pop("name")

        quantity = d.pop("quantity", UNSET)

        unit = d.pop("unit", UNSET)

        recipe_ingredient = cls(
            name=name,
            quantity=quantity,
            unit=unit,
        )

        return recipe_ingredient
