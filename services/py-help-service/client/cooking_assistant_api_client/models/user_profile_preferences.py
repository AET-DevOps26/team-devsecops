from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="UserProfilePreferences")


@_attrs_define
class UserProfilePreferences:
    """
    Attributes:
        diet (str | Unset):
        allergies (list[str] | Unset):
        cuisine_preferences (list[str] | Unset):
    """

    diet: str | Unset = UNSET
    allergies: list[str] | Unset = UNSET
    cuisine_preferences: list[str] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        diet = self.diet

        allergies: list[str] | Unset = UNSET
        if not isinstance(self.allergies, Unset):
            allergies = self.allergies

        cuisine_preferences: list[str] | Unset = UNSET
        if not isinstance(self.cuisine_preferences, Unset):
            cuisine_preferences = self.cuisine_preferences

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if diet is not UNSET:
            field_dict["diet"] = diet
        if allergies is not UNSET:
            field_dict["allergies"] = allergies
        if cuisine_preferences is not UNSET:
            field_dict["cuisinePreferences"] = cuisine_preferences

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        diet = d.pop("diet", UNSET)

        allergies = cast(list[str], d.pop("allergies", UNSET))

        cuisine_preferences = cast(list[str], d.pop("cuisinePreferences", UNSET))

        user_profile_preferences = cls(
            diet=diet,
            allergies=allergies,
            cuisine_preferences=cuisine_preferences,
        )

        user_profile_preferences.additional_properties = d
        return user_profile_preferences

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
