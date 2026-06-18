from enum import Enum


class RecipeRequestLanguage(str, Enum):
    DE = "DE"
    EN = "EN"
    HU = "HU"

    def __str__(self) -> str:
        return str(self.value)
