from enum import Enum


class Language(str, Enum):
    DE = "DE"
    EN = "EN"
    HU = "HU"

    def __str__(self) -> str:
        return str(self.value)
