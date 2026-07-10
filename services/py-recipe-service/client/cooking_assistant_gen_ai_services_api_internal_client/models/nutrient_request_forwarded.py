from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define

if TYPE_CHECKING:
    from ..models.recipe_input import RecipeInput


T = TypeVar("T", bound="NutrientRequestForwarded")


@_attrs_define
class NutrientRequestForwarded:
    """
    Attributes:
        recipe (RecipeInput):
    """

    recipe: RecipeInput

    def to_dict(self) -> dict[str, Any]:
        recipe = self.recipe.to_dict()

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "recipe": recipe,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_input import RecipeInput

        d = dict(src_dict)
        recipe = RecipeInput.from_dict(d.pop("recipe"))

        nutrient_request_forwarded = cls(
            recipe=recipe,
        )

        return nutrient_request_forwarded
