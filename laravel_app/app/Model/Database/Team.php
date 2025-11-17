<?php
namespace App\Model\Database;

class Team extends AbstractModel
{
    const COL_URL = 'url';
    const COL_LINKED_TEAM = 'linked_team';
    const COL_NAME = 'name';
    const COL_ICON_PATH = 'icon_path';

    private string $url;
    private ?string $linkedTeam;
    private string $name;
    private ?string $iconPath;

    static function createFromTableRow(\stdClass $row) : static
    {
        $team = new self();
        $team->url = $row->{self::COL_URL};
        $team->linkedTeam = $row->{self::COL_LINKED_TEAM} ?? null;
        $team->name = $row->{self::COL_NAME};
        $team->iconPath = $row->{self::COL_ICON_PATH} ?? null;
        return $team;
    }
}
