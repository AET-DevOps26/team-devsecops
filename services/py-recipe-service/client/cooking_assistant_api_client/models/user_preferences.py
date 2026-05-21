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
        diet (None | str | Unset): Dietary restriction or style (e.g. vegan, keto)
        allergies (list[str] | None | Unset): List of ingredients the user is allergic to
        about_me (list[str] | None | Unset): Free-form user context provided to the AI
    """

    diet: None | str | Unset = UNSET
    allergies: list[str] | None | Unset = UNSET
    about_me: list[str] | None | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        diet: None | str | Unset
        if isinstance(self.diet, Unset):
            diet = UNSET
        else:
            diet = self.diet

        allergies: list[str] | None | Unset
        if isinstance(self.allergies, Unset):
            allergies = UNSET
        elif isinstance(self.allergies, list):
            allergies = self.allergies

        else:
            allergies = self.allergies

        about_me: list[str] | None | Unset
        if isinstance(self.about_me, Unset):
            about_me = UNSET
        elif isinstance(self.about_me, list):
            about_me = self.about_me

        else:
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

        def _parse_diet(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        diet = _parse_diet(d.pop("diet", UNSET))

        def _parse_allergies(data: object) -> list[str] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                allergies_type_0 = cast(list[str], data)

                return allergies_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None | Unset, data)

        allergies = _parse_allergies(d.pop("allergies", UNSET))

        def _parse_about_me(data: object) -> list[str] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                about_me_type_0 = cast(list[str], data)

                return about_me_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None | Unset, data)

        about_me = _parse_about_me(d.pop("aboutMe", UNSET))

        user_preferences = cls(
            diet=diet,
            allergies=allergies,
            about_me=about_me,
        )

        return user_preferences
