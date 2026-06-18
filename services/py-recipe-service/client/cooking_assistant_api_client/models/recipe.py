from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, cast

from attrs import define as _attrs_define
from dateutil.parser import isoparse

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
        created_at (datetime.datetime): When the recipe was saved (UTC)
        edited_at (datetime.datetime): When the recipe was last edited (UTC)
        nutrients (RecipeNutrients | Unset):
        opened_at (datetime.datetime | None | Unset): When the recipe was last opened (UTC)
    """

    title: str
    ingredients: list[RecipeIngredient]
    instructions: list[str]
    portions: float
    id: int
    created_at: datetime.datetime
    edited_at: datetime.datetime
    nutrients: RecipeNutrients | Unset = UNSET
    opened_at: datetime.datetime | None | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        ingredients = []
        for ingredients_item_data in self.ingredients:
            ingredients_item = ingredients_item_data.to_dict()
            ingredients.append(ingredients_item)

        instructions = self.instructions

        portions = self.portions

        id = self.id

        created_at = self.created_at.isoformat()

        edited_at = self.edited_at.isoformat()

        nutrients: dict[str, Any] | Unset = UNSET
        if not isinstance(self.nutrients, Unset):
            nutrients = self.nutrients.to_dict()

        opened_at: None | str | Unset
        if isinstance(self.opened_at, Unset):
            opened_at = UNSET
        elif isinstance(self.opened_at, datetime.datetime):
            opened_at = self.opened_at.isoformat()
        else:
            opened_at = self.opened_at

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions,
                "portions": portions,
                "id": id,
                "createdAt": created_at,
                "editedAt": edited_at,
            }
        )
        if nutrients is not UNSET:
            field_dict["nutrients"] = nutrients
        if opened_at is not UNSET:
            field_dict["openedAt"] = opened_at

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

        created_at = isoparse(d.pop("createdAt"))

        edited_at = isoparse(d.pop("editedAt"))

        _nutrients = d.pop("nutrients", UNSET)
        nutrients: RecipeNutrients | Unset
        if isinstance(_nutrients, Unset):
            nutrients = UNSET
        else:
            nutrients = RecipeNutrients.from_dict(_nutrients)

        def _parse_opened_at(data: object) -> datetime.datetime | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                opened_at_type_0 = isoparse(data)

                return opened_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None | Unset, data)

        opened_at = _parse_opened_at(d.pop("openedAt", UNSET))

        recipe = cls(
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            portions=portions,
            id=id,
            created_at=created_at,
            edited_at=edited_at,
            nutrients=nutrients,
            opened_at=opened_at,
        )

        return recipe
