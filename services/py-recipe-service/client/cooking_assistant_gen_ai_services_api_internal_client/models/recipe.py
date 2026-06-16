from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.recipe_ingredient import RecipeIngredient
    from ..models.recipe_nutrients import RecipeNutrients


T = TypeVar("T", bound="Recipe")


@_attrs_define
class Recipe:
    """
    Attributes:
        title (str):
        ingredients (list[RecipeIngredient]):
        instructions (list[str]):
        portions (float):
        id (int):
        nutrients (RecipeNutrients | Unset):
    """

    title: str
    ingredients: list[RecipeIngredient]
    instructions: list[str]
    portions: float
    id: int
    nutrients: RecipeNutrients | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        ingredients = []
        for ingredients_item_data in self.ingredients:
            ingredients_item = ingredients_item_data.to_dict()
            ingredients.append(ingredients_item)

        instructions = self.instructions

        portions = self.portions

        id = self.id

        nutrients: dict[str, Any] | Unset = UNSET
        if not isinstance(self.nutrients, Unset):
            nutrients = self.nutrients.to_dict()

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions,
                "portions": portions,
                "id": id,
            }
        )
        if nutrients is not UNSET:
            field_dict["nutrients"] = nutrients

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_ingredient import RecipeIngredient
        from ..models.recipe_nutrients import RecipeNutrients

        d = dict(src_dict)
        title = d.pop("title")

        ingredients = []
        _ingredients = d.pop("ingredients")
        for ingredients_item_data in _ingredients:
            ingredients_item = RecipeIngredient.from_dict(ingredients_item_data)

            ingredients.append(ingredients_item)

        instructions = cast(list[str], d.pop("instructions"))

        portions = d.pop("portions")

        id = d.pop("id")

        _nutrients = d.pop("nutrients", UNSET)
        nutrients: RecipeNutrients | Unset
        if isinstance(_nutrients, Unset):
            nutrients = UNSET
        else:
            nutrients = RecipeNutrients.from_dict(_nutrients)

        recipe = cls(
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            portions=portions,
            id=id,
            nutrients=nutrients,
        )

        return recipe
