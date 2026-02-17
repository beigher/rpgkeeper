//----------------------------------------------------------------------------------------------------------------------
// Dolmenwood - Models
//----------------------------------------------------------------------------------------------------------------------

export interface AbilityBlock
{
    score : number;
    mod : number;
}

export interface DolmenwoodAbilities
{
    str : AbilityBlock;
    int : AbilityBlock;
    wis : AbilityBlock;
    dex : AbilityBlock;
    con : AbilityBlock;
    cha : AbilityBlock;
}

export interface DolmenwoodSaves
{
    doom : number;
    hold : number;
    spell : number;
    magic : number;
    ray : number;
    blast : number;
    resistance : number;
}

export interface DolmenwoodMovement
{
    speedRoundFt : number;     // feet / round
    exploringTurnFt : number;  // feet / turn
    overlandPtsDay : number;   // points / day
}

export interface DolmenwoodSkills
{
    listen : number;
    search : number;
    survival : number;
    modifier : number;
}

export type EncumbranceMethod = 'weight' | 'slots';

export interface DolmenwoodCoins
{
    cp : number;
    sp : number;
    gp : number;
    pell : number; // pellucidium
}

export interface DolmenwoodInventory
{
    encumbranceMethod : EncumbranceMethod;

    tinyItems : string;

    equippedItems : string; // newline separated for MVP
    stowedItems : string;   // newline separated for MVP

    totalWeight : number;   // user-entered for MVP

    coins : DolmenwoodCoins;

    otherNotes : string;
}

export interface DolmenwoodIdentity
{
    kindredClass : string;
    background : string;
    alignment : string;
    affiliation : string;
    moonSign : string;
}

export interface DolmenwoodAdvancement
{
    xp : number;
    level : number;
    nextLevel : number;
}

export interface DolmenwoodSystemDetails
{
    // Page 1 - Identity / core
    identity : DolmenwoodIdentity;

    // Page 1 - Abilities / combat / movement / saves
    abilities : DolmenwoodAbilities;

    hpCurrent : number;
    hpMax : number;

    ac : number;
    attack : number;

    saves : DolmenwoodSaves;
    movement : DolmenwoodMovement;
    skills : DolmenwoodSkills;

    advancement : DolmenwoodAdvancement;

    languages : string; // MVP: newline-separated list
    classTraits : string;

    // Page 2 - Inventory / encumbrance / coins / notes
    inventory : DolmenwoodInventory;
}

//----------------------------------------------------------------------------------------------------------------------
