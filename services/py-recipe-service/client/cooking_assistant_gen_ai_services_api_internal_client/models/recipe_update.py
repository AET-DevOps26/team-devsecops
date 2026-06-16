from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.recipe_ingredient import RecipeIngredient
    from ..models.recipe_nutrients import RecipeNutrients


T = TypeVar("T", bound="RecipeUpdate")


@_attrs_define
class RecipeUpdate:
    """At least one field must be provided

    Attributes:
        title (str | Unset):
        ingredients (list[RecipeIngredient] | Unset):
        instructions (list[str] | Unset):
        portions (float | Unset):
        nutrients (RecipeNutrients | Unset):
    """

    title: str | Unset = UNSET
    ingredients: list[RecipeIngredient] | Unset = UNSET
    instructions: list[str] | Unset = UNSET
    portions: float | Unset = UNSET
    nutrients: RecipeNutrients | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        ingredients: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.ingredients, Unset):
            ingredients = []
            for ingredients_item_data in self.ingredients:
                ingredients_item = ingredients_item_data.to_dict()
                ingredients.append(ingredients_item)

        instructions: list[str] | Unset = UNSET
        if not isinstance(self.instructions, Unset):
            instructions = self.instructions

        portions = self.portions

        nutrients: dict[str, Any] | Unset = UNSET
        if not isinstance(self.nutrients, Unset):
            nutrients = self.nutrients.to_dict()

        field_dict: dict[str, Any] = {}

        field_dict.update({})
        if title is not UNSET:
            field_dict["title"] = title
        if ingredients is not UNSET:
            field_dict["ingredients"] = ingredients
        if instructions is not UNSET:
            field_dict["instructions"] = instructions
        if portions is not UNSET:
            field_dict["portions"] = portions
        if nutrients is not UNSET:
            field_dict["nutrients"] = nutrients

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_ingredient import RecipeIngredient
        from ..models.recipe_nutrients import RecipeNutrients

        d = dict(src_dict)
        title = d.pop("title", UNSET)

        _ingredients = d.pop("ingredients", UNSET)
        ingredients: list[RecipeIngredient] | Unset = UNSET
        if _ingredients is not UNSET:
            ingredients = []
            for ingredients_item_data in _ingredients:
                ingredients_item = RecipeIngredient.from_dict(ingredients_item_data)

                ingredients.append(ingredients_item)

        instructions = cast(list[str], d.pop("instructions", UNSET))

        portions = d.pop("portions", UNSET)

        _nutrients = d.pop("nutrients", UNSET)
        nutrients: RecipeNutrients | Unset
        if isinstance(_nutrients, Unset):
            nutrients = UNSET
        else:
            nutrients = RecipeNutrients.from_dict(_nutrients)

        recipe_update = cls(
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            portions=portions,
            nutrients=nutrients,
        )

        return recipe_update
