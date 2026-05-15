from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.recipe_ingredient import RecipeIngredient
    from ..models.recipe_nutrients import RecipeNutrients


T = TypeVar("T", bound="RecipeInput")


@_attrs_define
class RecipeInput:
    """
    Attributes:
        title (str):
        ingredients (list[RecipeIngredient]):
        instructions (list[str]):
        portions (int):
        nutrients (RecipeNutrients | Unset):
    """

    title: str
    ingredients: list[RecipeIngredient]
    instructions: list[str]
    portions: int
    nutrients: RecipeNutrients | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        ingredients = []
        for ingredients_item_data in self.ingredients:
            ingredients_item = ingredients_item_data.to_dict()
            ingredients.append(ingredients_item)

        instructions = self.instructions

        portions = self.portions

        nutrients: dict[str, Any] | Unset = UNSET
        if not isinstance(self.nutrients, Unset):
            nutrients = self.nutrients.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions,
                "portions": portions,
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

        _nutrients = d.pop("nutrients", UNSET)
        nutrients: RecipeNutrients | Unset
        if isinstance(_nutrients, Unset):
            nutrients = UNSET
        else:
            nutrients = RecipeNutrients.from_dict(_nutrients)

        recipe_input = cls(
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            portions=portions,
            nutrients=nutrients,
        )

        recipe_input.additional_properties = d
        return recipe_input

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
