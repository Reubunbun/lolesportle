<?php
namespace App\Enum;

enum GuessResponse : int
{
    case CORRECT = 1;
    case INCORRECT = 2;
    case PARTIAL = 3;
    case HIGHER = 4;
    case LOWER = 5;

    function toString(?string $extraDetails = null) : string
    {
        $emoji =  match ($this) {
            self::CORRECT => "✅",
            self::INCORRECT => "❌",
            self::PARTIAL => "⚠️",
            self::HIGHER => "🔺",
            self::LOWER => "🔻",
        };

        return $emoji . ($extraDetails ? " ($extraDetails)" : '');
    }
}
