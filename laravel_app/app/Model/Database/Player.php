<?php
namespace App\Model\Database;

class Player extends AbstractModel
{
    const COL_URL = 'url';
    const COL_LINKED_PLAYER = 'linked_player';
    const COL_NAME = 'name';
    const COL_ICON_PATH = 'icon_path';
    const COL_NATIONALITIES = 'nationalities';
    const COL_PAGE_MISSING = 'page_missing';

    private string $url;
    private ?string $linkedPlayer;
    private string $name;
    private ?string $iconPath;
    /** @var string[] */
    private array $nationalities;
    /** @var string[] */
    private array $altUrls = [];

    /** @param string[] $altUrls */
    static function createFromTableRow(
        \stdClass $row,
        array $altUrls = [],
    ) : static
    {
        $player = new self();
        $player->url = $row->{self::COL_URL};
        $player->linkedPlayer =
             $row->{self::COL_LINKED_PLAYER} ?? null;
        $player->name = $row->{self::COL_NAME};
        $player->iconPath = $row->{self::COL_ICON_PATH} ?? null;
        $player->nationalities = json_decode(
            $row->{self::COL_NATIONALITIES} ?? '[]',
            true,
        );
        $player->altUrls = $altUrls;
        return $player;
    }

    function getUrl() : string
    {
        return $this->url;
    }

    function getName() : string
    {
        return $this->name;
    }

    /** @return string[] */
    function getAllUrls() : array
    {
        return [$this->url, ...$this->altUrls];
    }

    /** @return string[] */
    function getNationalities() : array
    {
        return $this->nationalities;
    }
}
