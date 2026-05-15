from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="UserPreferences")


@_attrs_define
class UserPreferences:
    """
    Attributes:
        diet (str | Unset):
        allergies (list[str] | Unset):
        about_me (list[str] | Unset):
    """

    diet: str | Unset = UNSET
    allergies: list[str] | Unset = UNSET
    about_me: list[str] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        diet = self.diet

        allergies: list[str] | Unset = UNSET
        if not isinstance(self.allergies, Unset):
            allergies = self.allergies

        about_me: list[str] | Unset = UNSET
        if not isinstance(self.about_me, Unset):
            about_me = self.about_me

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
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

        user_preferences.additional_properties = d
        return user_preferences

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
