from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define

from ..types import UNSET, Unset

T = TypeVar("T", bound="UserPreferences")


@_attrs_define
class UserPreferences:
    """
    Attributes:
        diet (str | Unset): Dietary restriction or style (e.g. vegan, keto)
        allergies (list[str] | Unset): List of ingredients the user is allergic to
        about_me (list[str] | Unset): Free-form user context provided to the AI
    """

    diet: str | Unset = UNSET
    allergies: list[str] | Unset = UNSET
    about_me: list[str] | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        diet = self.diet

        allergies: list[str] | Unset = UNSET
        if not isinstance(self.allergies, Unset):
            allergies = self.allergies

        about_me: list[str] | Unset = UNSET
        if not isinstance(self.about_me, Unset):
            about_me = self.about_me

        field_dict: dict[str, Any] = {}

        field_dict.update({})
        if diet is not UNSET:
            field_dict["diet"] = diet
        if allergies is not UNSET:
            field_dict["allergies"] = allergies
        if about_me is not UNSET:
            field_dict["aboutMe"] = about_me

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        diet = d.pop("diet", UNSET)

        allergies = cast(list[str], d.pop("allergies", UNSET))

        about_me = cast(list[str], d.pop("aboutMe", UNSET))

        user_preferences = cls(
            diet=diet,
            allergies=allergies,
            about_me=about_me,
        )

        return user_preferences
