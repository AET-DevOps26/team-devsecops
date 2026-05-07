from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.recipe_nutrients import RecipeNutrients


T = TypeVar("T", bound="Recipe")


@_attrs_define
class Recipe:
    """
    Attributes:
        title (str):
        ingredients (list[str]):
        instructions (str):
        portions (int):
        nutrients (RecipeNutrients):
    """

    title: str
    ingredients: list[str]
    instructions: str
    portions: int
    nutrients: RecipeNutrients
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        ingredients = self.ingredients

        instructions = self.instructions

        portions = self.portions

        nutrients = self.nutrients.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions,
                "portions": portions,
                "nutrients": nutrients,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_nutrients import RecipeNutrients

        d = dict(src_dict)
        title = d.pop("title")

        ingredients = cast(list[str], d.pop("ingredients"))

        instructions = d.pop("instructions")

        portions = d.pop("portions")

        nutrients = RecipeNutrients.from_dict(d.pop("nutrients"))

        recipe = cls(
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            portions=portions,
            nutrients=nutrients,
        )

        recipe.additional_properties = d
        return recipe

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
